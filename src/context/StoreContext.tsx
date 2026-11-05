import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  createOrderInDb,
  createReviewInDb,
  db,
  deleteAdminUserFromDb,
  deleteCategoryFromDb,
  deleteCollectionFromDb,
  deleteCouponFromDb,
  deleteMediaItemFromDb,
  deletePageFromDb,
  deleteProductFromDb,
  deleteReviewFromDb,
  saveAdminUserToDb,
  saveCategoryToDb,
  saveCollectionToDb,
  saveCouponToDb,
  saveCustomerProfileToDb,
  saveMediaItemToDb,
  savePageToDb,
  saveProductToDb,
  saveStoreConfigToDb,
  signInWithGooglePopup,
  signOutUser,
  updateOrderInDb,
  updateReviewStatusInDb,
} from '../firebase';
import {
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_HERO_CONFIG,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_MARKETING_SETTINGS,
  DEFAULT_NAVIGATION_LINKS,
  DEFAULT_NEW_ARRIVALS_CONFIG,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
  DEFAULT_THEME_SETTINGS,
  DEFAULT_UGC_CONFIG,
  INITIAL_CATEGORIES,
  INITIAL_CMS_PAGES,
  INITIAL_COLLECTIONS,
  INITIAL_COUPONS,
  INITIAL_MEDIA_LIBRARY,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
} from '../data/initialCatalog';
import {
  ActivityLogItem,
  AdminRole,
  AdminSectionId,
  AdminUser,
  CartItem,
  CategoryItem,
  CMSPage,
  CollectionItem,
  CouponItem,
  CustomerProfile,
  HeroConfig,
  HomepageSection,
  MarketingSettings,
  MediaLibraryItem,
  NavigationLink,
  NewArrivalsShowcaseConfig,
  OrderItem,
  OrderStatus,
  PaymentSettings,
  Product,
  ReviewItem,
  ShippingSettings,
  StoreGeneralSettings,
  StorePageId,
  ThemeSettings,
  UgcSectionConfig,
} from '../types/store';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AdminSessionInfo {
  username: string;
  role: AdminRole;
  issuedAt: string;
  expiresAt: string;
}

