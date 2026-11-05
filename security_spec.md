# VYNOOX E-Commerce Platform — Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: No undefined collection or subcollection is ever readable or writable (`match /{document=**} { allow read, write: if false; }`).
2. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) enforces `isValidId(docId)` matching `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
3. **Strict Schema & Key Whitelisting**: Every entity has a dedicated `isValid[Entity](data)` helper enforcing `keys().hasAll(...)`, `keys().hasOnly(...)`, strict field types, and bounded `.size()` checks on every string.
4. **Role-Based Admin Verification**: Admin mutations require either the bootstrapped Super Admin (`subhasishdas1001@gmail.com` with `email_verified == true`) or an active document in `/admins/$(request.auth.uid)` with `email_verified == true`.
5. **PII Isolation**: `/customers/{customerId}` and `/orders/{orderId}` are strictly isolated so only the document owner (`request.auth.uid == customerId`) or verified Admin can read or list them.
6. **Temporal Integrity**: All write timestamps (`createdAt`, `updatedAt`) must match `request.time`.
7. **Terminal State Locking**: Orders in terminal states (`Delivered`, `Cancelled`, `Refunded`) cannot be mutated by non-admin users.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Product**: Adding `"isSuperFeatured": true` to `/products/prod-1` -> Rejected by `hasOnly()`.
2. **Unverified Admin Email Spoof**: Request with `email == 'subhasishdas1001@gmail.com'` and `email_verified == false` -> Rejected by `isVerifiedUser()`.
3. **Customer PII Lateral Read**: User `uid-A` attempting `get(/customers/uid-B)` -> Rejected by `isOwner(customerId) || isAdmin()`.
4. **Order Identity Spoofing**: User `uid-A` creating an order with `customerId: "uid-B"` -> Rejected by `incoming().customerId == request.auth.uid`.
5. **Order Terminal State Mutation**: Customer attempting to update an order after `status == 'Delivered'` -> Rejected by Terminal State Lock.
6. **Oversized String Denial-of-Wallet**: Submitting a 200,000-char string in `comment` on `/reviews/rev-1` -> Rejected by `data.comment.size() <= 2000`.
7. **ID Poisoning Attack**: Creating a document with a 300-character ID or special characters -> Rejected by `isValidId(id)`.
8. **Self-Assigned Admin Privilege**: Regular user attempting `create` on `/admins/uid-A` -> Rejected by `isAdmin()`.
9. **Review Author Spoofing**: User `uid-A` creating a review with `authorUid: "uid-B"` -> Rejected by `incoming().authorUid == request.auth.uid`.
10. **Client Timestamp Forgery**: Submitting a past or future `createdAt` timestamp on `/orders/{orderId}` -> Rejected by `incoming().createdAt == request.time`.
11. **Unbounded List Scraping on Orders**: Authenticated user issuing an unfiltered `list` query on `/orders` -> Rejected by `resource.data.customerId == request.auth.uid`.
12. **Unauthorized Coupon Creation**: Non-admin user creating a 100% discount coupon in `/coupons/free100` -> Rejected by `isAdmin()`.
