import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import {
  AdminUser,
  CategoryItem,
  CMSPage,
  CollectionItem,
  CouponItem,
  CustomerProfile,
  MediaLibraryItem,
  OrderItem,
  OrderStatus,
  Product,
  ReviewItem,
} from './types/store';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { getDownloadURL, storageRef, uploadBytesResumable };

export const BOOTSTRAPPED_ADMIN_EMAIL = 'subhasishdas1001@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem('vynoox_admin_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function acquireAdminWriteLease(
  collectionName: string,
  docId: string,
  mode: 'write' | 'delete' = 'write'
): Promise<string | null> {
  // If already signed in via Firebase Auth as the verified bootstrapped admin, no lease needed
  if (
    auth.currentUser &&
    auth.currentUser.emailVerified &&
    auth.currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL
  ) {
    return null;
  }

  try {
    const res = await fetch('/api/admin/firestore-lease', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({
        collection: collectionName,
        docId,
        mode,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok && typeof data.leaseId === 'string' ? data.leaseId : null;
  } catch {
    return null;
  }
}

export async function consumeAdminWriteLease(leaseId: string | null): Promise<void> {
  if (!leaseId) return;
  try {
    await fetch('/api/admin/firestore-lease/consume', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ leaseId }),
    });
  } catch {
    // Non-blocking lease cleanup
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  // Log structured diagnostic info to console for engineering inspection
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Throw clean, human-readable error message for UI (never expose raw JSON strings)
  const lower = rawMessage.toLowerCase();
  const isMediaPath =
    Boolean(path) &&
    (path!.includes('media_library') || path!.includes('hero_config') || path!.includes('ugc'));

  if (lower.includes('permission') || lower.includes('insufficient')) {
    if (isMediaPath) {
      throw new Error(
        "You don't have permission to upload media. Please verify your admin access."
      );
    }
    throw new Error(
      "You don't have permission to perform this action. Please verify your admin access."
    );
  }

  if (isMediaPath) {
    throw new Error('File uploaded, but media information could not be saved.');
  }

  throw new Error('Unable to save changes to the database. Please try again.');
}

// Validate connection to Firestore on boot (Mandatory per Firebase skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeId(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return cleaned || `id-${Date.now()}`;
}

export function clampStr(val: string | undefined | null, max: number, fallback = ''): string {
  const str = (val ?? fallback).toString();
  return str.slice(0, max);
}

export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

