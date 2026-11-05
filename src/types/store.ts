export type StorePageId =
  | 'home'
  | 'shop-all'
  | 'new-arrivals'
  | 'best-sellers'
  | 'collections'
  | 'product-details'
  | 'cart'
  | 'checkout'
  | 'login'
  | 'register'
  | 'account'
  | 'orders'
  | 'wishlist'
  | 'about-us'
  | 'contact-us'
  | 'faq'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'shipping-policy'
  | 'return-and-refund-policy'
  | 'admin';

export type AdminSectionId =
  | 'overview'
  | 'hero-studio'
  | 'media-manager'
  | 'ugc-videos'
  | 'products'
  | 'collections'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'homepage-builder'
  | 'theme-customizer'
  | 'navigation-manager'
  | 'pages-manager'
  | 'reviews'
  | 'marketing'
  | 'analytics'
  | 'shipping-settings'
  | 'payment-settings'
  | 'general-settings'
  | 'staff-management'
  | 'security'
  | 'activity-logs';

export type AdminRole =
  | 'Super Admin'
  | 'Admin'
  | 'Product Manager'
  | 'Order Manager'
  | 'Content Manager';

export interface VariantStockMap {
  [variantKey: string]: number; // e.g., "L / Washed Charcoal": 25
}

export interface Product {
  id: string;
  storeId: 'vynoox';
  name: string;
  slug: string;
  description: string;
  regularPrice: number;
  salePrice: number;
  compareAtPrice: number;
  sku: string;
  barcode: string;
  category: string;
  collection: string;
  status: 'published' | 'draft' | 'archived';
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  primaryImage: string;
  secondaryImage: string;
  additionalImages?: string[];
  videoUrl: string;
  sizesCsv: string;
  colorsCsv: string;
  materialsCsv: string;
  stylesCsv: string;
  tagsCsv: string;
  variantInventoryJson: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt?: unknown;
}

