import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AdminRole } from '../types/store';
import { AdminDashboard } from './AdminDashboard';

export const AdminAuthGate: React.FC = () => {
  const {
    adminSession,
    adminAuthChecking,
    adminSystemInitialized,
    loginAdminWithCredentials,
    setupInitialSuperAdmin,
    navigateTo,
    generalSettings,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'initial-setup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Keep mode in sync if backend reports uninitialized on attempt
  useEffect(() => {
    if (adminSystemInitialized && mode === 'initial-setup') {
      setMode('login');
    }
  }, [adminSystemInitialized, mode]);

  if (adminAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] text-[#FAF9F6] flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.25em] text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Verifying Administrator Session...</span>
        </div>
      </div>
    );
  }

  // Only render AdminDashboard if backend session is verified
  if (adminSession) {
    return <AdminDashboard />;
  }

  const validateFields = (): boolean => {
    const errors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    const trimmedUser = username.trim().toLowerCase();

    if (!trimmedUser) {
      errors.username = 'Username is required.';
    } else if (mode === 'initial-setup' && !/^[a-z0-9._-]{3,32}$/.test(trimmedUser)) {
      errors.username =
        'Username must be 3–32 characters (letters, numbers, dots, hyphens, underscores).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (mode === 'initial-setup' && password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (mode === 'initial-setup' && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateFields()) {
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await loginAdminWithCredentials(username.trim(), password);
        if (!result.ok) {
          setErrorMessage(result.error || 'Invalid username or password.');
        } else {
          setPassword('');
        }
      } else {
        const result = await setupInitialSuperAdmin(username.trim(), password);
        if (!result.ok) {
          setErrorMessage(result.error || 'Failed to initialize Super Admin account.');
        } else {
          setPassword('');
          setConfirmPassword('');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#FAF9F6] flex flex-col justify-between px-6 py-10 selection:bg-white selection:text-black">
      {/* Top Minimal Back Navigation */}
      <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Storefront</span>
        </button>
        <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-500">
          RESTRICTED ACCESS · /ADMIN
        </span>
      </div>

      {/* Center Minimalist Authentication Card */}
      <div className="w-full max-w-[420px] mx-auto my-12">
        <div className="border border-neutral-800 bg-[#131315] p-8 md:p-10 shadow-2xl space-y-7">
          {/* VYNOOX Branding Header */}
          <div className="space-y-2 text-center border-b border-neutral-800/80 pb-6">
            <span className="text-2xl font-bold tracking-[0.28em] text-white font-architectural block">
              {generalSettings.storeName || 'VYNOOX'}
            </span>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-400">
              {mode === 'login'
                ? 'Administrator Authentication'
                : 'Private Super Admin Initialization'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 border border-red-900/80 bg-red-950/50 text-red-200 text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username Field */}
            <div>
              <label
                htmlFor="vynoox-admin-username"
                className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2"
              >
                Username
              </label>
              <input
                id="vynoox-admin-username"
                type="text"
                autoComplete="username"
                disabled={submitting}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter administrator username"
                className={`w-full px-3.5 py-3 bg-[#0D0D0E] border text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                  fieldErrors.username
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-neutral-800 focus:border-neutral-400'
                }`}
              />
              {fieldErrors.username && (
                <p className="text-[11px] text-red-400 mt-1.5">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password Field with Show/Hide Option */}
            <div>
              <label
                htmlFor="vynoox-admin-password"
                className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="vynoox-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={submitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter password"
                  className={`w-full pl-3.5 pr-11 py-3 bg-[#0D0D0E] border text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                    fieldErrors.password
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-800 focus:border-neutral-400'
                  }`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-400 mt-1.5">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password only during one-time private initial setup */}
            {mode === 'initial-setup' && (
              <div>
                <label
                  htmlFor="vynoox-admin-confirm-password"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="vynoox-admin-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={submitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Re-enter password (min 8 chars)"
                  className={`w-full px-3.5 py-3 bg-[#0D0D0E] border text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-800 focus:border-neutral-400'
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1.5">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button with Loading State */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#FAF9F6] text-[#111111] hover:bg-neutral-200 disabled:opacity-60 text-xs font-mono uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {mode === 'login' ? 'Authenticating...' : 'Initializing Vault...'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    {mode === 'login' ? 'Login' : 'Initialize Super Admin Account'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* One-Time Private Setup Switch (Only shown if backend has 0 initialized admin accounts) */}
          {!adminSystemInitialized && (
            <div className="pt-4 border-t border-neutral-800/80 text-center space-y-2">
              {mode === 'login' ? (
                <>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    First-time deployment detected: no Super Admin credentials exist in the backend vault yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('initial-setup');
                      setErrorMessage(null);
                      setFieldErrors({});
                    }}
                    className="text-[11px] font-mono uppercase tracking-wider text-white underline underline-offset-4 hover:text-neutral-300"
                  >
                    Configure Initial Super Admin Credentials
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setFieldErrors({});
                  }}
                  className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 underline underline-offset-4 hover:text-white"
                >
                  Back to Admin Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Discreet Security Footer */}
      <div className="max-w-[1440px] w-full mx-auto text-center text-[11px] font-mono text-neutral-600 flex items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Protected by Server-Side Scrypt Hashing &amp; Signed Session Verification</span>
      </div>
    </div>
  );
};

// Backend Administrator Credential Vault Manager for Super Admins inside AdminDashboard
export const BackendAdminCredentialsManager: React.FC = () => {
  const { adminSession, adminSessionToken, notify } = useStore();
  const [accounts, setAccounts] = useState<
    {
      id: string;
      username: string;
      role: AdminRole;
      active: boolean;
      createdAt: string;
      lastLoginAt: string | null;
    }[]
  >([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Admin');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = React.useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminSessionToken) {
        headers.Authorization = `Bearer ${adminSessionToken}`;
      }
      const res = await fetch('/api/admin/accounts', {
        headers,
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      }
    } catch {
      // Ignore fetch error
    }
  }, [adminSessionToken]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 8) {
      notify(
        'Validation Error',
        'Provide a valid username (3–32 chars) and password (min 8 chars).',
        'error'
      );
      return;
    }
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminSessionToken) {
        headers.Authorization = `Bearer ${adminSessionToken}`;
      }
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('Account Error', data.error || 'Failed to save admin credential.', 'error');
        return;
      }
      if (Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
      setNewUsername('');
      setNewPassword('');
      notify(
        'Admin Credential Saved',
        `Username '${newUsername.trim().toLowerCase()}' updated in backend vault.`,
        'success'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (targetUsername: string) => {
    const headers: Record<string, string> = {};
    if (adminSessionToken) {
      headers.Authorization = `Bearer ${adminSessionToken}`;
    }
    const res = await fetch(`/api/admin/accounts/${encodeURIComponent(targetUsername)}`, {
      method: 'DELETE',
      headers,
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      notify('Cannot Revoke', data.error || 'Failed to revoke account.', 'error');
      return;
    }
    if (Array.isArray(data.accounts)) {
      setAccounts(data.accounts);
    }
    notify('Admin Revoked', `Removed '${targetUsername}' from backend vault.`, 'info');
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Backend Admin Username &amp; Password Vault (Scrypt Hashed)</span>
          </h2>
          <p className="text-neutral-500 mt-0.5">
            Create or rotate administrator login credentials stored securely on the backend.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-200 font-mono text-[11px]">
          ACTIVE SESSION: {adminSession?.username} ({adminSession?.role})
        </span>
      </div>

      {adminSession?.role === 'Super Admin' && (
        <form
          onSubmit={handleSaveAccount}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1"
        >
          <input
            type="text"
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username (e.g. vynoox_admin)"
            className="px-3 py-2 border border-neutral-300 font-mono"
          />
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password (min 8 chars)"
              className="w-full pl-3 pr-9 py-2 border border-neutral-300"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AdminRole)}
            className="px-3 py-2 border border-neutral-300 bg-white"
          >
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Order Manager">Order Manager</option>
            <option value="Content Manager">Content Manager</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase inline-flex items-center justify-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{loading ? 'Saving...' : 'Add / Rotate Password'}</span>
          </button>
        </form>
      )}

      <div className="divide-y border-t pt-2">
        {accounts.map((acc) => (
          <div key={acc.id} className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-mono font-bold text-neutral-900">{acc.username}</span>
                <span className="ml-2 px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-mono text-[10px] uppercase">
                  {acc.role}
                </span>
                {acc.lastLoginAt && (
                  <span className="text-neutral-400 font-mono text-[11px] ml-3">
                    Last login: {new Date(acc.lastLoginAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {adminSession?.role === 'Super Admin' &&
              acc.username !== adminSession.username && (
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(acc.username)}
                  className="text-red-600 hover:text-red-800 font-mono inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Revoke</span>
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};