interface StoreContextValue {
  // Auth & Roles
  currentUser: User | null;
  authLoading: boolean;
  isAdminUser: boolean;
  currentAdminRole: AdminRole | null;
  adminSession: AdminSessionInfo | null;
  adminAuthChecking: boolean;
  adminSystemInitialized: boolean;
  adminSessionToken: string | null;
  loginAdminWithCredentials: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; needsInitialSetup?: boolean }>;
  setupInitialSuperAdmin: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutAdminSession: () => Promise<void>;
  refreshAdminSession: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Navigation
  currentPage: StorePageId;
  adminSection: AdminSectionId;
  selectedProductSlug: string | null;
  selectedCollectionSlug: string | null;
  selectedCategorySlug: string | null;
  searchQuery: string;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  navigateTo: (
    page: StorePageId,
    options?: {
      productSlug?: string;
      collectionSlug?: string;
      categorySlug?: string;
      adminSection?: AdminSectionId;
    }
  ) => void;
  setAdminSection: (sec: AdminSectionId) => void;

  // Storefront Data (Real-time synced with Firestore)
  products: Product[];
  collections: CollectionItem[];
  categories: CategoryItem[];
  coupons: CouponItem[];
  reviews: ReviewItem[];
  pages: CMSPage[];
  orders: OrderItem[];
  customers: CustomerProfile[];
  currentCustomerProfile: CustomerProfile | null;
  staffMembers: AdminUser[];
  activityLogs: ActivityLogItem[];

  // Store Configurations
  homepageSections: HomepageSection[];
  heroConfig: HeroConfig;
  heroDraftConfig: HeroConfig | null;
  newArrivalsConfig: NewArrivalsShowcaseConfig;
  ugcConfig: UgcSectionConfig;
  mediaLibrary: MediaLibraryItem[];
  themeSettings: ThemeSettings;
  generalSettings: StoreGeneralSettings;
  shippingSettings: ShippingSettings;
  paymentSettings: PaymentSettings;
  marketingSettings: MarketingSettings;
  navigationLinks: NavigationLink[];

  // Shopping Cart & Wishlist
  cart: CartItem[];
  wishlistIds: string[];
  appliedCoupon: CouponItem | null;
  addToCart: (item: CartItem, openDrawer?: boolean) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;

  // Database Mutations
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCollection: (col: CollectionItem) => Promise<void>;
  deleteCollection: (colId: string) => Promise<void>;
  saveCategory: (cat: CategoryItem) => Promise<void>;
  deleteCategory: (catId: string) => Promise<void>;
  placeOrder: (order: OrderItem) => Promise<OrderItem>;
  updateOrder: (
    order: OrderItem,
    updates: Partial<{
      status: OrderStatus;
      paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
      trackingNumber: string;
      carrier: string;
      internalNotes: string;
    }>
  ) => Promise<void>;
  saveCustomerProfile: (profile: CustomerProfile) => Promise<void>;
  saveCoupon: (coupon: CouponItem) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  submitReview: (review: ReviewItem) => Promise<void>;
  moderateReview: (
    review: ReviewItem,
    status: 'approved' | 'pending' | 'rejected',
    verifiedPurchase: boolean
  ) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  savePage: (page: CMSPage) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  updateHomepageSections: (sections: HomepageSection[], persist?: boolean) => Promise<void>;
  updateHeroConfig: (config: HeroConfig, persist?: boolean) => Promise<void>;
  saveHeroDraft: (config: HeroConfig) => Promise<void>;
  updateNewArrivalsConfig: (
    config: NewArrivalsShowcaseConfig,
    persist?: boolean
  ) => Promise<void>;
  updateUgcConfig: (config: UgcSectionConfig, persist?: boolean) => Promise<void>;
  updateMediaLibrary: (items: MediaLibraryItem[], persist?: boolean) => Promise<void>;
  updateThemeSettings: (theme: ThemeSettings, persist?: boolean) => Promise<void>;
  updateGeneralSettings: (settings: StoreGeneralSettings) => Promise<void>;
  updateShippingSettings: (settings: ShippingSettings) => Promise<void>;
  updatePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  updateMarketingSettings: (settings: MarketingSettings) => Promise<void>;
  updateNavigationLinks: (links: NavigationLink[]) => Promise<void>;
  saveStaffMember: (staff: AdminUser) => Promise<void>;
  removeStaffMember: (uid: string) => Promise<void>;
  seedInitialDatabase: () => Promise<void>;
  isSeeding: boolean;

  // Notifications
  toasts: ToastNotification[];
  notify: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Backend Admin Session State
  const [adminSession, setAdminSession] = useState<AdminSessionInfo | null>(null);
  const [adminAuthChecking, setAdminAuthChecking] = useState<boolean>(true);
  const [adminSystemInitialized, setAdminSystemInitialized] = useState<boolean>(true);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('vynoox_admin_token');
    }
    return null;
  });

  // Check initial URL path for /admin
  const initialPage: StorePageId =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
      ? 'admin'
      : 'home';

  const [currentPage, setCurrentPage] = useState<StorePageId>(initialPage);
  const [adminSection, setAdminSection] = useState<AdminSectionId>('overview');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(
    INITIAL_PRODUCTS[0].slug
  );
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Storefront entities state (seeded with initial catalog and synced live with Firestore)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [collections, setCollections] = useState<CollectionItem[]>(INITIAL_COLLECTIONS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [coupons, setCoupons] = useState<CouponItem[]>(INITIAL_COUPONS);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [pages, setPages] = useState<CMSPage[]>(INITIAL_CMS_PAGES);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [staffMembers, setStaffMembers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Store configs
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(
    DEFAULT_HOMEPAGE_SECTIONS
  );
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [heroDraftConfig, setHeroDraftConfig] = useState<HeroConfig | null>(null);
  const [newArrivalsConfig, setNewArrivalsConfig] = useState<NewArrivalsShowcaseConfig>(
    DEFAULT_NEW_ARRIVALS_CONFIG
  );
  const [ugcConfig, setUgcConfig] = useState<UgcSectionConfig>(DEFAULT_UGC_CONFIG);
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>(INITIAL_MEDIA_LIBRARY);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS);
  const [generalSettings, setGeneralSettings] = useState<StoreGeneralSettings>(
    DEFAULT_GENERAL_SETTINGS
  );
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(
    DEFAULT_SHIPPING_SETTINGS
  );
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    DEFAULT_PAYMENT_SETTINGS
  );
  const [marketingSettings, setMarketingSettings] = useState<MarketingSettings>(
    DEFAULT_MARKETING_SETTINGS
  );
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>(
    DEFAULT_NAVIGATION_LINKS
  );

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: INITIAL_PRODUCTS[0].id,
      name: INITIAL_PRODUCTS[0].name,
      slug: INITIAL_PRODUCTS[0].slug,
      sku: INITIAL_PRODUCTS[0].sku,
      price: INITIAL_PRODUCTS[0].salePrice,
      regularPrice: INITIAL_PRODUCTS[0].regularPrice,
      image: INITIAL_PRODUCTS[0].primaryImage,
      size: 'L',
      color: 'Washed Charcoal',
      material: '100% Heavyweight Combed Cotton (280 GSM)',
      style: 'Oversized Drop-Shoulder Fit',
      quantity: 1,
    },
  ]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    INITIAL_PRODUCTS[0].id,
    INITIAL_PRODUCTS[1].id,
  ]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [hasAutoSeeded, setHasAutoSeeded] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const notify = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth listener (Customer Google Auth & optional Cloud Firestore sync)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Verify Backend Admin Session on Mount, Route Change to /admin, & Periodic Check
  const refreshAdminSession = React.useCallback(async () => {
    try {
      const token =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('vynoox_admin_token')
          : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/auth-status', {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setAdminSession(null);
        return;
      }
      const data = await res.json();
      setAdminSystemInitialized(Boolean(data.initialized));
      if (data.authenticated && data.admin) {
        setAdminSession(data.admin as AdminSessionInfo);
      } else {
        setAdminSession(null);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('vynoox_admin_token');
        }
        setAdminSessionToken(null);
      }
    } catch {
      setAdminSession(null);
    } finally {
      setAdminAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminSession();
    const interval = setInterval(() => {
      refreshAdminSession();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshAdminSession]);

  // Listen for browser popstate (manual URL changes / back-forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentPage('admin');
        refreshAdminSession();
      } else if (currentPage === 'admin') {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, refreshAdminSession]);

  const isBootstrappedAdmin = Boolean(
    currentUser?.email === BOOTSTRAPPED_ADMIN_EMAIL && currentUser?.emailVerified
  );

  // Admin access requires a verified backend admin session
  const isAdminUser = Boolean(adminSession);
  const currentAdminRole: AdminRole | null = adminSession?.role || null;

  // Public Storefront Firestore Listeners
  useEffect(() => {
    const mergeMediaItems = (
      incoming: MediaLibraryItem[],
      existing: MediaLibraryItem[]
    ): MediaLibraryItem[] => {
      const byId = new Map<string, MediaLibraryItem>();
      for (const item of incoming) {
        if (item && item.id) {
          byId.set(item.id, item);
        }
      }
      for (const prev of existing) {
        if (prev && prev.id && !byId.has(prev.id)) {
          byId.set(prev.id, prev);
        }
      }
      const all = Array.from(byId.values());
      // Keep uploaded storage assets at the top, followed by starter assets
      return all.sort((a, b) => {
        const aUploaded = a.url?.startsWith('/api/media/files/') ? 1 : 0;
        const bUploaded = b.url?.startsWith('/api/media/files/') ? 1 : 0;
        if (aUploaded !== bUploaded) return bUploaded - aUploaded;
        return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
      });
    };

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: Product[] = snap.docs.map((d) => ({
            ...(d.data() as Product),
            id: d.id,
          }));
          setProducts(list);
        } else if (isBootstrappedAdmin && !hasAutoSeeded) {
          setHasAutoSeeded(true);
          seedInitialDatabase().catch(() => {});
        }
      },
      () => {
        // Fallback to initial catalog if offline
      }
    );

    const unsubCollections = onSnapshot(
      query(collection(db, 'collections'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: CollectionItem[] = snap.docs
            .map((d) => ({ ...(d.data() as CollectionItem), id: d.id }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setCollections(list);
        }
      },
      () => {}
    );

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: CategoryItem[] = snap.docs.map((d) => ({
            ...(d.data() as CategoryItem),
            id: d.id,
          }));
          setCategories(list);
        }
      },
      () => {}
    );

    const unsubCoupons = onSnapshot(
      query(collection(db, 'coupons'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: CouponItem[] = snap.docs.map((d) => ({
            ...(d.data() as CouponItem),
            id: d.id,
          }));
          setCoupons(list);
        }
      },
      () => {}
    );

    const unsubReviews = onSnapshot(
      query(collection(db, 'reviews'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: ReviewItem[] = snap.docs.map((d) => ({
            ...(d.data() as ReviewItem),
            id: d.id,
          }));
          setReviews(list);
        }
      },
      () => {}
    );

    const unsubPages = onSnapshot(
      query(collection(db, 'pages'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const list: CMSPage[] = snap.docs.map((d) => ({
            ...(d.data() as CMSPage),
            id: d.id,
          }));
          setPages(list);
        }
      },
      () => {}
    );

    const sanitizeHeroSlideVideos = (cfg: HeroConfig): HeroConfig => {
      if (!cfg || !Array.isArray(cfg.slides)) return cfg;
      const isBadVideoUrl = (u?: string) =>
        !u ||
        !u.trim() ||
        u.startsWith('data:image/svg+xml') ||
        u.includes('assets.mixkit.co');
      return {
        ...cfg,
        slides: cfg.slides.map((s) => ({
          ...s,
          desktopVideoUrl: isBadVideoUrl(s.desktopVideoUrl) ? '' : s.desktopVideoUrl,
          mobileVideoUrl: isBadVideoUrl(s.mobileVideoUrl) ? '' : s.mobileVideoUrl,
        })),
      };
    };

    const unsubSettings = onSnapshot(
      query(collection(db, 'settings'), where('storeId', '==', 'vynoox')),
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added' && change.type !== 'modified') return;
          const d = change.doc;
          const data = d.data();
          if (!data?.payload) return;
          try {
            const parsed = JSON.parse(data.payload);
            switch (d.id) {
              case 'homepage_sections':
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setHomepageSections(parsed);
                }
                break;
              case 'theme_settings':
                setThemeSettings((prev) => ({ ...prev, ...parsed }));
                break;
              case 'general_settings':
                setGeneralSettings((prev) => ({ ...prev, ...parsed }));
                break;
              case 'shipping_settings':
                setShippingSettings((prev) => ({ ...prev, ...parsed }));
                break;
              case 'payment_settings':
                setPaymentSettings((prev) => ({ ...prev, ...parsed }));
                break;
              case 'marketing_settings':
                setMarketingSettings((prev) => ({ ...prev, ...parsed }));
                break;
              case 'navigation_links':
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setNavigationLinks(parsed);
                }
                break;
              case 'hero_config':
                setHeroConfig((prev) => {
                  const next = sanitizeHeroSlideVideos({ ...prev, ...parsed });
                  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
                });
                break;
              case 'hero_config_draft':
                setHeroDraftConfig(sanitizeHeroSlideVideos(parsed));
                break;
              case 'new_arrivals_showcase':
                setNewArrivalsConfig((prev) => ({ ...prev, ...parsed }));
                break;
              case 'ugc_video_showcase':
                setUgcConfig((prev) => ({ ...prev, ...parsed }));
                break;
              case 'media_library':
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setMediaLibrary((prev) => mergeMediaItems(parsed, prev));
                }
                break;
            }
          } catch {
            // Ignore malformed JSON config
          }
        });
      },
      () => {}
    );

    // Direct document listeners for hero_config and media_library guarantee instant updates
    const unsubHeroDoc = onSnapshot(
      doc(db, 'settings', 'hero_config'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data?.payload) return;
        try {
          const parsed = JSON.parse(data.payload);
          setHeroConfig((prev) => {
            const next = sanitizeHeroSlideVideos({ ...prev, ...parsed });
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
          });
        } catch {
          // Ignore malformed JSON
        }
      },
      () => {}
    );

    const unsubMediaLibraryDoc = onSnapshot(
      doc(db, 'settings', 'media_library'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data?.payload) return;
        try {
          const parsed = JSON.parse(data.payload);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMediaLibrary(parsed);
          }
        } catch {
          // Ignore malformed JSON
        }
      },
      () => {}
    );

    const unsubMediaDocs = onSnapshot(
      query(collection(db, 'media_library'), where('storeId', '==', 'vynoox')),
      (snap) => {
        if (!snap.empty) {
          const docsList: MediaLibraryItem[] = snap.docs.map((d) => {
            const raw = d.data() as MediaLibraryItem;
            return {
              ...raw,
              id: d.id,
            };
          });
          setMediaLibrary((prev) => mergeMediaItems(docsList, prev));
        }
      },
      () => {}
    );

    return () => {
      unsubProducts();
      unsubCollections();
      unsubCategories();
      unsubCoupons();
      unsubReviews();
      unsubPages();
      unsubSettings();
      unsubHeroDoc();
      unsubMediaLibraryDoc();
      unsubMediaDocs();
    };
  }, [isBootstrappedAdmin, hasAutoSeeded]);

  // Authenticated Firestore Listeners (Orders, Customers, Admins, Logs)
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setCustomers([]);
      setStaffMembers([]);
      setActivityLogs([]);
      return;
    }

    if (isBootstrappedAdmin) {
      const unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snap) => {
          const list: OrderItem[] = snap.docs.map((d) => ({
            ...(d.data() as OrderItem),
            id: d.id,
          }));
          setOrders(list);
        },
        () => {}
      );

      const unsubCustomers = onSnapshot(
        collection(db, 'customers'),
        (snap) => {
          const list: CustomerProfile[] = snap.docs.map((d) => ({
            ...(d.data() as CustomerProfile),
            uid: d.id,
          }));
          setCustomers(list);
          const own = list.find((c) => c.uid === currentUser.uid);
          if (own?.wishlistIdsCsv) {
            setWishlistIds(own.wishlistIdsCsv.split(',').filter(Boolean));
          }
        },
        () => {}
      );

      const unsubAdmins = onSnapshot(
        collection(db, 'admins'),
        (snap) => {
          const list: AdminUser[] = snap.docs.map((d) => ({
            ...(d.data() as AdminUser),
            uid: d.id,
          }));
          setStaffMembers(list);
        },
        () => {}
      );

      const unsubLogs = onSnapshot(
        collection(db, 'logs'),
        (snap) => {
          const list: ActivityLogItem[] = snap.docs.map((d) => ({
            ...(d.data() as ActivityLogItem),
            id: d.id,
          }));
          setActivityLogs(list);
        },
        () => {}
      );

      return () => {
        unsubOrders();
        unsubCustomers();
        unsubAdmins();
        unsubLogs();
      };
    }
  }, [currentUser, isBootstrappedAdmin]);

  // Apply Live Theme Customizer CSS Variables & Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--vynoox-primary', themeSettings.primaryColor);
    root.style.setProperty('--vynoox-secondary', themeSettings.secondaryColor);
    root.style.setProperty('--vynoox-bg', themeSettings.backgroundColor);
    root.style.setProperty('--vynoox-text', themeSettings.textColor);
    root.style.setProperty('--vynoox-radius', themeSettings.borderRadius);
    root.style.setProperty('--font-display', `'${themeSettings.headingFont}', Georgia, serif`);
    root.style.setProperty('--font-sans', `'${themeSettings.bodyFont}', sans-serif`);
    if (themeSettings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeSettings]);

  // Update document title dynamically for SEO
  useEffect(() => {
    if (currentPage === 'product-details' && selectedProductSlug) {
      const prod = products.find((p) => p.slug === selectedProductSlug);
      if (prod) {
        document.title = prod.seoTitle || `${prod.name} | ${generalSettings.storeName}`;
        return;
      }
    }
    const cmsPage = pages.find((p) => p.slug === currentPage);
    if (cmsPage) {
      document.title = cmsPage.seoTitle || `${cmsPage.title} | ${generalSettings.storeName}`;
      return;
    }
    document.title = marketingSettings.defaultSeoTitle || `${generalSettings.storeName} — Official Store`;
  }, [currentPage, selectedProductSlug, products, pages, generalSettings, marketingSettings]);

  const navigateTo = (
    page: StorePageId,
    options?: {
      productSlug?: string;
      collectionSlug?: string;
      categorySlug?: string;
      adminSection?: AdminSectionId;
    }
  ) => {
    if (options?.productSlug !== undefined) setSelectedProductSlug(options.productSlug);
    if (options?.collectionSlug !== undefined) setSelectedCollectionSlug(options.collectionSlug);
    if (options?.categorySlug !== undefined) setSelectedCategorySlug(options.categorySlug);
    if (options?.adminSection !== undefined) setAdminSection(options.adminSection);
    setCurrentPage(page);
    setIsCartDrawerOpen(false);
    if (typeof window !== 'undefined') {
      const nextUrl = page === 'admin' ? '/admin' : '/';
      if (window.location.pathname !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cart Calculations
  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon || !appliedCoupon.active) return 0;
    if (cartSubtotal < appliedCoupon.minPurchase) return 0;
    if (appliedCoupon.type === 'percentage') {
      return Math.round((cartSubtotal * appliedCoupon.value) / 100);
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(cartSubtotal, appliedCoupon.value);
    }
    return 0;
  }, [cartSubtotal, appliedCoupon]);

  const cartShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedCoupon?.type === 'free_shipping' && cartSubtotal >= appliedCoupon.minPurchase) {
      return 0;
    }
    if (cartSubtotal - cartDiscount >= shippingSettings.freeShippingThreshold) {
      return 0;
    }
    return shippingSettings.standardShippingCharge;
  }, [cart, cartSubtotal, cartDiscount, appliedCoupon, shippingSettings]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

  const addToCart = (newItem: CartItem, openDrawer = true) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.size === newItem.size &&
          i.color === newItem.color
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });
    notify('Added to Shopping Bag', `${newItem.name} (${newItem.size} · ${newItem.color})`, 'success');
    if (openDrawer) setIsCartDrawerOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.size === size && i.color === color)
      )
    );
  };

  const updateCartQuantity = (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size && i.color === color
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCouponCode = (rawCode: string): { success: boolean; message: string } => {
    const code = rawCode.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === code && c.active);
    if (!found) {
      return { success: false, message: 'Invalid or inactive coupon code.' };
    }
    if (found.usedCount >= found.usageLimit) {
      return { success: false, message: 'This coupon has reached its maximum usage limit.' };
    }
    if (cartSubtotal < found.minPurchase) {
      return {
        success: false,
        message: `Minimum order value of ${generalSettings.currencySymbol}${found.minPurchase} required for ${found.code}.`,
      };
    }
    setAppliedCoupon(found);
    notify('Privilege Applied', `Coupon ${found.code} applied to your bag.`, 'success');
    return { success: true, message: `Coupon ${found.code} applied!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const currentCustomerProfile = useMemo(() => {
    if (!currentUser) return null;
    const existing = customers.find((c) => c.uid === currentUser.uid);
    if (existing) return existing;
    return {
      uid: currentUser.uid,
      fullName: currentUser.displayName || 'Valued Client',
      email: currentUser.email || '',
      phone: '',
      defaultAddress: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
      wishlistIdsCsv: wishlistIds.join(','),
      internalNotes: '',
      totalSpent: 0,
      ordersCount: 0,
    };
  }, [currentUser, customers, wishlistIds]);

  const toggleWishlist = async (productId: string) => {
    const next = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    setWishlistIds(next);
    const prod = products.find((p) => p.id === productId);
    notify(
      wishlistIds.includes(productId) ? 'Removed from Wishlist' : 'Saved to Wishlist',
      prod ? prod.name : 'Garment updated',
      'info'
    );
    if (currentUser && currentCustomerProfile) {
      await saveCustomerProfileToDb({
        ...currentCustomerProfile,
        wishlistIdsCsv: next.join(','),
      }).catch(() => {});
    }
  };

  const loginAdminWithCredentials = async (
    username: string,
    password: string
  ): Promise<{ ok: boolean; error?: string; needsInitialSetup?: boolean }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        if (data.needsInitialSetup) {
          setAdminSystemInitialized(false);
        }
        return {
          ok: false,
          error: data.error || 'Invalid username or password.',
          needsInitialSetup: Boolean(data.needsInitialSetup),
        };
      }
      if (data.sessionToken && typeof window !== 'undefined') {
        window.sessionStorage.setItem('vynoox_admin_token', data.sessionToken);
        setAdminSessionToken(data.sessionToken);
      }
      setAdminSession(data.admin as AdminSessionInfo);
      setAdminSystemInitialized(true);
      notify(
        'Admin Session Authenticated',
        `Welcome back, ${data.admin.username} (${data.admin.role}).`,
        'success'
      );
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach authentication server. Please try again.',
      };
    }
  };

  const setupInitialSuperAdmin = async (
    username: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/setup-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        return {
          ok: false,
          error: data.error || 'Unable to complete initial Super Admin setup.',
        };
      }
      if (data.sessionToken && typeof window !== 'undefined') {
        window.sessionStorage.setItem('vynoox_admin_token', data.sessionToken);
        setAdminSessionToken(data.sessionToken);
      }
      setAdminSession(data.admin as AdminSessionInfo);
      setAdminSystemInitialized(true);
      notify(
        'Super Admin Initialized',
        `Super Admin account '${data.admin.username}' has been securely configured.`,
        'success'
      );
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Network error while initializing Super Admin account.',
      };
    }
  };

  const logoutAdminSession = async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminSessionToken) {
        headers.Authorization = `Bearer ${adminSessionToken}`;
      }
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
      });
    } catch {
      // Proceed with client session purge even if network fails
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('vynoox_admin_token');
    }
    setAdminSessionToken(null);
    setAdminSession(null);
    setCurrentPage('admin');
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    notify('Admin Logged Out', 'Your administrator session has been terminated.', 'info');
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithGooglePopup();
    if (cred.user) {
      const existing = customers.find((c) => c.uid === cred.user.uid);
      if (!existing) {
        const newProfile: CustomerProfile = {
          uid: cred.user.uid,
          fullName: cred.user.displayName || 'VYNOOX Client',
          email: cred.user.email || '',
          phone: '',
          defaultAddress: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
          wishlistIdsCsv: wishlistIds.join(','),
          internalNotes: 'Registered via Google Auth',
          totalSpent: 0,
          ordersCount: 0,
        };
        await saveCustomerProfileToDb(newProfile).catch(() => {});
      }
      notify('Welcome to VYNOOX', `Signed in as ${cred.user.email}`, 'success');
    }
  };

  const logout = async () => {
    await signOutUser();
    notify('Signed Out', 'Your session has been securely closed.', 'info');
  };

  // Wrapper Mutations updating both local state & Cloud Firestore
  const saveProduct = async (product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = product;
        return copy;
      }
      return [product, ...prev];
    });
    if (isAdminUser) {
      await saveProductToDb(product);
    }
    notify('Product Saved', `${product.name} updated on live storefront.`, 'success');
  };

  const deleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (isAdminUser) {
      await deleteProductFromDb(productId);
    }
    notify('Product Removed', 'Product removed from catalog.', 'info');
  };

  const saveCollection = async (col: CollectionItem) => {
    setCollections((prev) => {
      const idx = prev.findIndex((c) => c.id === col.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = col;
        return copy.sort((a, b) => a.sortOrder - b.sortOrder);
      }
      return [...prev, col].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    if (isAdminUser) {
      await saveCollectionToDb(col);
    }
    notify('Collection Saved', `${col.name} updated.`, 'success');
  };

  const deleteCollection = async (colId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== colId));
    if (isAdminUser) {
      await deleteCollectionFromDb(colId);
    }
    notify('Collection Deleted', 'Collection removed.', 'info');
  };

  const saveCategory = async (cat: CategoryItem) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      }
      return [...prev, cat];
    });
    if (isAdminUser) {
      await saveCategoryToDb(cat);
    }
    notify('Category Saved', `${cat.name} updated.`, 'success');
  };

  const deleteCategory = async (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (isAdminUser) {
      await deleteCategoryFromDb(catId);
    }
    notify('Category Deleted', 'Category removed.', 'info');
  };

  const placeOrder = async (order: OrderItem): Promise<OrderItem> => {
    setOrders((prev) => [order, ...prev]);
    if (currentUser) {
      await createOrderInDb(order);
      if (currentCustomerProfile) {
        const updatedProfile: CustomerProfile = {
          ...currentCustomerProfile,
          fullName: order.customerName || currentCustomerProfile.fullName,
          phone: order.customerPhone || currentCustomerProfile.phone,
          defaultAddress: order.shippingAddress || currentCustomerProfile.defaultAddress,
          city: order.city || currentCustomerProfile.city,
          state: order.state || currentCustomerProfile.state,
          pinCode: order.pinCode || currentCustomerProfile.pinCode,
          country: order.country || currentCustomerProfile.country,
          totalSpent: currentCustomerProfile.totalSpent + order.totalAmount,
          ordersCount: currentCustomerProfile.ordersCount + 1,
        };
        await saveCustomerProfileToDb(updatedProfile).catch(() => {});
      }
    }
    // Decrement product stock quantities
    try {
      const items: CartItem[] = JSON.parse(order.itemsSummary);
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.trackInventory) {
          const nextStock = Math.max(0, prod.stockQuantity - item.quantity);
          setProducts((prev) =>
            prev.map((p) => (p.id === prod.id ? { ...p, stockQuantity: nextStock } : p))
          );
          if (currentUser) {
            await saveProductToDb({ ...prod, stockQuantity: nextStock }).catch(() => {});
          }
        }
      }
    } catch {
      // Non-blocking stock decrement
    }
    clearCart();
    notify('Order Confirmed', `Order #${order.orderNumber} has been placed.`, 'success');
    return order;
  };

  const updateOrder = async (
    order: OrderItem,
    updates: Partial<{
      status: OrderStatus;
      paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
      trackingNumber: string;
      carrier: string;
      internalNotes: string;
    }>
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, ...updates } : o))
    );
    if (currentUser) {
      await updateOrderInDb(order, updates);
    }
    notify('Order Updated', `Order #${order.orderNumber} updated.`, 'success');
  };

  const saveCustomerProfile = async (profile: CustomerProfile) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.uid === profile.uid);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = profile;
        return copy;
      }
      return [...prev, profile];
    });
    if (currentUser) {
      await saveCustomerProfileToDb(profile);
    }
    notify('Profile Saved', 'Customer record updated.', 'success');
  };

  const saveCoupon = async (coupon: CouponItem) => {
    setCoupons((prev) => {
      const idx = prev.findIndex((c) => c.id === coupon.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = coupon;
        return copy;
      }
      return [coupon, ...prev];
    });
    if (isAdminUser) {
      await saveCouponToDb(coupon);
    }
    notify('Coupon Saved', `Coupon ${coupon.code} is active.`, 'success');
  };

  const deleteCoupon = async (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    if (isAdminUser) {
      await deleteCouponFromDb(couponId);
    }
    notify('Coupon Deleted', 'Discount code removed.', 'info');
  };

  const submitReview = async (review: ReviewItem) => {
    setReviews((prev) => [review, ...prev]);
    if (currentUser) {
      await createReviewInDb(review);
    }
    notify('Review Submitted', 'Thank you for sharing your review with VYNOOX.', 'success');
  };

  const moderateReview = async (
    review: ReviewItem,
    status: 'approved' | 'pending' | 'rejected',
    verifiedPurchase: boolean
  ) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, status, verifiedPurchase } : r))
    );
    if (isAdminUser) {
      await updateReviewStatusInDb(review, status, verifiedPurchase);
    }
    notify('Review Moderated', `Review marked as ${status}.`, 'success');
  };

  const deleteReview = async (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (isAdminUser) {
      await deleteReviewFromDb(reviewId);
    }
    notify('Review Deleted', 'Review removed.', 'info');
  };

  const savePage = async (page: CMSPage) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === page.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = page;
        return copy;
      }
      return [...prev, page];
    });
    if (isAdminUser) {
      await savePageToDb(page);
    }
    notify('Page Published', `${page.title} updated on live storefront.`, 'success');
  };

  const deletePage = async (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    if (isAdminUser) {
      await deletePageFromDb(pageId);
    }
    notify('Page Deleted', 'CMS page removed.', 'info');
  };

  const updateHomepageSections = async (sections: HomepageSection[], persist = true) => {
    setHomepageSections(sections);
    if (persist && isAdminUser) {
      await saveStoreConfigToDb('homepage_sections', sections);
      notify('Homepage Published', 'Homepage layout and sections saved to database.', 'success');
    }
  };

  const updateHeroConfig = async (config: HeroConfig, persist = true) => {
    const isBadVideoUrl = (u?: string) =>
      !u ||
      !u.trim() ||
      u.startsWith('data:image/svg+xml') ||
      u.includes('assets.mixkit.co');
    const sanitized: HeroConfig = {
      ...config,
      slides: (config.slides || []).map((s) => ({
        ...s,
        desktopVideoUrl: isBadVideoUrl(s.desktopVideoUrl) ? '' : s.desktopVideoUrl,
        mobileVideoUrl: isBadVideoUrl(s.mobileVideoUrl) ? '' : s.mobileVideoUrl,
      })),
    };
    setHeroConfig(sanitized);
    if (persist) {
      if (isAdminUser) {
        await saveStoreConfigToDb('hero_config', sanitized);
      }
      notify(
        'Hero Section Published',
        'Full-screen hero slides and display settings published to live storefront.',
        'success'
      );
    }
  };

  const saveHeroDraft = async (config: HeroConfig) => {
    setHeroDraftConfig(config);
    if (isAdminUser) {
      await saveStoreConfigToDb('hero_config_draft', config);
    }
    notify('Hero Draft Saved', 'Your hero section draft has been saved without publishing.', 'info');
  };

  const updateNewArrivalsConfig = async (
    config: NewArrivalsShowcaseConfig,
    persist = true
  ) => {
    setNewArrivalsConfig(config);
    if (persist) {
      if (isAdminUser) {
        await saveStoreConfigToDb('new_arrivals_showcase', config);
      }
      notify(
        'New Arrivals Showcase Published',
        'Product showcase configuration updated on the live homepage.',
        'success'
      );
    }
  };

  const updateUgcConfig = async (config: UgcSectionConfig, persist = true) => {
    setUgcConfig(config);
    if (persist) {
      if (isAdminUser) {
        await saveStoreConfigToDb('ugc_video_showcase', config);
      }
      notify(
        'VYNOOX Community UGC Published',
        'Vertical UGC video gallery settings and videos saved.',
        'success'
      );
    }
  };

  const updateMediaLibrary = async (items: MediaLibraryItem[], persist = true) => {
    const previousItems = mediaLibrary;
    // Deduplicate by id to prevent duplicate media records
    const seenIds = new Set<string>();
    const deduplicated: MediaLibraryItem[] = [];
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduplicated.push(item);
      }
    }

    setMediaLibrary(deduplicated);

    if (persist && isAdminUser) {
      await saveStoreConfigToDb('media_library', deduplicated);

      // Sync added/updated records to structured /media_library/{mediaId} collection
      const currentIds = new Set(deduplicated.map((m) => m.id));
      const prevById = new Map(previousItems.map((m) => [m.id, m]));

      for (const item of deduplicated) {
        const prev = prevById.get(item.id);
        if (
          !prev ||
          prev.url !== item.url ||
          prev.fileName !== item.fileName ||
          prev.deviceTarget !== item.deviceTarget ||
          prev.title !== item.title
        ) {
          await saveMediaItemToDb(item);
        }
      }

      // Remove deleted records from /media_library/{mediaId} and binary storage
      for (const prev of previousItems) {
        if (!currentIds.has(prev.id)) {
          await deleteMediaItemFromDb(prev.id, prev.storagePath).catch(() => {});
        }
      }
    }
  };

  const updateThemeSettings = async (theme: ThemeSettings, persist = true) => {
    setThemeSettings(theme);
    if (persist && isAdminUser) {
      await saveStoreConfigToDb('theme_settings', theme);
      notify('Theme Published', 'Live storefront theme settings saved to database.', 'success');
    }
  };

  const updateGeneralSettings = async (settings: StoreGeneralSettings) => {
    setGeneralSettings(settings);
    if (isAdminUser) {
      await saveStoreConfigToDb('general_settings', settings);
    }
    notify('General Settings Saved', 'Store details updated.', 'success');
  };

  const updateShippingSettings = async (settings: ShippingSettings) => {
    setShippingSettings(settings);
    if (isAdminUser) {
      await saveStoreConfigToDb('shipping_settings', settings);
    }
    notify('Shipping Settings Saved', 'Logistics and PIN rules updated.', 'success');
  };

  const updatePaymentSettings = async (settings: PaymentSettings) => {
    setPaymentSettings(settings);
    if (isAdminUser) {
      await saveStoreConfigToDb('payment_settings', settings);
    }
    notify('Payment Settings Saved', 'Payment gateway rules updated.', 'success');
  };

  const updateMarketingSettings = async (settings: MarketingSettings) => {
    setMarketingSettings(settings);
    if (isAdminUser) {
      await saveStoreConfigToDb('marketing_settings', settings);
    }
    notify('Marketing & SEO Saved', 'Tracking and metadata updated.', 'success');
  };

  const updateNavigationLinks = async (links: NavigationLink[]) => {
    setNavigationLinks(links);
    if (isAdminUser) {
      await saveStoreConfigToDb('navigation_links', links);
    }
    notify('Navigation Updated', 'Storefront menus saved.', 'success');
  };

  const saveStaffMember = async (staff: AdminUser) => {
    setStaffMembers((prev) => {
      const idx = prev.findIndex((s) => s.uid === staff.uid);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = staff;
        return copy;
      }
      return [...prev, staff];
    });
    if (isAdminUser) {
      await saveAdminUserToDb(staff);
    }
    notify('Staff Member Saved', `${staff.name} (${staff.role}) updated.`, 'success');
  };

  const removeStaffMember = async (uid: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.uid !== uid));
    if (isAdminUser) {
      await deleteAdminUserFromDb(uid);
    }
    notify('Staff Member Removed', 'Access revoked.', 'info');
  };

  const seedInitialDatabase = async () => {
    if (!isAdminUser) {
      notify('Admin Sign-In Required', 'Please sign in with your admin account to seed Cloud Firestore.', 'error');
      return;
    }
    setIsSeeding(true);
    try {
      const productsToSync = products.length > 0 ? products : INITIAL_PRODUCTS;
      const collectionsToSync = collections.length > 0 ? collections : INITIAL_COLLECTIONS;
      const categoriesToSync = categories.length > 0 ? categories : INITIAL_CATEGORIES;
      const couponsToSync = coupons.length > 0 ? coupons : INITIAL_COUPONS;
      const pagesToSync = pages.length > 0 ? pages : INITIAL_CMS_PAGES;

      for (const prod of productsToSync) {
        await saveProductToDb(prod);
      }
      for (const col of collectionsToSync) {
        await saveCollectionToDb(col);
      }
      for (const cat of categoriesToSync) {
        await saveCategoryToDb(cat);
      }
      for (const coup of couponsToSync) {
        await saveCouponToDb(coup);
      }
      for (const page of pagesToSync) {
        await savePageToDb(page);
      }

      const isBadVideoUrl = (u?: string) =>
        !u ||
        !u.trim() ||
        u.startsWith('data:image/svg+xml') ||
        u.includes('assets.mixkit.co');
      const sanitizedHeroToSync: HeroConfig = {
        ...heroConfig,
        slides: (heroConfig.slides || []).map((s) => ({
          ...s,
          desktopVideoUrl: isBadVideoUrl(s.desktopVideoUrl) ? '' : s.desktopVideoUrl,
          mobileVideoUrl: isBadVideoUrl(s.mobileVideoUrl) ? '' : s.mobileVideoUrl,
        })),
      };

      await saveStoreConfigToDb('homepage_sections', homepageSections);
      await saveStoreConfigToDb('hero_config', sanitizedHeroToSync);
      await saveStoreConfigToDb('new_arrivals_showcase', newArrivalsConfig);
      await saveStoreConfigToDb('ugc_video_showcase', ugcConfig);
      await saveStoreConfigToDb('media_library', mediaLibrary);
      for (const item of mediaLibrary) {
        await saveMediaItemToDb(item);
      }
      await saveStoreConfigToDb('theme_settings', themeSettings);
      await saveStoreConfigToDb('general_settings', generalSettings);
      await saveStoreConfigToDb('shipping_settings', shippingSettings);
      await saveStoreConfigToDb('payment_settings', paymentSettings);
      await saveStoreConfigToDb('marketing_settings', marketingSettings);
      await saveStoreConfigToDb('navigation_links', navigationLinks);
      notify(
        'Database Synchronized',
        'All VYNOOX products, collections, pages, hero media, and UGC configs persisted to Cloud Firestore.',
        'success'
      );
    } catch (err) {
      notify(
        'Database Sync Error',
        err instanceof Error ? err.message : 'Failed to sync catalog',
        'error'
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        authLoading,
        isAdminUser,
        currentAdminRole,
        adminSession,
        adminAuthChecking,
        adminSystemInitialized,
        adminSessionToken,
        loginAdminWithCredentials,
        setupInitialSuperAdmin,
        logoutAdminSession,
        refreshAdminSession,
        loginWithGoogle,
        logout,
        currentPage,
        adminSection,
        selectedProductSlug,
        selectedCollectionSlug,
        selectedCategorySlug,
        searchQuery,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        setSearchQuery,
        navigateTo,
        setAdminSection,
        products,
        collections,
        categories,
        coupons,
        reviews,
        pages,
        orders,
        customers,
        currentCustomerProfile,
        staffMembers,
        activityLogs,
        homepageSections,
        heroConfig,
        heroDraftConfig,
        newArrivalsConfig,
        ugcConfig,
        mediaLibrary,
        themeSettings,
        generalSettings,
        shippingSettings,
        paymentSettings,
        marketingSettings,
        navigationLinks,
        cart,
        wishlistIds,
        appliedCoupon,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon,
        toggleWishlist,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTotal,
        saveProduct,
        deleteProduct,
        saveCollection,
        deleteCollection,
        saveCategory,
        deleteCategory,
        placeOrder,
        updateOrder,
        saveCustomerProfile,
        saveCoupon,
        deleteCoupon,
        submitReview,
        moderateReview,
        deleteReview,
        savePage,
        deletePage,
        updateHomepageSections,
        updateHeroConfig,
        saveHeroDraft,
        updateNewArrivalsConfig,
        updateUgcConfig,
        updateMediaLibrary,
        updateThemeSettings,
        updateGeneralSettings,
        updateShippingSettings,
        updatePaymentSettings,
        updateMarketingSettings,
        updateNavigationLinks,
        saveStaffMember,
        removeStaffMember,
        seedInitialDatabase,
        isSeeding,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
