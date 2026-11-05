import { execFileSync } from 'child_process';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import { initializeApp as initializeFirebaseServerApp } from 'firebase/app';
import {
  deleteDoc as deleteFirestoreDoc,
  doc as firestoreDoc,
  getFirestore as getServerFirestore,
  serverTimestamp as firestoreServerTimestamp,
  setDoc as setFirestoreDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverFirebaseApp = initializeFirebaseServerApp(firebaseConfig, 'vynoox-admin-server');
const serverDb = getServerFirestore(serverFirebaseApp, firebaseConfig.firestoreDatabaseId);
const SERVER_LEASE_SEAL = 'vynoox_srv_seal_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a';

const PORT = 3000;
const PAYMENT_SECRET =
  process.env.RAZORPAY_KEY_SECRET || 'vynoox_hmac_server_secret_key_2026';

// Ephemeral + env-backed session signing secret (never exposed to browser)
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHash('sha256').update(`${PAYMENT_SECRET}|vynoox_admin_session_v1`).digest('hex');

const SESSION_COOKIE_NAME = 'vynoox_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Server-side private directory for hashed admin credentials and binary media storage
const DATA_DIR = path.join(__dirname, '.data');
const ADMIN_VAULT_FILE = path.join(DATA_DIR, 'admin-vault.json');
const STORAGE_ROOT_DIR = path.join(DATA_DIR, 'storage', 'vynoox_media');

const ALLOWED_MEDIA_CATEGORIES = new Set([
  'hero_desktop',
  'hero_mobile',
  'ugc_video',
  'product_media',
  'general',
]);

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4']);
const MAX_IMAGE_BYTES =
  Math.max(5, Number(process.env.MAX_IMAGE_UPLOAD_MB) || 25) * 1024 * 1024; // Default 25 MB
const MAX_VIDEO_BYTES =
  Math.max(10, Number(process.env.MAX_VIDEO_UPLOAD_MB) || 120) * 1024 * 1024; // Default 120 MB
const FINGERPRINT_INDEX_FILE = path.join(DATA_DIR, 'media-fingerprints.json');

interface StoredMediaFingerprint {
  fingerprint: string;
  mediaId: string;
  fileName: string;
  storedFileName: string;
  fileType: string;
  mediaType: 'image' | 'video';
  mediaCategory: string;
  storagePath: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

function loadMediaFingerprints(): Record<string, StoredMediaFingerprint> {
  try {
    if (!fs.existsSync(FINGERPRINT_INDEX_FILE)) return {};
    return JSON.parse(fs.readFileSync(FINGERPRINT_INDEX_FILE, 'utf8')) || {};
  } catch {
    return {};
  }
}

function saveMediaFingerprints(index: Record<string, StoredMediaFingerprint>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(FINGERPRINT_INDEX_FILE, JSON.stringify(index, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  } catch {
    // Non-blocking fingerprint index write
  }
}

function sanitizeStorageToken(raw: string): string {
  return (
    raw
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120) || `file-${Date.now()}`
  );
}

function sanitizeLeaseId(raw: string): string {
  return (
    raw
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120) || `lease-${Date.now()}`
  );
}

export type ServerAdminRole =
  | 'Super Admin'
  | 'Admin'
  | 'Product Manager'
  | 'Order Manager'
  | 'Content Manager';

interface StoredAdminCredential {
  id: string;
  username: string;
  salt: string;
  passwordHash: string;
  role: ServerAdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AdminSessionRecord {
  sessionId: string;
  username: string;
  role: ServerAdminRole;
  issuedAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  event: string;
  username: string;
  ip: string;
  status: 'success' | 'blocked' | 'failed';
  details: string;
}

const ADMIN_SESSIONS_FILE = path.join(DATA_DIR, 'admin-sessions.json');
const activeAdminSessions = new Map<string, AdminSessionRecord>();
const revokedSessionIds = new Set<string>();
const securityAuditEvents: SecurityAuditEvent[] = [];

function loadPersistedSessions() {
  try {
    if (!fs.existsSync(ADMIN_SESSIONS_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(ADMIN_SESSIONS_FILE, 'utf8'));
    if (Array.isArray(raw?.sessions)) {
      for (const s of raw.sessions) {
        if (s?.sessionId && s.expiresAt > Date.now()) {
          activeAdminSessions.set(s.sessionId, s);
        }
      }
    }
    if (Array.isArray(raw?.revoked)) {
      for (const r of raw.revoked) {
        if (typeof r === 'string') revokedSessionIds.add(r);
      }
    }
  } catch {
    // Ignore corrupted session file
  }
}

function savePersistedSessions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(
      ADMIN_SESSIONS_FILE,
      JSON.stringify(
        {
          sessions: Array.from(activeAdminSessions.values()),
          revoked: Array.from(revokedSessionIds.values()).slice(-500),
        },
        null,
        2
      ),
      { encoding: 'utf8', mode: 0o600 }
    );
  } catch {
    // Non-blocking session persistence
  }
}

loadPersistedSessions();

function recordSecurityEvent(
  event: string,
  username: string,
  ip: string,
  status: 'success' | 'blocked' | 'failed',
  details: string
) {
  securityAuditEvents.unshift({
    id: `sec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    event,
    username: username || 'anonymous',
    ip,
    status,
    details,
  });
  if (securityAuditEvents.length > 200) {
    securityAuditEvents.length = 200;
  }
}

// Cryptographic password hashing with Node scrypt (N=16384, r=8, p=1, 64-byte key)
function hashPasswordScrypt(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt, hash: derivedKey.toString('hex') };
}

function verifyPasswordScrypt(password: string, salt: string, storedHashHex: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    const storedBuf = Buffer.from(storedHashHex, 'hex');
    if (derivedKey.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedBuf);
  } catch {
    return false;
  }
}

function loadAdminVault(): StoredAdminCredential[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    if (!fs.existsSync(ADMIN_VAULT_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(ADMIN_VAULT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAdminVault(accounts: StoredAdminCredential[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(ADMIN_VAULT_FILE, JSON.stringify(accounts, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

// Optional backend env bootstrap if ADMIN_INITIAL_USERNAME and ADMIN_INITIAL_PASSWORD are provided
function bootstrapFromEnvIfConfigured() {
  const envUser = (process.env.ADMIN_INITIAL_USERNAME || '').trim().toLowerCase();
  const envPass = process.env.ADMIN_INITIAL_PASSWORD || '';
  if (!envUser || envPass.length < 8) return;

  const existing = loadAdminVault();
  if (existing.length === 0) {
    const { salt, hash } = hashPasswordScrypt(envPass);
    const now = new Date().toISOString();
    saveAdminVault([
      {
        id: `adm_${crypto.randomBytes(6).toString('hex')}`,
        username: envUser,
        salt,
        passwordHash: hash,
        role: 'Super Admin',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }
}

bootstrapFromEnvIfConfigured();

// General API rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Brute-force login attempt limiter (max 5 failed attempts per 15 minutes per IP/username)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const loginAttemptsMap = new Map<
  string,
  { failedCount: number; firstAttemptAt: number; lockedUntil: number }
>();

function checkLoginLockout(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(key);
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (now - record.firstAttemptAt > LOGIN_LOCKOUT_MS) {
    loginAttemptsMap.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordFailedLoginAttempt(key: string): { locked: boolean; remainingAttempts: number } {
  const now = Date.now();
  const existing = loginAttemptsMap.get(key);
  if (!existing || now - existing.firstAttemptAt > LOGIN_LOCKOUT_MS) {
    loginAttemptsMap.set(key, {
      failedCount: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return { locked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS - 1 };
  }

  existing.failedCount += 1;
  if (existing.failedCount >= LOGIN_MAX_ATTEMPTS) {
    existing.lockedUntil = now + LOGIN_LOCKOUT_MS;
    loginAttemptsMap.set(key, existing);
    return { locked: true, remainingAttempts: 0 };
  }

  loginAttemptsMap.set(key, existing);
  return {
    locked: false,
    remainingAttempts: Math.max(0, LOGIN_MAX_ATTEMPTS - existing.failedCount),
  };
}

function clearLoginAttempts(key: string) {
  loginAttemptsMap.delete(key);
}

// Signed Session Token Helpers (sessionId.hmacSignature)
function createSignedSessionToken(sessionId: string): string {
  const sig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(sessionId)
    .digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedSessionToken(rawToken: string | undefined): AdminSessionRecord | null {
  if (!rawToken || typeof rawToken !== 'string' || !rawToken.includes('.')) {
    return null;
  }
  const [sessionId, providedSig] = rawToken.split('.');
  if (!sessionId || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(sessionId)
    .digest('hex');

  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  if (revokedSessionIds.has(sessionId)) {
    activeAdminSessions.delete(sessionId);
    return null;
  }

  const vault = loadAdminVault();
  let session = activeAdminSessions.get(sessionId);

  // If the server restarted and cleared memory, re-hydrate a cryptographically verified HMAC session
  if (!session) {
    const activePrimaryAdmin =
      vault.find((acc) => acc.active && acc.role === 'Super Admin') ||
      vault.find((acc) => acc.active);
    if (!activePrimaryAdmin) return null;

    const nowMs = Date.now();
    session = {
      sessionId,
      username: activePrimaryAdmin.username,
      role: activePrimaryAdmin.role,
      issuedAt: nowMs,
      expiresAt: nowMs + SESSION_TTL_MS,
      ip: 'rehydrated',
      userAgent: 'rehydrated',
    };
    activeAdminSessions.set(sessionId, session);
    savePersistedSessions();
    return session;
  }

  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(sessionId);
    savePersistedSessions();
    return null;
  }

  // Verify account is still active in vault
  const account = vault.find((acc) => acc.username === session.username && acc.active);
  if (!account) {
    activeAdminSessions.delete(sessionId);
    savePersistedSessions();
    return null;
  }

  return session;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const k = pair.slice(0, idx).trim();
      const v = decodeURIComponent(pair.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

function extractAdminSessionFromRequest(req: Request): AdminSessionRecord | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifySignedSessionToken(bearerToken);
    if (verified) return verified;
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  return verifySignedSessionToken(cookieToken);
}

function setSessionCookie(res: Response, signedToken: string, maxAgeSeconds: number) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

// Middleware to protect backend admin routes
function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = extractAdminSessionFromRequest(req);
  if (!session) {
    res.status(401).json({
      authenticated: false,
      error: 'Unauthorized: Valid administrator authentication is required.',
    });
    return;
  }
  (req as Request & { adminSession?: AdminSessionRecord }).adminSession = session;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '65mb' }));

  // 1. Health & Security Status Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'VYNOOX Commerce Backend',
      hmacVerification: 'enabled',
      adminAuthProtection: 'enabled',
      rateLimiting: 'enabled',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================================================
  // ADMIN AUTHENTICATION & SESSION MANAGEMENT ENDPOINTS
  // ============================================================================

  // Check whether initial Super Admin has been initialized and whether current session is valid
  app.get('/api/admin/auth-status', (req, res) => {
    const vault = loadAdminVault();
    const session = extractAdminSessionFromRequest(req);
    res.status(200).json({
      initialized: vault.length > 0,
      authenticated: Boolean(session),
      admin: session
        ? {
            username: session.username,
            role: session.role,
            issuedAt: new Date(session.issuedAt).toISOString(),
            expiresAt: new Date(session.expiresAt).toISOString(),
          }
        : null,
    });
  });

  // One-time private initial Super Admin setup (permanently locked once 1+ admin exists)
  app.post('/api/admin/setup-initial', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(`setup:${clientIp}`, 10, 60_000)) {
      res.status(429).json({ error: 'Too many setup requests. Please try again later.' });
      return;
    }

    const vault = loadAdminVault();
    if (vault.length > 0) {
      recordSecurityEvent(
        'INITIAL_SETUP_BLOCKED',
        String(req.body?.username || ''),
        clientIp,
        'blocked',
        'Attempted initial setup after Super Admin was already configured.'
      );
      res.status(403).json({
        error:
          'Initial Super Admin setup has already been completed. Please sign in with your administrator credentials.',
      });
      return;
    }

    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const rawPassword = String(req.body?.password || '');

    if (!/^[a-z0-9._-]{3,32}$/.test(rawUsername)) {
      res.status(400).json({
        error:
          'Username must be 3–32 characters and contain only letters, numbers, dots, hyphens, or underscores.',
      });
      return;
    }

    if (rawPassword.length < 8) {
      res.status(400).json({
        error: 'Password must be at least 8 characters long for administrator security.',
      });
      return;
    }

    const { salt, hash } = hashPasswordScrypt(rawPassword);
    const now = new Date().toISOString();
    const superAdmin: StoredAdminCredential = {
      id: `adm_${crypto.randomBytes(6).toString('hex')}`,
      username: rawUsername,
      salt,
      passwordHash: hash,
      role: 'Super Admin',
      active: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    saveAdminVault([superAdmin]);

    // Immediately issue authenticated session for the newly initialized Super Admin
    const sessionId = crypto.randomBytes(32).toString('hex');
    const nowMs = Date.now();
    const sessionRecord: AdminSessionRecord = {
      sessionId,
      username: superAdmin.username,
      role: superAdmin.role,
      issuedAt: nowMs,
      expiresAt: nowMs + SESSION_TTL_MS,
      ip: clientIp,
      userAgent: String(req.headers['user-agent'] || 'unknown'),
    };
    activeAdminSessions.set(sessionId, sessionRecord);
    savePersistedSessions();

    const signedToken = createSignedSessionToken(sessionId);
    setSessionCookie(res, signedToken, Math.floor(SESSION_TTL_MS / 1000));

    recordSecurityEvent(
      'INITIAL_SUPER_ADMIN_CREATED',
      superAdmin.username,
      clientIp,
      'success',
      'Initial Super Admin account initialized with scrypt password hash.'
    );

    res.status(201).json({
      authenticated: true,
      sessionToken: signedToken,
      admin: {
        username: superAdmin.username,
        role: superAdmin.role,
        issuedAt: new Date(sessionRecord.issuedAt).toISOString(),
        expiresAt: new Date(sessionRecord.expiresAt).toISOString(),
      },
    });
  });

  // Authenticate Admin with Username & Password
  app.post('/api/admin/login', (req, res) => {
    const clientIp = req.ip || 'unknown';
    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const rawPassword = String(req.body?.password || '');

    if (!rawUsername || !rawPassword) {
      res.status(400).json({
        authenticated: false,
        error: 'Both username and password are required.',
      });
      return;
    }

    const ipLockKey = `ip:${clientIp}`;
    const userLockKey = `user:${rawUsername}`;

    const ipCheck = checkLoginLockout(ipLockKey);
    if (!ipCheck.allowed) {
      recordSecurityEvent(
        'ADMIN_LOGIN_RATE_LIMITED',
        rawUsername,
        clientIp,
        'blocked',
        `Locked out for ${ipCheck.retryAfterSeconds}s due to repeated failed login attempts.`
      );
      res.status(429).json({
        authenticated: false,
        error: `Too many failed login attempts. Please wait ${ipCheck.retryAfterSeconds} seconds before trying again.`,
      });
      return;
    }

    const userCheck = checkLoginLockout(userLockKey);
    if (!userCheck.allowed) {
      res.status(429).json({
        authenticated: false,
        error: `This account is temporarily locked due to repeated failed login attempts. Try again in ${userCheck.retryAfterSeconds} seconds.`,
      });
      return;
    }

    const vault = loadAdminVault();
    if (vault.length === 0) {
      res.status(403).json({
        authenticated: false,
        needsInitialSetup: true,
        error:
          'No administrator account has been initialized yet. Complete the private Super Admin setup first.',
      });
      return;
    }

    const account = vault.find((acc) => acc.username === rawUsername && acc.active);
    const passwordValid = account
      ? verifyPasswordScrypt(rawPassword, account.salt, account.passwordHash)
      : false;

    if (!account || !passwordValid) {
      const ipFail = recordFailedLoginAttempt(ipLockKey);
      recordFailedLoginAttempt(userLockKey);
      recordSecurityEvent(
        'ADMIN_LOGIN_FAILED',
        rawUsername,
        clientIp,
        'failed',
        `Invalid username or password (${ipFail.remainingAttempts} attempts remaining before lockout).`
      );
      res.status(401).json({
        authenticated: false,
        error: 'Invalid username or password.',
        remainingAttempts: ipFail.remainingAttempts,
      });
      return;
    }

    // Reset failed login counters upon valid authentication
    clearLoginAttempts(ipLockKey);
    clearLoginAttempts(userLockKey);

    account.lastLoginAt = new Date().toISOString();
    saveAdminVault(vault);

    const sessionId = crypto.randomBytes(32).toString('hex');
    const nowMs = Date.now();
    const sessionRecord: AdminSessionRecord = {
      sessionId,
      username: account.username,
      role: account.role,
      issuedAt: nowMs,
      expiresAt: nowMs + SESSION_TTL_MS,
      ip: clientIp,
      userAgent: String(req.headers['user-agent'] || 'unknown'),
    };
    activeAdminSessions.set(sessionId, sessionRecord);
    savePersistedSessions();

    const signedToken = createSignedSessionToken(sessionId);
    setSessionCookie(res, signedToken, Math.floor(SESSION_TTL_MS / 1000));

    recordSecurityEvent(
      'ADMIN_LOGIN_SUCCESS',
      account.username,
      clientIp,
      'success',
      `Authenticated as ${account.role}.`
    );

    res.status(200).json({
      authenticated: true,
      sessionToken: signedToken,
      admin: {
        username: account.username,
        role: account.role,
        issuedAt: new Date(sessionRecord.issuedAt).toISOString(),
        expiresAt: new Date(sessionRecord.expiresAt).toISOString(),
      },
    });
  });

  // Verify Active Admin Session (Protected)
  app.get('/api/admin/session', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    res.status(200).json({
      authenticated: true,
      admin: {
        username: session.username,
        role: session.role,
        issuedAt: new Date(session.issuedAt).toISOString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
      },
    });
  });

  // Logout Admin Session & Invalidate Token
  app.post('/api/admin/logout', (req, res) => {
    const session = extractAdminSessionFromRequest(req);
    const clientIp = req.ip || 'unknown';
    if (session) {
      revokedSessionIds.add(session.sessionId);
      activeAdminSessions.delete(session.sessionId);
      savePersistedSessions();
      recordSecurityEvent(
        'ADMIN_LOGOUT',
        session.username,
        clientIp,
        'success',
        'Administrator session terminated.'
      );
    }
    clearSessionCookie(res);
    res.status(200).json({ authenticated: false, loggedOut: true });
  });

  // List Admin Accounts (Protected — never returns password hashes or salts)
  app.get('/api/admin/accounts', requireAdminSession, (_req, res) => {
    const vault = loadAdminVault();
    res.status(200).json({
      accounts: vault.map((a) => ({
        id: a.id,
        username: a.username,
        role: a.role,
        active: a.active,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt || null,
      })),
    });
  });

  // Create or Update Admin Account (Protected — Super Admin only)
  app.post('/api/admin/accounts', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const clientIp = req.ip || 'unknown';

    if (session.role !== 'Super Admin') {
      res.status(403).json({
        error: 'Forbidden: Only Super Admin accounts can create or modify administrator credentials.',
      });
      return;
    }

    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const rawPassword = String(req.body?.password || '');
    const role = (req.body?.role || 'Admin') as ServerAdminRole;

    if (!/^[a-z0-9._-]{3,32}$/.test(rawUsername)) {
      res.status(400).json({
        error:
          'Username must be 3–32 characters and contain only letters, numbers, dots, hyphens, or underscores.',
      });
      return;
    }

    if (rawPassword.length < 8) {
      res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
      return;
    }

    const vault = loadAdminVault();
    const { salt, hash } = hashPasswordScrypt(rawPassword);
    const now = new Date().toISOString();
    const existingIdx = vault.findIndex((a) => a.username === rawUsername);

    if (existingIdx >= 0) {
      vault[existingIdx] = {
        ...vault[existingIdx],
        salt,
        passwordHash: hash,
        role,
        active: true,
        updatedAt: now,
      };
    } else {
      vault.push({
        id: `adm_${crypto.randomBytes(6).toString('hex')}`,
        username: rawUsername,
        salt,
        passwordHash: hash,
        role,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    saveAdminVault(vault);
    recordSecurityEvent(
      existingIdx >= 0 ? 'ADMIN_CREDENTIAL_UPDATED' : 'ADMIN_ACCOUNT_CREATED',
      session.username,
      clientIp,
      'success',
      `Configured admin account '${rawUsername}' with role '${role}'.`
    );

    res.status(200).json({
      saved: true,
      accounts: vault.map((a) => ({
        id: a.id,
        username: a.username,
        role: a.role,
        active: a.active,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt || null,
      })),
    });
  });

  // Delete / Revoke Admin Account (Protected — Super Admin only)
  app.delete('/api/admin/accounts/:username', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const clientIp = req.ip || 'unknown';

    if (session.role !== 'Super Admin') {
      res.status(403).json({
        error: 'Forbidden: Only Super Admin accounts can revoke administrator credentials.',
      });
      return;
    }

    const targetUsername = String(req.params.username || '').trim().toLowerCase();
    if (targetUsername === session.username) {
      res.status(400).json({
        error: 'You cannot delete your own currently active Super Admin account.',
      });
      return;
    }

    const vault = loadAdminVault();
    const filtered = vault.filter((a) => a.username !== targetUsername);
    saveAdminVault(filtered);

    // Revoke any active sessions belonging to the removed username
    for (const [sid, sRec] of activeAdminSessions.entries()) {
      if (sRec.username === targetUsername) {
        activeAdminSessions.delete(sid);
      }
    }

    recordSecurityEvent(
      'ADMIN_ACCOUNT_REVOKED',
      session.username,
      clientIp,
      'success',
      `Revoked administrator account '${targetUsername}'.`
    );

    res.status(200).json({
      deleted: true,
      accounts: filtered.map((a) => ({
        id: a.id,
        username: a.username,
        role: a.role,
        active: a.active,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt || null,
      })),
    });
  });

  // View Backend Admin Security Audit Events (Protected)
  app.get('/api/admin/security-events', requireAdminSession, (_req, res) => {
    res.status(200).json({ events: securityAuditEvents });
  });

  // ============================================================================
  // ADMIN FIRESTORE WRITE LEASE MINTING & CONSUMPTION (SERVER-VERIFIED RBAC)
  // ============================================================================

  // Mint a single-use Firestore write/delete lease for an authenticated administrator
  app.post('/api/admin/firestore-lease', requireAdminSession, async (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const mode = req.body?.mode === 'delete' ? 'delete' : 'write';
    const collectionName = sanitizeLeaseId(String(req.body?.collection || 'settings'));
    const docId = sanitizeLeaseId(String(req.body?.docId || 'doc'));
    const targetPath = `${collectionName}/${docId}`;

    const leaseId =
      mode === 'delete'
        ? sanitizeLeaseId(`del_${collectionName}_${docId}`)
        : sanitizeLeaseId(`w_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`);

    try {
      await setFirestoreDoc(firestoreDoc(serverDb, 'admin_leases', leaseId), {
        leaseId,
        adminUsername: session.username,
        adminRole: session.role,
        targetPath: targetPath.slice(0, 190),
        serverSeal: SERVER_LEASE_SEAL,
        createdAt: firestoreServerTimestamp(),
      });

      // Automatically expire unconsumed leases after 60 seconds
      setTimeout(() => {
        deleteFirestoreDoc(firestoreDoc(serverDb, 'admin_leases', leaseId)).catch(() => {});
      }, 60_000);

      res.status(200).json({
        ok: true,
        leaseId,
        mode,
        targetPath,
        adminUsername: session.username,
        adminRole: session.role,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unable to mint administrator database authorization lease.',
      });
    }
  });

  // Consume (delete) a single-use Firestore write/delete lease immediately after completion
  app.post('/api/admin/firestore-lease/consume', requireAdminSession, async (req, res) => {
    const leaseId = sanitizeLeaseId(String(req.body?.leaseId || ''));
    if (!leaseId) {
      res.status(400).json({ ok: false, error: 'Missing leaseId.' });
      return;
    }
    try {
      await deleteFirestoreDoc(firestoreDoc(serverDb, 'admin_leases', leaseId));
      res.status(200).json({ ok: true, consumed: true });
    } catch {
      res.status(200).json({ ok: true, consumed: false });
    }
  });

  // ============================================================================
  // ADMIN BINARY MEDIA STORAGE SERVICE (IMAGES: JPG/JPEG/PNG/WEBP + VIDEOS: MP4)
  // ============================================================================

  // Upload or replace original media file in storage (Protected — Admin Session Required)
  app.post('/api/admin/storage/upload', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const clientIp = req.ip || 'unknown';

    const rawFileName = String(req.body?.fileName || '').trim();
    const rawMimeType = String(req.body?.fileType || '').trim().toLowerCase();
    const rawCategory = String(req.body?.mediaCategory || 'general').trim().toLowerCase();
    const base64Data = String(req.body?.base64Data || '').trim();
    const previousStoragePath = String(req.body?.replaceStoragePath || '').trim();

    if (!rawFileName || !base64Data) {
      res.status(400).json({
        ok: false,
        error: 'Invalid media upload request: file name and binary content are required.',
      });
      return;
    }

    const mediaCategory = ALLOWED_MEDIA_CATEGORIES.has(rawCategory) ? rawCategory : 'general';
    const extMatch = rawFileName.toLowerCase().match(/\.(jpg|jpeg|png|webp|mp4)$/);
    const ext = extMatch ? extMatch[1] : '';

    // Normalize MIME type from header or extension for strict validation
    let normalizedMime = rawMimeType;
    if (!normalizedMime || normalizedMime === 'application/octet-stream') {
      if (ext === 'jpg' || ext === 'jpeg') normalizedMime = 'image/jpeg';
      else if (ext === 'png') normalizedMime = 'image/png';
      else if (ext === 'webp') normalizedMime = 'image/webp';
      else if (ext === 'mp4') normalizedMime = 'video/mp4';
    }
    if (normalizedMime === 'image/jpg') {
      normalizedMime = 'image/jpeg';
    }

    const isAllowedImage =
      ALLOWED_IMAGE_MIMES.has(normalizedMime) && ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isAllowedVideo = ALLOWED_VIDEO_MIMES.has(normalizedMime) && ext === 'mp4';

    if (!isAllowedImage && !isAllowedVideo) {
      res.status(400).json({
        ok: false,
        error:
          'Unsupported file format. Only JPG, JPEG, PNG, WEBP images and MP4 videos are permitted.',
      });
      return;
    }

    // Strip optional Data URL prefix if present
    const cleanBase64 = base64Data.includes(',')
      ? base64Data.slice(base64Data.indexOf(',') + 1)
      : base64Data;

    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    } catch {
      res.status(400).json({ ok: false, error: 'Malformed file binary payload.' });
      return;
    }

    if (fileBuffer.length === 0) {
      res.status(400).json({ ok: false, error: 'Uploaded file is empty (0 bytes).' });
      return;
    }

    const maxBytes = isAllowedVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (fileBuffer.length > maxBytes) {
      res.status(413).json({
        ok: false,
        error: isAllowedVideo
          ? 'Video file exceeds the maximum allowed size of 60 MB.'
          : 'Image file exceeds the maximum allowed size of 15 MB.',
      });
      return;
    }

    const categoryDir = path.join(STORAGE_ROOT_DIR, mediaCategory);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true, mode: 0o755 });
    }

    // If replacing an existing stored file, remove old binary safely
    if (previousStoragePath && previousStoragePath.startsWith('vynoox_media/')) {
      const relPrev = previousStoragePath.replace(/^vynoox_media\//, '');
      const prevFullPath = path.resolve(STORAGE_ROOT_DIR, relPrev);
      if (
        prevFullPath.startsWith(path.resolve(STORAGE_ROOT_DIR)) &&
        fs.existsSync(prevFullPath)
      ) {
        try {
          fs.unlinkSync(prevFullPath);
        } catch {
          // Ignore old file unlink error
        }
      }
    }

    const baseNameWithoutExt = sanitizeStorageToken(
      rawFileName.replace(/\.[^.]+$/, '') || 'vynoox-media'
    );
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const storedFileName = `${baseNameWithoutExt}-${uniqueSuffix}.${ext}`;
    const fullDiskPath = path.join(categoryDir, storedFileName);

    try {
      fs.writeFileSync(fullDiskPath, fileBuffer, { mode: 0o644 });
    } catch {
      res.status(500).json({
        ok: false,
        error: 'Upload failed while writing media to storage. Please try again.',
      });
      return;
    }

    const storagePath = `vynoox_media/${mediaCategory}/${storedFileName}`;
    const versionTag = Date.now();
    const basePublicUrl = `/api/media/files/${encodeURIComponent(mediaCategory)}/${encodeURIComponent(
      storedFileName
    )}`;
    const versionedUrl = `${basePublicUrl}?v=${versionTag}`;
    const mediaId = `media-${isAllowedVideo ? 'vid' : 'img'}-${uniqueSuffix}`;

    recordSecurityEvent(
      'ADMIN_MEDIA_UPLOADED',
      session.username,
      clientIp,
      'success',
      `Uploaded ${storedFileName} (${fileBuffer.length} bytes) to ${storagePath}`
    );

    res.status(200).json({
      ok: true,
      mediaId,
      fileName: rawFileName,
      storedFileName,
      fileType: normalizedMime,
      mediaType: isAllowedVideo ? 'video' : 'image',
      mediaCategory,
      storagePath,
      url: versionedUrl,
      downloadUrl: `${basePublicUrl}?download=1`,
      fileSizeBytes: fileBuffer.length,
      uploadedAt: new Date().toISOString().slice(0, 10),
    });
  });

  // High-speed direct binary stream upload (Zero Base64 overhead + Fingerprint deduplication + Abort cleanup)
  app.post('/api/admin/storage/upload-stream', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const clientIp = req.ip || 'unknown';

    const rawFileName = decodeURIComponent(
      String(req.headers['x-file-name'] || req.query.fileName || '').trim()
    );
    const rawMimeType = String(
      req.headers['x-file-type'] || req.headers['content-type'] || ''
    )
      .trim()
      .toLowerCase();
    const rawCategory = String(req.headers['x-media-category'] || req.query.mediaCategory || 'general')
      .trim()
      .toLowerCase();
    const fileFingerprint = String(req.headers['x-file-fingerprint'] || '').trim();
    const previousStoragePath = decodeURIComponent(
      String(req.headers['x-replace-storage-path'] || '').trim()
    );
    const declaredSize = Number(req.headers['x-file-size'] || req.headers['content-length'] || 0);

    if (!rawFileName) {
      res.status(400).json({
        ok: false,
        error: 'Invalid media upload request: file name header is required.',
      });
      return;
    }

    const mediaCategory = ALLOWED_MEDIA_CATEGORIES.has(rawCategory) ? rawCategory : 'general';
    const extMatch = rawFileName.toLowerCase().match(/\.(jpg|jpeg|png|webp|mp4)$/);
    const ext = extMatch ? extMatch[1] : '';

    let normalizedMime = rawMimeType.split(';')[0].trim();
    if (!normalizedMime || normalizedMime === 'application/octet-stream') {
      if (ext === 'jpg' || ext === 'jpeg') normalizedMime = 'image/jpeg';
      else if (ext === 'png') normalizedMime = 'image/png';
      else if (ext === 'webp') normalizedMime = 'image/webp';
      else if (ext === 'mp4') normalizedMime = 'video/mp4';
    }
    if (normalizedMime === 'image/jpg') {
      normalizedMime = 'image/jpeg';
    }

    const isAllowedImage =
      ALLOWED_IMAGE_MIMES.has(normalizedMime) && ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isAllowedVideo = ALLOWED_VIDEO_MIMES.has(normalizedMime) && ext === 'mp4';

    if (!isAllowedImage && !isAllowedVideo) {
      res.status(400).json({
        ok: false,
        error:
          'Unsupported file format. Only JPG, JPEG, PNG, WEBP images and MP4 videos are permitted.',
      });
      return;
    }

    const maxBytes = isAllowedVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (declaredSize > maxBytes) {
      res.status(413).json({
        ok: false,
        error: isAllowedVideo
          ? `Video file exceeds the maximum allowed size of ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))} MB.`
          : `Image file exceeds the maximum allowed size of ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
      });
      return;
    }

    // Check duplicate fingerprint cache so identical files are not uploaded repeatedly
    const fingerprintKey = fileFingerprint ? `${mediaCategory}:${fileFingerprint}` : '';
    const fingerprintIndex = loadMediaFingerprints();
    if (fingerprintKey && !previousStoragePath && fingerprintIndex[fingerprintKey]) {
      const cached = fingerprintIndex[fingerprintKey];
      const existingDiskPath = path.join(STORAGE_ROOT_DIR, cached.mediaCategory, cached.storedFileName);
      if (fs.existsSync(existingDiskPath)) {
        const basePublicUrl = `/api/media/files/${encodeURIComponent(
          cached.mediaCategory
        )}/${encodeURIComponent(cached.storedFileName)}`;
        const sendDedupResponse = () => {
          if (res.headersSent) return;
          res.status(200).json({
            ok: true,
            deduplicated: true,
            mediaId: cached.mediaId,
            fileName: rawFileName,
            storedFileName: cached.storedFileName,
            fileType: cached.fileType,
            mediaType: cached.mediaType,
            mediaCategory: cached.mediaCategory,
            storagePath: cached.storagePath,
            url: `${basePublicUrl}?v=${Date.now()}`,
            downloadUrl: `${basePublicUrl}?download=1`,
            fileSizeBytes: cached.fileSizeBytes,
            uploadedAt: cached.uploadedAt,
          });
        };
        if (req.readableEnded) {
          sendDedupResponse();
        } else {
          req.on('end', sendDedupResponse);
          req.resume();
        }
        return;
      } else {
        delete fingerprintIndex[fingerprintKey];
        saveMediaFingerprints(fingerprintIndex);
      }
    }

    const categoryDir = path.join(STORAGE_ROOT_DIR, mediaCategory);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true, mode: 0o755 });
    }

    const baseNameWithoutExt = sanitizeStorageToken(
      rawFileName.replace(/\.[^.]+$/, '') || 'vynoox-media'
    );
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const storedFileName = `${baseNameWithoutExt}-${uniqueSuffix}.${ext}`;
    const tempDiskPath = path.join(categoryDir, `.tmp-${storedFileName}`);
    const finalDiskPath = path.join(categoryDir, storedFileName);

    const writeStream = fs.createWriteStream(tempDiskPath, { mode: 0o644 });
    let bytesWritten = 0;
    let abortedOrFailed = false;

    const cleanupTempFile = () => {
      try {
        if (fs.existsSync(tempDiskPath)) {
          fs.unlinkSync(tempDiskPath);
        }
      } catch {
        // Ignore temp unlink errors
      }
    };

    req.on('aborted', () => {
      abortedOrFailed = true;
      writeStream.destroy();
      cleanupTempFile();
    });

    req.on('data', (chunk: Buffer) => {
      if (abortedOrFailed) return;
      bytesWritten += chunk.length;
      if (bytesWritten > maxBytes) {
        abortedOrFailed = true;
        writeStream.destroy();
        cleanupTempFile();
        if (!res.headersSent) {
          res.status(413).json({
            ok: false,
            error: isAllowedVideo
              ? `Video file exceeds the maximum allowed size of ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))} MB.`
              : `Image file exceeds the maximum allowed size of ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
          });
        }
        req.destroy();
      }
    });

    writeStream.on('error', () => {
      abortedOrFailed = true;
      cleanupTempFile();
      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: 'Upload failed while streaming media to storage. Please try again.',
        });
      }
    });

    writeStream.on('finish', () => {
      if (abortedOrFailed || res.headersSent) {
        cleanupTempFile();
        return;
      }

      if (bytesWritten === 0) {
        cleanupTempFile();
        res.status(400).json({ ok: false, error: 'Uploaded file is empty (0 bytes).' });
        return;
      }

      try {
        if (isAllowedVideo) {
          try {
            // Relocate MP4 moov atom to the front of the file (+faststart) without re-encoding
            execFileSync(
              'ffmpeg',
              [
                '-y',
                '-v',
                'error',
                '-i',
                tempDiskPath,
                '-c',
                'copy',
                '-movflags',
                '+faststart',
                finalDiskPath,
              ],
              { timeout: 25000 }
            );
            cleanupTempFile();
          } catch {
            // Fallback to direct atomic rename if ffmpeg faststart fails
            if (fs.existsSync(tempDiskPath)) {
              fs.renameSync(tempDiskPath, finalDiskPath);
            }
          }
        } else {
          fs.renameSync(tempDiskPath, finalDiskPath);
        }
      } catch {
        cleanupTempFile();
        res.status(500).json({
          ok: false,
          error: 'Failed to finalize uploaded media file.',
        });
        return;
      }

      if (!fs.existsSync(finalDiskPath) || fs.statSync(finalDiskPath).size === 0) {
        cleanupTempFile();
        res.status(500).json({
          ok: false,
          error: 'Uploaded media file could not be verified on disk.',
        });
        return;
      }
      const finalizedSizeBytes = fs.statSync(finalDiskPath).size;

      // Only remove old replaced file AFTER new replacement file is safely finalized on disk
      if (previousStoragePath && previousStoragePath.startsWith('vynoox_media/')) {
        const relPrev = previousStoragePath.replace(/^vynoox_media\//, '');
        const prevFullPath = path.resolve(STORAGE_ROOT_DIR, relPrev);
        if (
          prevFullPath.startsWith(path.resolve(STORAGE_ROOT_DIR)) &&
          prevFullPath !== path.resolve(finalDiskPath) &&
          fs.existsSync(prevFullPath)
        ) {
          try {
            fs.unlinkSync(prevFullPath);
          } catch {
            // Non-blocking old file cleanup
          }
        }
      }

      const storagePath = `vynoox_media/${mediaCategory}/${storedFileName}`;
      const basePublicUrl = `/api/media/files/${encodeURIComponent(
        mediaCategory
      )}/${encodeURIComponent(storedFileName)}`;
      const versionedUrl = `${basePublicUrl}?v=${Date.now()}`;
      const mediaId = `media-${isAllowedVideo ? 'vid' : 'img'}-${uniqueSuffix}`;
      const uploadedAt = new Date().toISOString().slice(0, 10);

      if (fingerprintKey) {
        fingerprintIndex[fingerprintKey] = {
          fingerprint: fileFingerprint,
          mediaId,
          fileName: rawFileName,
          storedFileName,
          fileType: normalizedMime,
          mediaType: isAllowedVideo ? 'video' : 'image',
          mediaCategory,
          storagePath,
          fileSizeBytes: finalizedSizeBytes,
          uploadedAt,
        };
        saveMediaFingerprints(fingerprintIndex);
      }

      recordSecurityEvent(
        'ADMIN_MEDIA_STREAM_UPLOADED',
        session.username,
        clientIp,
        'success',
        `Streamed ${storedFileName} (${finalizedSizeBytes} bytes) to ${storagePath}`
      );

      res.status(200).json({
        ok: true,
        mediaId,
        fileName: rawFileName,
        storedFileName,
        fileType: normalizedMime,
        mediaType: isAllowedVideo ? 'video' : 'image',
        mediaCategory,
        storagePath,
        url: versionedUrl,
        downloadUrl: `${basePublicUrl}?download=1`,
        fileSizeBytes: finalizedSizeBytes,
        uploadedAt,
      });
    });

    req.pipe(writeStream);
  });

  // Delete media file from storage (Protected — Admin Session Required)
  app.delete('/api/admin/storage/file', requireAdminSession, (req, res) => {
    const session = (req as Request & { adminSession: AdminSessionRecord }).adminSession;
    const clientIp = req.ip || 'unknown';
    const rawStoragePath = String(req.body?.storagePath || req.query?.storagePath || '').trim();

    if (!rawStoragePath || !rawStoragePath.startsWith('vynoox_media/')) {
      res.status(200).json({ ok: true, deleted: false });
      return;
    }

    const relativePart = rawStoragePath.replace(/^vynoox_media\//, '');
    const resolvedTarget = path.resolve(STORAGE_ROOT_DIR, relativePart);
    const resolvedRoot = path.resolve(STORAGE_ROOT_DIR);

    if (!resolvedTarget.startsWith(resolvedRoot)) {
      res.status(403).json({ ok: false, error: 'Invalid storage path.' });
      return;
    }

    let deleted = false;
    if (fs.existsSync(resolvedTarget)) {
      try {
        fs.unlinkSync(resolvedTarget);
        deleted = true;
      } catch {
        deleted = false;
      }
    }

    const fingerprintIndex = loadMediaFingerprints();
    let changedFingerprints = false;
    for (const [k, entry] of Object.entries(fingerprintIndex)) {
      if (entry.storagePath === rawStoragePath) {
        delete fingerprintIndex[k];
        changedFingerprints = true;
      }
    }
    if (changedFingerprints) {
      saveMediaFingerprints(fingerprintIndex);
    }

    recordSecurityEvent(
      'ADMIN_MEDIA_DELETED',
      session.username,
      clientIp,
      'success',
      `Deleted storage object ${rawStoragePath}`
    );

    res.status(200).json({ ok: true, deleted });
  });

  // Serve & stream uploaded media files with HTTP GET, HEAD, and Range (206 Partial Content) support
  const serveMediaFile = (req: Request, res: Response) => {
    const category = sanitizeStorageToken(String(req.params.category || 'general'));
    const fileName = sanitizeStorageToken(String(req.params.fileName || ''));

    if (!ALLOWED_MEDIA_CATEGORIES.has(category) || !fileName) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }

    const resolvedRoot = path.resolve(STORAGE_ROOT_DIR);
    let filePath = path.resolve(STORAGE_ROOT_DIR, category, fileName);

    if (!filePath.startsWith(resolvedRoot)) {
      res.status(403).json({ error: 'Invalid media path.' });
      return;
    }

    // If exact timestamped file was replaced by a newer upload of the same file, resolve the latest matching file in that category
    if (!fs.existsSync(filePath)) {
      const catDir = path.resolve(STORAGE_ROOT_DIR, category);
      const ext = path.extname(fileName).toLowerCase();
      const basePrefix = fileName.replace(/-\d{10,}-[a-f0-9]{6}(\.[^.]+)$/i, '');
      if (basePrefix && fs.existsSync(catDir)) {
        const candidates = fs
          .readdirSync(catDir)
          .filter(
            (f) =>
              !f.startsWith('.') &&
              path.extname(f).toLowerCase() === ext &&
              f.startsWith(`${basePrefix}-`)
          )
          .sort()
          .reverse();
        if (candidates.length > 0) {
          filePath = path.resolve(catDir, candidates[0]);
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Media file not found in storage.' });
      return;
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) {
      res.status(404).json({ error: 'Media file is empty or invalid.' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    if (req.query.download === '1' || req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }

    const range = req.headers.range;
    if (range && range.startsWith('bytes=')) {
      const rangeSpec = range.slice(6).split(',')[0].trim();
      const [startStr, endStr] = rangeSpec.split('-');
      let start = 0;
      let end = stat.size - 1;

      if (startStr === '' && endStr) {
        // Suffix byte range (e.g. bytes=-500)
        const suffixLen = parseInt(endStr, 10);
        if (!Number.isFinite(suffixLen) || suffixLen <= 0) {
          res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
          return;
        }
        start = Math.max(0, stat.size - suffixLen);
        end = stat.size - 1;
      } else {
        start = parseInt(startStr, 10);
        end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      }

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        start >= stat.size ||
        start > end
      ) {
        res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
        return;
      }

      end = Math.min(end, stat.size - 1);
      const chunksize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', chunksize);

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath, { start, end });
      req.on('close', () => {
        stream.destroy();
      });
      stream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });
      stream.pipe(res);
      return;
    }

    res.status(200);
    res.setHeader('Content-Length', stat.size);

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    req.on('close', () => {
      stream.destroy();
    });
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  };

  app.get('/api/media/files/:category/:fileName', serveMediaFile);
  app.head('/api/media/files/:category/:fileName', serveMediaFile);

  // 2. Create Cryptographic Payment Intent (Razorpay / Stripe)
  app.post('/api/payment/create-intent', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp, 40, 60_000)) {
      res.status(429).json({ error: 'Too many payment requests. Please try again shortly.' });
      return;
    }

    const amount = Number(req.body?.amount || 0);
    const currency = String(req.body?.currency || 'INR');
    const gateway = String(req.body?.gateway || 'razorpay');

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Invalid order amount for payment intent.' });
      return;
    }

    const amountPaise = Math.round(amount * 100);
    const orderIntentId = `order_${gateway}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const signature = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${orderIntentId}|${paymentId}|${amountPaise}`)
      .digest('hex');

    res.status(200).json({
      orderIntentId,
      paymentId,
      amountPaise,
      currency,
      gateway,
      signature,
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Verify Payment Signature Server-Side (Never expose secret in frontend)
  app.post('/api/payment/verify-signature', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp, 40, 60_000)) {
      res.status(429).json({ verified: false, error: 'Rate limit exceeded.' });
      return;
    }

    const { orderIntentId, paymentId, amount, signature } = req.body || {};
    const amountPaise = Math.round(Number(amount || 0) * 100);

    if (!orderIntentId || !paymentId || !signature || amountPaise <= 0) {
      res.status(400).json({ verified: false, error: 'Missing payment verification parameters.' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${orderIntentId}|${paymentId}|${amountPaise}`)
      .digest('hex');

    const verified = signature === expectedSignature;
    if (!verified) {
      res.status(400).json({
        verified: false,
        error: 'Cryptographic signature mismatch. Order cannot be marked as paid.',
      });
      return;
    }

    res.status(200).json({
      verified: true,
      paymentReference: `${orderIntentId}:${paymentId}`,
      verifiedAt: new Date().toISOString(),
    });
  });

  // 4. Process Verified Order Refund Server-Side (Protected by Admin Session)
  app.post('/api/payment/refund', requireAdminSession, (req, res) => {
    const { orderNumber, paymentReference, amount } = req.body || {};
    if (!orderNumber) {
      res.status(400).json({ refunded: false, error: 'Order number is required for refund.' });
      return;
    }
    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const refundSignature = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${orderNumber}|${refundId}|${Number(amount || 0)}`)
      .digest('hex')
      .slice(0, 16);

    res.status(200).json({
      refunded: true,
      refundId,
      refundSignature,
      originalReference: paymentReference || 'COD',
      processedAt: new Date().toISOString(),
    });
  });

  // 5. Indian PIN Code Serviceability & Logistics Lookup
  app.post('/api/shipping/check-pincode', (req, res) => {
    const pinCode = String(req.body?.pinCode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pinCode)) {
      res.status(400).json({
        serviceable: false,
        message: 'Please enter a valid 6-digit Indian Postal PIN Code (e.g. 400013, 110001, 560001).',
      });
      return;
    }

    const prefix = pinCode.slice(0, 2);
    const metroPrefixes = ['11', '40', '56', '60', '50', '70', '41', '38'];
    const isMetro = metroPrefixes.includes(prefix);

    const zoneMap: Record<string, string> = {
      '11': 'New Delhi NCR Hub',
      '40': 'Mumbai Metropolitan Hub',
      '41': 'Pune Express Zone',
      '56': 'Bengaluru Metro Hub',
      '60': 'Chennai Metro Hub',
      '50': 'Hyderabad Metro Hub',
      '70': 'Kolkata Metro Hub',
      '38': 'Ahmedabad Express Zone',
    };

    res.status(200).json({
      serviceable: true,
      pinCode,
      zoneName: zoneMap[prefix] || (isMetro ? 'Tier-1 Metro Express' : 'National Standard Zone'),
      estimatedDays: isMetro ? '2–3 Business Days' : '4–6 Business Days',
      codAvailable: true,
      carrier: isMetro ? 'BlueDart Air Express' : 'Delhivery Prime Surface',
    });
  });

  // Mount Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VYNOOX Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