// Audit Logger
export async function logAdminActivity(action: string, details: string) {
  const logId = sanitizeId(`log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const actorUid = sanitizeId(auth.currentUser?.uid || 'admin-session');
  const actorEmail = clampStr(auth.currentUser?.email, 160, 'admin@vynoox.com');
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('logs', logId, 'write');
    if (!auth.currentUser && !leaseId) return;
    await setDoc(doc(db, 'logs', logId), {
      storeId: 'vynoox',
      actorUid,
      actorEmail,
      action: clampStr(action, 160, 'Admin Action'),
      details: clampStr(details, 1000, ''),
      createdAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    });
  } catch {
    // Non-blocking audit log write
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Product CRUD
export async function saveProductToDb(product: Product) {
  const id = sanitizeId(product.id || product.slug || `prod-${Date.now()}`);
  const path = `products/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('products', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      name: clampStr(product.name, 160, 'Untitled Product'),
      slug: sanitizeId(product.slug || product.name.toLowerCase()),
      description: clampStr(product.description, 5000, ''),
      regularPrice: Math.max(0, Number(product.regularPrice) || 0),
      salePrice: Math.max(0, Number(product.salePrice) || 0),
      compareAtPrice: Math.max(0, Number(product.compareAtPrice) || 0),
      sku: clampStr(product.sku, 80, `VYN-${Date.now().toString().slice(-4)}`),
      barcode: clampStr(product.barcode, 80, ''),
      category: clampStr(product.category, 100, 'Oversized Tees'),
      collection: clampStr(product.collection, 100, 'Acid Wash Series'),
      status: (['published', 'draft', 'archived'].includes(product.status)
        ? product.status
        : 'published') as 'published' | 'draft' | 'archived',
      stockQuantity: Math.max(0, Math.floor(Number(product.stockQuantity) || 0)),
      lowStockThreshold: Math.max(0, Math.floor(Number(product.lowStockThreshold) || 5)),
      trackInventory: Boolean(product.trackInventory),
      allowBackorder: Boolean(product.allowBackorder),
      featured: Boolean(product.featured),
      newArrival: Boolean(product.newArrival),
      bestSeller: Boolean(product.bestSeller),
      primaryImage: clampStr(product.primaryImage, 150000, ''),
      secondaryImage: clampStr(product.secondaryImage, 150000, ''),
      videoUrl: clampStr(product.videoUrl, 500, ''),
      sizesCsv: clampStr(product.sizesCsv, 200, 'XS,S,M,L,XL,XXL'),
      colorsCsv: clampStr(product.colorsCsv, 300, 'Washed Charcoal,Bone Ivory'),
      materialsCsv: clampStr(product.materialsCsv, 300, '100% Heavyweight Combed Cotton (280 GSM)'),
      stylesCsv: clampStr(product.stylesCsv, 300, 'Drop Shoulder Boxy Fit'),
      tagsCsv: clampStr(product.tagsCsv, 500, 'streetwear,luxury,unisex'),
      variantInventoryJson: clampStr(product.variantInventoryJson, 5000, '{}'),
      seoTitle: clampStr(product.seoTitle || product.name, 160, product.name),
      seoDescription: clampStr(product.seoDescription || product.description, 400, ''),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'products', id), payload);
    await logAdminActivity('Saved Product', `${payload.name} (${payload.sku})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteProductFromDb(productId: string) {
  const id = sanitizeId(productId);
  const path = `products/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('products', id, 'delete');
    await deleteDoc(doc(db, 'products', id));
    await logAdminActivity('Deleted Product', `Product ID: ${id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Collection CRUD
export async function saveCollectionToDb(col: CollectionItem) {
  const id = sanitizeId(col.id || col.slug || `col-${Date.now()}`);
  const path = `collections/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('collections', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      name: clampStr(col.name, 120, 'Collection'),
      slug: sanitizeId(col.slug || col.name.toLowerCase()),
      description: clampStr(col.description, 1500, ''),
      image: clampStr(col.image, 150000, ''),
      featured: Boolean(col.featured),
      sortOrder: Number(col.sortOrder) || 0,
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'collections', id), payload);
    await logAdminActivity('Saved Collection', payload.name);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteCollectionFromDb(collectionId: string) {
  const id = sanitizeId(collectionId);
  const path = `collections/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('collections', id, 'delete');
    await deleteDoc(doc(db, 'collections', id));
    await logAdminActivity('Deleted Collection', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Category CRUD
export async function saveCategoryToDb(cat: CategoryItem) {
  const id = sanitizeId(cat.id || cat.slug || `cat-${Date.now()}`);
  const path = `categories/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('categories', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      name: clampStr(cat.name, 120, 'Category'),
      slug: sanitizeId(cat.slug || cat.name.toLowerCase()),
      description: clampStr(cat.description, 1000, ''),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'categories', id), payload);
    await logAdminActivity('Saved Category', payload.name);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteCategoryFromDb(categoryId: string) {
  const id = sanitizeId(categoryId);
  const path = `categories/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('categories', id, 'delete');
    await deleteDoc(doc(db, 'categories', id));
    await logAdminActivity('Deleted Category', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Order CRUD
export async function createOrderInDb(order: OrderItem) {
  const id = sanitizeId(order.id || `ord-${Date.now()}`);
  const path = `orders/${id}`;
  const payload = {
    storeId: 'vynoox' as const,
    orderNumber: clampStr(order.orderNumber, 64, `VYN-${Date.now().toString().slice(-6)}`),
    customerId: sanitizeId(order.customerId),
    customerName: clampStr(order.customerName, 160, 'Valued Client'),
    customerEmail: clampStr(order.customerEmail, 160, 'client@vynoox.com'),
    customerPhone: clampStr(order.customerPhone, 40, '+91 9876543210'),
    shippingAddress: clampStr(order.shippingAddress, 1000, ''),
    city: clampStr(order.city, 100, ''),
    state: clampStr(order.state, 100, ''),
    pinCode: clampStr(order.pinCode, 30, ''),
    country: clampStr(order.country, 100, 'India'),
    itemsSummary: clampStr(order.itemsSummary, 10000, '[]'),
    subtotal: Math.max(0, Number(order.subtotal) || 0),
    discountAmount: Math.max(0, Number(order.discountAmount) || 0),
    shippingAmount: Math.max(0, Number(order.shippingAmount) || 0),
    totalAmount: Math.max(0, Number(order.totalAmount) || 0),
    couponCode: clampStr(order.couponCode, 64, ''),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: clampStr(order.paymentReference, 200, ''),
    status: order.status,
    trackingNumber: clampStr(order.trackingNumber, 120, ''),
    carrier: clampStr(order.carrier, 120, ''),
    internalNotes: clampStr(order.internalNotes, 2000, ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'orders', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderInDb(
  order: OrderItem,
  updates: Partial<{
    status: OrderStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    trackingNumber: string;
    carrier: string;
    internalNotes: string;
  }>
) {
  const id = sanitizeId(order.id);
  const path = `orders/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('orders', id, 'write');
    await updateDoc(doc(db, 'orders', id), {
      ...updates,
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    });
    await logAdminActivity(
      'Updated Order',
      `Order ${order.orderNumber} -> ${updates.status || order.status}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Customer Profile CRUD
export async function saveCustomerProfileToDb(profile: CustomerProfile) {
  const id = sanitizeId(profile.uid);
  const path = `customers/${id}`;
  let leaseId: string | null = null;
  try {
    if (!auth.currentUser || auth.currentUser.uid !== id) {
      leaseId = await acquireAdminWriteLease('customers', id, 'write');
    }
    const payload = {
      uid: id,
      fullName: clampStr(profile.fullName, 160, ''),
      email: clampStr(profile.email, 160, ''),
      phone: clampStr(profile.phone, 40, ''),
      defaultAddress: clampStr(profile.defaultAddress, 1000, ''),
      city: clampStr(profile.city, 100, ''),
      state: clampStr(profile.state, 100, ''),
      pinCode: clampStr(profile.pinCode, 30, ''),
      country: clampStr(profile.country, 100, 'India'),
      wishlistIdsCsv: clampStr(profile.wishlistIdsCsv, 2000, ''),
      internalNotes: clampStr(profile.internalNotes, 2000, ''),
      totalSpent: Math.max(0, Number(profile.totalSpent) || 0),
      ordersCount: Math.max(0, Math.floor(Number(profile.ordersCount) || 0)),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'customers', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Coupon CRUD
export async function saveCouponToDb(coupon: CouponItem) {
  const id = sanitizeId(coupon.id || coupon.code.toLowerCase());
  const path = `coupons/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('coupons', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      code: clampStr(coupon.code.toUpperCase().trim(), 40, 'VYNOOX10'),
      type: coupon.type,
      value: Math.max(0, Number(coupon.value) || 0),
      minPurchase: Math.max(0, Number(coupon.minPurchase) || 0),
      expiryDate: clampStr(coupon.expiryDate, 64, '2027-12-31'),
      usageLimit: Math.max(0, Math.floor(Number(coupon.usageLimit) || 100)),
      usedCount: Math.max(0, Math.floor(Number(coupon.usedCount) || 0)),
      appliesTo: clampStr(coupon.appliesTo, 200, 'all'),
      active: Boolean(coupon.active),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'coupons', id), payload);
    await logAdminActivity('Saved Coupon', `${payload.code} (${payload.type})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteCouponFromDb(couponId: string) {
  const id = sanitizeId(couponId);
  const path = `coupons/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('coupons', id, 'delete');
    await deleteDoc(doc(db, 'coupons', id));
    await logAdminActivity('Deleted Coupon', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Review CRUD
export async function createReviewInDb(review: ReviewItem) {
  const id = sanitizeId(review.id || `rev-${Date.now()}`);
  const path = `reviews/${id}`;
  const payload = {
    storeId: 'vynoox' as const,
    productId: sanitizeId(review.productId),
    productName: clampStr(review.productName, 160, 'VYNOOX Garment'),
    authorUid: sanitizeId(review.authorUid),
    authorName: clampStr(review.authorName, 120, 'Verified Client'),
    rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
    title: clampStr(review.title, 160, 'Exceptional Craftsmanship'),
    comment: clampStr(review.comment, 2000, ''),
    reviewImage: clampStr(review.reviewImage, 150000, ''),
    verifiedPurchase: Boolean(review.verifiedPurchase),
    status: review.status,
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'reviews', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateReviewStatusInDb(
  review: ReviewItem,
  status: 'approved' | 'pending' | 'rejected',
  verifiedPurchase: boolean
) {
  const id = sanitizeId(review.id);
  const path = `reviews/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('reviews', id, 'write');
    await updateDoc(doc(db, 'reviews', id), {
      status,
      verifiedPurchase,
      ...(leaseId ? { writeNonce: leaseId } : {}),
    });
    await logAdminActivity('Moderated Review', `${review.authorName} -> ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteReviewFromDb(reviewId: string) {
  const id = sanitizeId(reviewId);
  const path = `reviews/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('reviews', id, 'delete');
    await deleteDoc(doc(db, 'reviews', id));
    await logAdminActivity('Deleted Review', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// CMS Page CRUD
export async function savePageToDb(page: CMSPage) {
  const id = sanitizeId(page.id || page.slug);
  const path = `pages/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('pages', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      title: clampStr(page.title, 160, 'Page'),
      slug: sanitizeId(page.slug || page.title.toLowerCase()),
      subtitle: clampStr(page.subtitle, 300, ''),
      content: clampStr(page.content, 25000, ''),
      seoTitle: clampStr(page.seoTitle || page.title, 160, page.title),
      seoDescription: clampStr(page.seoDescription || page.subtitle, 400, ''),
      published: Boolean(page.published),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'pages', id), payload);
    await logAdminActivity('Saved Page', payload.title);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deletePageFromDb(pageId: string) {
  const id = sanitizeId(pageId);
  const path = `pages/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('pages', id, 'delete');
    await deleteDoc(doc(db, 'pages', id));
    await logAdminActivity('Deleted Page', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// StoreConfig Settings CRUD (Theme, Homepage Sections, Hero Config, Media Library, General, Shipping, Payment, Marketing, Navigation)
export async function saveStoreConfigToDb(configKey: string, data: unknown) {
  const id = sanitizeId(configKey);
  const path = `settings/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('settings', id, 'write');
    const payload = {
      storeId: 'vynoox' as const,
      configKey: clampStr(id, 80, id),
      payload: clampStr(JSON.stringify(data), 900000, '{}'),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'settings', id), payload);
    await logAdminActivity('Updated Store Config', configKey);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Structured Media Library Document CRUD (/media_library/{mediaId})
export async function saveMediaItemToDb(item: MediaLibraryItem) {
  const id = sanitizeId(item.id || `media-${Date.now()}`);
  const path = `media_library/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('media_library', id, 'write');
    const inferredMime =
      item.fileType ||
      (item.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
    const inferredCategory =
      item.mediaCategory ||
      (item.deviceTarget === 'mobile'
        ? 'hero_mobile'
        : item.deviceTarget === 'desktop'
        ? 'hero_desktop'
        : 'general');
    const payload = {
      storeId: 'vynoox' as const,
      id,
      title: clampStr(item.title || item.fileName, 200, 'VYNOOX Media Asset'),
      fileName: clampStr(item.fileName, 200, 'vynoox-media.jpg'),
      fileType: clampStr(inferredMime, 80, 'image/jpeg'),
      mediaType: (item.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
      mediaCategory: clampStr(inferredCategory, 80, 'general'),
      deviceTarget: (['desktop', 'mobile', 'universal'].includes(item.deviceTarget)
        ? item.deviceTarget
        : 'desktop') as 'desktop' | 'mobile' | 'universal',
      url: clampStr(item.url, 250000, ''),
      downloadUrl: clampStr(item.downloadUrl || item.url, 250000, ''),
      storagePath: clampStr(
        item.storagePath || `vynoox_media/${inferredCategory}/${item.fileName}`,
        500,
        ''
      ),
      thumbnailUrl: clampStr(item.thumbnailUrl || '', 150000, ''),
      fileSizeBytes: Math.max(0, Math.floor(Number(item.fileSizeBytes) || 0)),
      dimensions: clampStr(item.dimensions || '1920x1080', 64, '1920x1080'),
      durationSeconds: Math.max(0, Math.floor(Number(item.durationSeconds) || 0)),
      uploadedAt: clampStr(item.uploadedAt || new Date().toISOString().slice(0, 10), 64, ''),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'media_library', id), payload);
    await logAdminActivity('Saved Media Asset', `${payload.fileName} (${payload.dimensions})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteMediaItemFromDb(mediaId: string, storagePath?: string) {
  const id = sanitizeId(mediaId);
  const path = `media_library/${id}`;
  let leaseId: string | null = null;
  try {
    if (storagePath && storagePath.startsWith('vynoox_media/')) {
      await fetch('/api/admin/storage/file', {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ storagePath }),
      }).catch(() => {});
    }
    leaseId = await acquireAdminWriteLease('media_library', id, 'delete');
    await deleteDoc(doc(db, 'media_library', id));
    await logAdminActivity('Deleted Media Asset', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

// Staff / Admin User CRUD
export async function saveAdminUserToDb(adminUser: AdminUser) {
  const id = sanitizeId(adminUser.uid);
  const path = `admins/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('admins', id, 'write');
    const payload = {
      uid: id,
      email: clampStr(adminUser.email, 160, ''),
      name: clampStr(adminUser.name, 120, ''),
      role: adminUser.role,
      active: Boolean(adminUser.active),
      updatedAt: serverTimestamp(),
      ...(leaseId ? { writeNonce: leaseId } : {}),
    };
    await setDoc(doc(db, 'admins', id), payload);
    await logAdminActivity('Saved Staff Member', `${payload.email} (${payload.role})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export async function deleteAdminUserFromDb(uid: string) {
  const id = sanitizeId(uid);
  const path = `admins/${id}`;
  let leaseId: string | null = null;
  try {
    leaseId = await acquireAdminWriteLease('admins', id, 'delete');
    await deleteDoc(doc(db, 'admins', id));
    await logAdminActivity('Removed Staff Member', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  } finally {
    await consumeAdminWriteLease(leaseId);
  }
}

export { collection, doc };
