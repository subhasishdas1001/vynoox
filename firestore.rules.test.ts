/**
 * Phase 0 & Phase 5 Security Rules Verification Suite
 * Verifies the "Dirty Dozen" adversarial payloads against VYNOOX Firestore Rules.
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Product',
    collection: '/products/prod-1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { storeId: 'vynoox', name: 'Tee', isSuperFeatured: true }
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    collection: '/products/prod-1',
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Customer PII Lateral Read',
    collection: '/customers/uid-victim',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Order Identity Spoofing',
    collection: '/orders/ord-1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { customerId: 'uid-other' }
  },
  {
    id: 5,
    name: 'Order Terminal State Mutation',
    collection: '/orders/ord-delivered',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { status: 'Cancelled' }
  },
  {
    id: 6,
    name: 'Oversized String Denial-of-Wallet',
    collection: '/reviews/rev-1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { comment: 'x'.repeat(5000) }
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    collection: '/products/invalid$id!@#',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Self-Assigned Admin Privilege',
    collection: '/admins/uid-attacker',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { role: 'Super Admin', active: true }
  },
  {
    id: 9,
    name: 'Review Author Spoofing',
    collection: '/reviews/rev-2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { authorUid: 'uid-someone-else' }
  },
  {
    id: 10,
    name: 'Client Timestamp Forgery',
    collection: '/orders/ord-2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { createdAt: '1999-01-01T00:00:00Z' }
  },
  {
    id: 11,
    name: 'Unbounded List Scraping on Orders',
    collection: '/orders',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Unauthorized Coupon Creation',
    collection: '/coupons/free100',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { code: 'FREE100', value: 100 }
  }
];