export interface CollectionItem {
  id: string;
  storeId: 'vynoox';
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface CategoryItem {
  id: string;
  storeId: 'vynoox';
  name: string;
  slug: string;
  description: string;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  regularPrice: number;
  image: string;
  size: string;
  color: string;
  material: string;
  style: string;
  quantity: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export interface OrderItem {
  id: string;
  storeId: 'vynoox';
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  itemsSummary: string; // JSON serialized CartItem[]
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  couponCode: string;
  paymentMethod: 'razorpay' | 'cod' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference: string;
  status: OrderStatus;
  trackingNumber: string;
  carrier: string;
  internalNotes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomerProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  defaultAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  wishlistIdsCsv: string;
  internalNotes: string;
  totalSpent: number;
  ordersCount: number;
  updatedAt?: unknown;
}

export interface CouponItem {
  id: string;
  storeId: 'vynoox';
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minPurchase: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  appliesTo: string; // 'all' | 'collection:<slug>' | 'product:<id>'
  active: boolean;
  updatedAt?: unknown;
}

export interface ReviewItem {
  id: string;
  storeId: 'vynoox';
  productId: string;
  productName: string;
  authorUid: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  reviewImage: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt?: unknown;
}

export interface CMSPage {
  id: string;
  storeId: 'vynoox';
  title: string;
  slug: string;
  subtitle: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  updatedAt?: unknown;
}

export type HomepageSectionType =
  | 'announcement_bar'
  | 'header'
  | 'hero_banner'
  | 'featured_collections'
  | 'new_arrivals'
  | 'ugc_video_showcase'
  | 'best_sellers'
  | 'promotional_banner'
  | 'brand_story'
  | 'featured_products'
  | 'customer_testimonials'
  | 'newsletter'
  | 'social_media_gallery'
  | 'footer';

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  name: string;
  visible: boolean;
  order: number;
  heading: string;
  subheading: string;
  description: string;
  buttonText: string;
  buttonLink: StorePageId;
  secondaryButtonText?: string;
  secondaryButtonLink?: StorePageId;
  backgroundImage: string;
  videoUrl: string;
  backgroundColor: string;
  textColor: string;
  layout: 'split' | 'centered' | 'grid-3' | 'grid-4' | 'editorial';
  spacingY: 'compact' | 'normal' | 'spacious';
}

export type HeroTextPosition =
  | 'top-left'
  | 'top-center'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type HeroHeightPreset = '100vh' | '85vh' | '70vh' | 'custom';

export type HeroButtonStyle = 'solid-light' | 'solid-dark' | 'outline-light' | 'glass-minimal';

export interface HeroSlide {
  id: string;
  enabled: boolean;
  order: number;
  mediaMode: 'image' | 'video';
  desktopImageUrl: string;
  mobileImageUrl: string;
  desktopVideoUrl: string;
  mobileVideoUrl: string;
  fallbackImageUrl: string;
  focalPoint: string; // e.g., 'center center', '50% 35%', 'top center'
  videoScale: 'cover' | 'contain';
  overlayColor: string;
  overlayOpacity: number; // 0 to 90
  brandLabel: string;
  heading: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: StorePageId;
  primaryButtonStyle: HeroButtonStyle;
  secondaryButtonText: string;
  secondaryButtonLink: StorePageId;
  secondaryButtonStyle: HeroButtonStyle;
  fontFamily: 'Cormorant Garamond' | 'Outfit' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | 'display';
  fontWeight: '300' | '400' | '500' | '600' | '700';
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  textPosition: HeroTextPosition;
  textSpacing: 'compact' | 'normal' | 'relaxed' | 'expansive';
  durationSeconds: number;
}

export interface HeroConfig {
  heightPreset: HeroHeightPreset;
  desktopHeight: string; // e.g., '92vh' or '840px'
  tabletHeight: string; // e.g., '82vh'
  mobileHeight: string; // e.g., '78vh'
  contentMaxWidth: string; // e.g., '780px'
  autoSlideshow: boolean;
  defaultSlideDurationSeconds: number;
  showManualNav: boolean;
  enableTextAnimations: boolean;
  slides: HeroSlide[];
}

export interface MediaLibraryItem {
  id: string;
  title: string;
  fileName: string;
  fileType?: string; // e.g., 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'
  mediaType: 'image' | 'video';
  mediaCategory?: 'hero_desktop' | 'hero_mobile' | 'ugc_video' | 'product_media' | 'general';
  deviceTarget: 'desktop' | 'mobile' | 'universal';
  url: string;
  downloadUrl?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  fileSizeBytes: number;
  dimensions: string; // e.g., '1920x1080' or '1080x1920'
  durationSeconds?: number;
  uploadedAt: string;
}

export interface NewArrivalsShowcaseConfig {
  visible: boolean;
  heading: string;
  subtitle: string;
  maxProducts: number;
  gridColumns: 2 | 3 | 4;
  productOrder: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'manual';
  selectedProductIds: string[]; // empty means auto-select new arrivals / published products
  backgroundColor: string;
  textColor: string;
  sectionSpacing: 'compact' | 'normal' | 'spacious';
  viewAllButtonText: string;
  viewAllButtonLink: StorePageId;
}

export interface UgcVideoItem {
  id: string;
  enabled: boolean;
  featured: boolean;
  order: number;
  customerHandle: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  productId?: string;
  productTagLabel?: string;
  productSlug?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
}

export interface UgcSectionConfig {
  visible: boolean;
  heading: string;
  subtitle: string;
  maxVisibleVideos: number;
  cardWidth: 'compact' | 'standard' | 'wide';
  aspectRatio: '9:16' | '4:5' | '1:1';
  backgroundColor: string;
  textColor: string;
  hoverAutoplay: boolean;
  mutedByDefault: boolean;
  loopVideos: boolean;
  videos: UgcVideoItem[];
}

export interface ThemeSettings {
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: 'Cormorant Garamond' | 'Outfit' | 'Plus Jakarta Sans';
  bodyFont: 'Plus Jakarta Sans' | 'Outfit';
  baseFontSize: '14px' | '15px' | '16px';
  buttonStyle: 'sharp' | 'rounded' | 'outline';
  borderRadius: '0px' | '2px' | '6px' | '12px';
  headerDesign: 'minimal-3-zone' | 'centered-luxury' | 'architectural-border';
  footerDesign: 'editorial-4-col' | 'minimal-2-col';
  productCardDesign: 'minimal-editorial' | 'bordered-atelier' | 'quick-add-overlay';
  productPageLayout: 'sticky-split' | 'gallery-grid';
  collectionPageLayout: 'sidebar-filters' | 'top-toolbar';
  pageWidth: '1280px' | '1440px' | '1600px';
  sectionSpacing: 'compact' | 'standard' | 'expansive';
  darkMode: boolean;
}

export interface StoreGeneralSettings {
  storeName: string;
  storeLogo: string;
  storeEmail: string;
  contactNumber: string;
  businessAddress: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  currencySymbol: '₹' | '$' | '€' | '£';
  country: string;
  timeZone: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  faviconUrl: string;
  maintenanceMode: boolean;
  announcementBarText: string;
  footerCopyright: string;
  footerTagline: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  statesCsv: string;
  rate: number;
  estimatedDays: string;
}

export interface ShippingSettings {
  standardShippingCharge: number;
  expressShippingCharge: number;
  freeShippingThreshold: number;
  serviceablePinCodesCsv: string; // empty or '*' means all serviceable
  estimatedDeliveryText: string;
  defaultCarrier: string;
  zones: ShippingZone[];
}

export interface PaymentSettings {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  codEnabled: boolean;
  codMaxOrderAmount: number;
  codExtraFee: number;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  requireBackendSignatureVerification: boolean;
}

export interface MarketingSettings {
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  socialShareImageUrl: string;
  googleAnalyticsId: string;
  metaPixelId: string;
  newsletterHeading: string;
  newsletterSubtext: string;
  abandonedCartRecoveryEnabled: boolean;
  abandonedCartDiscountCode: string;
  promoBannerEnabled: boolean;
  promoBannerText: string;
}

export interface NavigationLink {
  id: string;
  label: string;
  targetPage: StorePageId;
  location: 'header' | 'footer_shop' | 'footer_policies';
  order: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  updatedAt?: unknown;
}

export interface ActivityLogItem {
  id: string;
  storeId: 'vynoox';
  actorUid: string;
  actorEmail: string;
  action: string;
  details: string;
  createdAt?: unknown;
}

