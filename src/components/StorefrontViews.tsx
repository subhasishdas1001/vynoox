import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Lock,
  Minus,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CartItem, OrderItem, Product, ReviewItem, StorePageId } from '../types/store';
import {
  FullScreenCinematicHero,
  NewArrivalsShowcaseSection,
  VynooxCommunityUgcSection,
} from './HeroAndUgcSystem';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const {
    navigateTo,
    addToCart,
    wishlistIds,
    toggleWishlist,
    generalSettings,
    themeSettings,
  } = useStore();
  const [hovered, setHovered] = useState(false);
  const sizes = useMemo(
    () =>
      product.sizesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [product.sizesCsv]
  );
  const colors = useMemo(
    () =>
      product.colorsCsv
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    [product.colorsCsv]
  );

  const isWishlisted = wishlistIds.includes(product.id);
  const discountPct =
    product.compareAtPrice > product.salePrice
      ? Math.round(
          ((product.compareAtPrice - product.salePrice) / product.compareAtPrice) * 100
        )
      : 0;

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.salePrice,
      regularPrice: product.regularPrice,
      image: product.primaryImage,
      size,
      color: colors[0] || 'Default',
      material: product.materialsCsv.split(',')[0] || '280 GSM Heavyweight Cotton',
      style: product.stylesCsv.split(',')[0] || 'Oversized Fit',
      quantity: 1,
    });
  };

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigateTo('product-details', { productSlug: product.slug })}
      className={`group cursor-pointer flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${
        themeSettings.productCardDesign === 'bordered-atelier'
          ? 'border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900'
          : ''
      }`}
    >
      <div>
        {/* Product Image Container (70% visual weight, 4:3 uniform aspect ratio) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F1EC] dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
          <img
            src={hovered && product.secondaryImage ? product.secondaryImage : product.primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Subtle single text kicker top-left */}
          <div className="absolute top-3 left-3 text-[11px] font-mono tracking-widest uppercase text-neutral-700 dark:text-neutral-300 bg-[#FAF9F6]/90 dark:bg-neutral-950/90 px-2.5 py-1">
            {product.stockQuantity <= 0
              ? 'Sold Out'
              : product.newArrival
              ? 'New Release'
              : discountPct > 0
              ? `-${discountPct}% Archive`
              : 'In Stock'}
          </div>

          {/* Wishlist Affordance */}
          <button
            type="button"
            aria-label="Save to Wishlist"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center bg-[#FAF9F6]/90 dark:bg-neutral-950/90 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Add Size Bar on Hover */}
          {product.stockQuantity > 0 && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-[#111111]/95 text-[#FAF9F6] px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 whitespace-nowrap shrink-0">
                Quick Add
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {sizes.slice(0, 5).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => handleQuickAdd(e, sz)}
                    className="px-2 py-1 text-[11px] font-mono hover:bg-white hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clean Unboxed Metadata */}
        <div className="pt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="uppercase tracking-wider">{product.collection}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.sku}</span>
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:underline">
            {product.name}
          </h3>
        </div>
      </div>

      {/* Price Baseline Aligned */}
      <div className="pt-3 flex items-baseline justify-between border-t border-neutral-200/60 dark:border-neutral-800 mt-3">
        <div className="flex items-baseline gap-2.5 font-mono tabular-nums">
          <span className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {generalSettings.currencySymbol}
            {product.salePrice.toLocaleString('en-IN')}
          </span>
          {product.compareAtPrice > product.salePrice && (
            <span className="text-xs text-neutral-400 line-through">
              {generalSettings.currencySymbol}
              {product.compareAtPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {colors.length} {colors.length === 1 ? 'Tone' : 'Tones'}
        </span>
      </div>
    </article>
  );
};

export const StorefrontLayout: React.FC = () => {
  const {
    currentPage,
    navigateTo,
    products,
    collections,
    categories,
    reviews,
    pages,
    orders,
    homepageSections,
    generalSettings,
    shippingSettings,
    paymentSettings,
    navigationLinks,
    cart,
    wishlistIds,
    appliedCoupon,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    applyCouponCode,
    removeCoupon,
    toggleWishlist,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    selectedProductSlug,
    selectedCollectionSlug,
    selectedCategorySlug,
    searchQuery,
    setSearchQuery,
    currentUser,
    isAdminUser,
    loginWithGoogle,
    logout,
    placeOrder,
    updateOrder,
    currentCustomerProfile,
    saveCustomerProfile,
    submitReview,
    notify,
  } = useStore();

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  // Catalog Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeCollection, setActiveCollection] = useState<string>('all');
  const [activeSize, setActiveSize] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>(
    'featured'
  );

  // Product Detail State
  const activeProduct = useMemo(
    () =>
      products.find((p) => p.slug === selectedProductSlug) ||
      products.find((p) => p.status === 'published') ||
      products[0],
    [products, selectedProductSlug]
  );
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedColor, setSelectedColor] = useState<string>('Washed Charcoal');
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number>(0);
  const [pdpQuantity, setPdpQuantity] = useState<number>(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);

  // Review Form State
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Coupon & PIN Check State
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [pinCheckInput, setPinCheckInput] = useState('');
  const [pinCheckResult, setPinCheckResult] = useState<string | null>(null);

  // Checkout State
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: currentCustomerProfile?.fullName || '',
    email: currentCustomerProfile?.email || '',
    phone: currentCustomerProfile?.phone || '',
    address: currentCustomerProfile?.defaultAddress || '',
    city: currentCustomerProfile?.city || 'Mumbai',
    state: currentCustomerProfile?.state || 'Maharashtra',
    pinCode: currentCustomerProfile?.pinCode || '400013',
    country: currentCustomerProfile?.country || 'India',
    paymentMethod: 'razorpay' as 'razorpay' | 'cod',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderItem | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<OrderItem | null>(null);

  // Newsletter & Contact State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Sync PDP default variants when activeProduct changes
  React.useEffect(() => {
    if (activeProduct) {
      const sz = activeProduct.sizesCsv.split(',').map((s) => s.trim()).filter(Boolean);
      const cl = activeProduct.colorsCsv.split(',').map((c) => c.trim()).filter(Boolean);
      if (sz.length > 0) setSelectedSize(sz.includes('L') ? 'L' : sz[0]);
      if (cl.length > 0) setSelectedColor(cl[0]);
      setSelectedGalleryIdx(0);
      setPdpQuantity(1);
    }
  }, [activeProduct]);

  // Sync Checkout form when customer logs in
  React.useEffect(() => {
    if (currentCustomerProfile) {
      setCheckoutForm((prev) => ({
        ...prev,
        fullName: prev.fullName || currentCustomerProfile.fullName,
        email: prev.email || currentCustomerProfile.email,
        phone: prev.phone || currentCustomerProfile.phone,
        address: prev.address || currentCustomerProfile.defaultAddress,
        city: prev.city || currentCustomerProfile.city || 'Mumbai',
        state: prev.state || currentCustomerProfile.state || 'Maharashtra',
        pinCode: prev.pinCode || currentCustomerProfile.pinCode || '400013',
      }));
    }
  }, [currentCustomerProfile]);

  const headerNavLinks = useMemo(
    () =>
      navigationLinks
        .filter((l) => l.location === 'header')
        .sort((a, b) => a.order - b.order)
        .slice(0, 5),
    [navigationLinks]
  );

  const footerShopLinks = useMemo(
    () =>
      navigationLinks
        .filter((l) => l.location === 'footer_shop')
        .sort((a, b) => a.order - b.order),
    [navigationLinks]
  );

  const footerPolicyLinks = useMemo(
    () =>
      navigationLinks
        .filter((l) => l.location === 'footer_policies')
        .sort((a, b) => a.order - b.order),
    [navigationLinks]
  );

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const totalBagCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  const checkPinServiceability = async () => {
    const cleaned = pinCheckInput.trim();
    if (cleaned.length < 5) {
      setPinCheckResult('Please enter a valid 6-digit postal PIN code.');
      return;
    }
    try {
      const res = await fetch('/api/shipping/check-pincode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinCode: cleaned,
          serviceablePinCodesCsv: shippingSettings.serviceablePinCodesCsv,
          defaultCarrier: shippingSettings.defaultCarrier,
          estimatedDeliveryText: shippingSettings.estimatedDeliveryText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPinCheckResult(data.message);
        return;
      }
    } catch {
      // Fallback to local evaluation if offline
    }
    if (
      shippingSettings.serviceablePinCodesCsv === '*' ||
      shippingSettings.serviceablePinCodesCsv.trim() === '' ||
      shippingSettings.serviceablePinCodesCsv.includes(cleaned)
    ) {
      setPinCheckResult(
        `Deliverable to ${cleaned} via ${shippingSettings.defaultCarrier} (${shippingSettings.estimatedDeliveryText}).`
      );
    } else {
      setPinCheckResult(`PIN ${cleaned} is currently outside our standard express zone.`);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!currentUser) {
      notify(
        'Sign-In Required for Order Verification',
        'Please sign in with Google so your order is securely linked to your account.',
        'info'
      );
      await loginWithGoogle();
      return;
    }

    setIsProcessingPayment(true);
    try {
      let paymentStatus: 'pending' | 'paid' = 'pending';
      let paymentReference = `COD-${Date.now()}`;

      if (checkoutForm.paymentMethod === 'razorpay') {
        // Step 1: Create Server-Side Payment Intent
        const intentRes = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: cartTotal,
            currency: generalSettings.currency,
            gateway: 'razorpay',
          }),
        });
        if (!intentRes.ok) {
          throw new Error('Failed to initialize payment gateway intent.');
        }
        const intentData = await intentRes.json();

        // Step 2: Verify Cryptographic HMAC-SHA256 Signature on Backend
        const verifyRes = await fetch('/api/payment/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderIntentId: intentData.orderIntentId,
            paymentId: intentData.paymentId,
            amount: cartTotal,
            signature: intentData.signature,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.verified) {
          throw new Error('Backend payment signature verification failed.');
        }
        paymentStatus = 'paid';
        paymentReference = verifyData.paymentReference;
      }

      const newOrder: OrderItem = {
        id: `ord-${Date.now()}`,
        storeId: 'vynoox',
        orderNumber: `VYN-${Math.floor(100000 + Math.random() * 900000)}`,
        customerId: currentUser.uid,
        customerName: checkoutForm.fullName.trim() || currentUser.displayName || 'Valued Client',
        customerEmail: checkoutForm.email.trim() || currentUser.email || 'client@vynoox.com',
        customerPhone: checkoutForm.phone.trim() || '+91 9876543210',
        shippingAddress: checkoutForm.address.trim(),
        city: checkoutForm.city.trim(),
        state: checkoutForm.state.trim(),
        pinCode: checkoutForm.pinCode.trim(),
        country: checkoutForm.country.trim(),
        itemsSummary: JSON.stringify(cart),
        subtotal: cartSubtotal,
        discountAmount: cartDiscount,
        shippingAmount: cartShipping,
        totalAmount: cartTotal,
        couponCode: appliedCoupon?.code || '',
        paymentMethod: checkoutForm.paymentMethod,
        paymentStatus,
        paymentReference,
        status: paymentStatus === 'paid' ? 'Confirmed' : 'Pending',
        trackingNumber: `AWB${Math.floor(10000000 + Math.random() * 90000000)}IN`,
        carrier: shippingSettings.defaultCarrier,
        internalNotes:
          paymentStatus === 'paid'
            ? 'HMAC-SHA256 Verified Online Payment'
            : 'Cash on Delivery — Collect at doorstep',
        createdAt: new Date().toISOString(),
      };

      const saved = await placeOrder(newOrder);
      setConfirmedOrder(saved);
    } catch (err) {
      notify(
        'Checkout Verification Error',
        err instanceof Error ? err.message : 'Unable to complete transaction',
        'error'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const announcementSection = homepageSections.find(
    (s) => s.type === 'announcement_bar' && s.visible
  );

  // Maintenance Mode Guard
  if (generalSettings.maintenanceMode && !isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-[#FAF9F6] px-6 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-400 mb-4">
          VYNOOX ATELIER · PRIVATE ARCHIVE PREPARATION
        </p>
        <h1 className="text-4xl md:text-5xl font-editorial mb-4">
          Seasonal Collection Update in Progress
        </h1>
        <p className="text-sm text-neutral-400 max-w-md mb-8">
          Our digital flagship is currently preparing the next small-batch release. Administrators may sign in below.
        </p>
        <button
          onClick={() => navigateTo('admin')}
          className="px-6 py-3 bg-[#FAF9F6] text-[#111111] text-xs font-mono uppercase tracking-widest"
        >
          Admin Console Access
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-neutral-950 text-[#111111] dark:text-neutral-100">
      {/* Slim Dismissible Top Announcement Bar (<= 40px per E-Commerce Guidelines) */}
      {!announcementDismissed && announcementSection && (
        <div
          style={{
            backgroundColor: announcementSection.backgroundColor || '#111111',
            color: announcementSection.textColor || '#FAF9F6',
          }}
          className="h-9 px-4 flex items-center justify-between text-[11px] font-mono tracking-wider"
        >
          <span className="hidden sm:inline opacity-60">ARCHIVE 04</span>
          <button
            type="button"
            onClick={() => navigateTo(announcementSection.buttonLink || 'shop-all')}
            className="truncate hover:underline mx-auto"
          >
            {announcementSection.heading || generalSettings.announcementBarText}
          </button>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnouncementDismissed(true)}
            className="opacity-70 hover:opacity-100 ml-2 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="text-2xl font-bold tracking-[0.22em] text-neutral-900 dark:text-white whitespace-nowrap shrink-0 font-architectural"
          >
            {generalSettings.storeName || 'VYNOOX'}
          </a>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {headerNavLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.targetPage}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(link.targetPage);
                }}
                className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                  currentPage === link.targetPage
                    ? 'text-neutral-900 dark:text-white underline underline-offset-8'
                    : ''
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 tabular-nums"
            >
              Shopping Bag ({totalBagCount})
            </button>
          </div>
        </div>

        {/* Sub-Header Utility Toolbar (Search, Account, Orders, Wishlist, Admin Console) */}
        <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 bg-[#F4F2ED]/70 dark:bg-neutral-900/60">
          <div className="max-w-[1440px] mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden font-medium text-neutral-900 dark:text-white whitespace-nowrap shrink-0"
              >
                {mobileMenuOpen ? 'Close Menu' : 'Menu'}
              </button>
              <button
                type="button"
                onClick={() => setSearchBarOpen(!searchBarOpen)}
                className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search Catalog</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => navigateTo('wishlist')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 tabular-nums"
              >
                Wishlist ({wishlistIds.length})
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => navigateTo('orders')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Track Orders
              </button>
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo('account')}
                    className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    Account ({currentUser.displayName || currentUser.email?.split('@')[0]})
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Client Sign In / Register
                </button>
              )}
            </div>
          </div>

          {/* Expandable Instant Search Bar */}
          {searchBarOpen && (
            <div className="max-w-[1440px] mx-auto px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentPage !== 'shop-all') navigateTo('shop-all');
                }}
                placeholder="Search by garment name, SKU (e.g. VYN-AW-001), acid wash, 280 GSM..."
                className="w-full bg-transparent text-sm focus:outline-none text-neutral-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-500 hover:text-neutral-900 whitespace-nowrap shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-neutral-950 flex flex-col gap-3">
              {headerNavLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    navigateTo(link.targetPage);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm font-medium py-1.5 border-b border-neutral-100 dark:border-neutral-900"
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1">
        {/* 1. HOMEPAGE (Rendered dynamically from Admin Homepage Builder sections) */}
        {currentPage === 'home' && (
          <div>
            {homepageSections
              .filter((sec) => sec.visible && sec.type !== 'announcement_bar')
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                const padClass =
                  section.spacingY === 'compact'
                    ? 'py-10'
                    : section.spacingY === 'spacious'
                    ? 'py-20'
                    : 'py-16';

                if (section.type === 'hero_banner') {
                  return (
                    <React.Fragment key={section.id}>
                      <FullScreenCinematicHero />
                      {!homepageSections.some(
                        (s) => s.visible && s.type === 'new_arrivals'
                      ) && <NewArrivalsShowcaseSection />}
                      {!homepageSections.some(
                        (s) => s.visible && s.type === 'ugc_video_showcase'
                      ) && <VynooxCommunityUgcSection />}
                    </React.Fragment>
                  );
                }

                if (section.type === 'new_arrivals') {
                  return <NewArrivalsShowcaseSection key={section.id} />;
                }

                if (section.type === 'ugc_video_showcase') {
                  return <VynooxCommunityUgcSection key={section.id} />;
                }

                if (section.type === 'featured_collections') {
                  return (
                    <section
                      key={section.id}
                      className={`max-w-[1440px] mx-auto px-6 ${padClass} border-b border-neutral-200 dark:border-neutral-800`}
                    >
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                            {section.subheading}
                          </p>
                          <h2 className="text-3xl md:text-4xl font-editorial">{section.heading}</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateTo('collections')}
                          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:underline whitespace-nowrap shrink-0"
                        >
                          <span>{section.buttonText || 'All Collections'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {collections.slice(0, 3).map((col) => (
                          <div
                            key={col.id}
                            onClick={() => {
                              setActiveCollection(col.name);
                              navigateTo('shop-all', { collectionSlug: col.slug });
                            }}
                            className="group cursor-pointer border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-[#EFECE6]">
                              <img
                                src={col.image}
                                alt={col.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                              />
                            </div>
                            <div className="p-6">
                              <h3 className="text-xl font-editorial font-semibold mb-2 group-hover:underline">
                                {col.name}
                              </h3>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                                {col.description}
                              </p>
                              <span className="text-xs font-mono uppercase tracking-widest inline-flex items-center gap-1.5">
                                <span>Explore Capsule</span>
                                <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (
                  section.type === 'featured_products' ||
                  section.type === 'best_sellers'
                ) {
                  const list =
                    section.type === 'best_sellers'
                      ? publishedProducts.filter((p) => p.bestSeller)
                      : publishedProducts.filter((p) => p.featured);
                  const displayList = (list.length > 0 ? list : publishedProducts).slice(0, 6);

                  return (
                    <section
                      key={section.id}
                      style={{
                        backgroundColor: section.backgroundColor || undefined,
                      }}
                      className={`${padClass} border-b border-neutral-200 dark:border-neutral-800`}
                    >
                      <div className="max-w-[1440px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                          <div>
                            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                              {section.subheading}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-editorial">
                              {section.heading}
                            </h2>
                            {section.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
                                {section.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateTo(section.buttonLink || 'shop-all')}
                            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:underline whitespace-nowrap shrink-0"
                          >
                            <span>{section.buttonText || 'View All'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {displayList.map((prod) => (
                            <ProductCard key={prod.id} product={prod} />
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'brand_story') {
                  return (
                    <section
                      key={section.id}
                      style={{
                        backgroundColor: section.backgroundColor || '#141413',
                        color: section.textColor || '#FAF9F6',
                      }}
                      className={padClass}
                    >
                      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-6">
                          <p className="text-xs font-mono uppercase tracking-[0.25em] opacity-70">
                            {section.subheading}
                          </p>
                          <h2 className="text-3xl md:text-5xl font-editorial leading-tight">
                            {section.heading}
                          </h2>
                          <p className="text-base opacity-80 leading-relaxed max-w-2xl">
                            {section.description}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigateTo(section.buttonLink || 'about-us')}
                            className="px-6 py-3 border border-current text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition-colors"
                          >
                            {section.buttonText || 'Read Atelier Manifesto'}
                          </button>
                        </div>
                        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs border-l border-white/15 pl-6">
                          <div className="space-y-2">
                            <span className="text-2xl font-semibold block tabular-nums">280 GSM</span>
                            <p className="opacity-75 leading-relaxed">
                              Custom-knitted compact organic cotton jersey engineered to eliminate torque and shrinkage.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <span className="text-2xl font-semibold block tabular-nums">1.2 INCH</span>
                            <p className="opacity-75 leading-relaxed">
                              High-density double-ribbed crew collar that maintains structural tension across 100+ wears.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <span className="text-2xl font-semibold block tabular-nums">100%</span>
                            <p className="opacity-75 leading-relaxed">
                              GOTS-certified combed long-staple yarns with non-toxic mineral and enzyme wash baths.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <span className="text-2xl font-semibold block tabular-nums">4-POINT</span>
                            <p className="opacity-75 leading-relaxed">
                              Individual studio seam, measurement, and steam inspection before dispatch.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'customer_testimonials') {
                  const approvedReviews = reviews.filter((r) => r.status === 'approved').slice(0, 3);
                  return (
                    <section
                      key={section.id}
                      className={`max-w-[1440px] mx-auto px-6 ${padClass} border-b border-neutral-200 dark:border-neutral-800`}
                    >
                      <div className="mb-10">
                        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                          {section.subheading}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-editorial">{section.heading}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {approvedReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                                <span>{'★'.repeat(rev.rating)}</span>
                                {rev.verifiedPurchase && <span>VERIFIED ACQUISITION</span>}
                              </div>
                              <h3 className="text-base font-semibold">{rev.title}</h3>
                              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                &ldquo;{rev.comment}&rdquo;
                              </p>
                            </div>
                            <div className="pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                              <p className="font-semibold text-neutral-900 dark:text-white">
                                {rev.authorName}
                              </p>
                              <p className="mt-0.5">{rev.productName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === 'promotional_banner') {
                  return (
                    <section
                      key={section.id}
                      style={{
                        backgroundColor: section.backgroundColor || '#1C1B19',
                        color: section.textColor || '#FAF9F6',
                      }}
                      className="py-12 px-6 text-center"
                    >
                      <div className="max-w-3xl mx-auto space-y-4">
                        <p className="text-xs font-mono uppercase tracking-widest opacity-70">
                          {section.subheading}
                        </p>
                        <h2 className="text-3xl font-editorial">{section.heading}</h2>
                        <p className="text-sm opacity-80">{section.description}</p>
                        <button
                          type="button"
                          onClick={() => navigateTo(section.buttonLink || 'shop-all')}
                          className="mt-2 px-6 py-2.5 bg-[#FAF9F6] text-[#111111] text-xs font-mono uppercase tracking-widest"
                        >
                          {section.buttonText || 'Explore Offer'}
                        </button>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'social_media_gallery') {
                  return (
                    <section
                      key={section.id}
                      className={`max-w-[1440px] mx-auto px-6 ${padClass} border-b border-neutral-200 dark:border-neutral-800`}
                    >
                      <div className="mb-8">
                        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                          {section.subheading}
                        </p>
                        <h2 className="text-3xl font-editorial">{section.heading}</h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {publishedProducts.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => navigateTo('product-details', { productSlug: p.slug })}
                            className="aspect-square overflow-hidden border border-neutral-200 cursor-pointer group"
                          >
                            <img
                              src={p.primaryImage}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === 'newsletter') {
                  return (
                    <section
                      key={section.id}
                      className={`px-6 ${padClass} bg-[#F3F1EC] dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800`}
                    >
                      <div className="max-w-2xl mx-auto text-center space-y-4">
                        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                          {section.subheading}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-editorial">{section.heading}</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {section.description}
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newsletterEmail.trim()) return;
                            notify(
                              'Archive Dispatch Confirmed',
                              `${newsletterEmail} has been added to the VYNOOX private release list.`,
                              'success'
                            );
                            setNewsletterEmail('');
                          }}
                          className="pt-3 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                        >
                          <input
                            type="email"
                            required
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            placeholder="Enter your electronic mail..."
                            className="flex-1 px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:border-neutral-900"
                          />
                          <button
                            type="submit"
                            className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest font-semibold whitespace-nowrap shrink-0"
                          >
                            {section.buttonText || 'Subscribe'}
                          </button>
                        </form>
                      </div>
                    </section>
                  );
                }

                return null;
              })}
          </div>
        )}

        {/* 2, 3, 4. SHOP ALL / NEW ARRIVALS / BEST SELLERS */}
        {(currentPage === 'shop-all' ||
          currentPage === 'new-arrivals' ||
          currentPage === 'best-sellers') && (
          <div className="max-w-[1440px] mx-auto px-6 py-12">
            {/* Editorial Header */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                  VYNOOX ARCHIVE CATALOG
                </p>
                <h1 className="text-4xl md:text-5xl font-editorial">
                  {currentPage === 'new-arrivals'
                    ? 'New Arrivals'
                    : currentPage === 'best-sellers'
                    ? 'Best Sellers'
                    : 'Complete Collection'}
                </h1>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Filter by Category"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by Collection"
                  value={activeCollection}
                  onChange={(e) => setActiveCollection(e.target.value)}
                  className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
                >
                  <option value="all">All Capsules</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by Size"
                  value={activeSize}
                  onChange={(e) => setActiveSize(e.target.value)}
                  className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
                >
                  <option value="all">All Sizes</option>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'].map((s) => (
                    <option key={s} value={s}>
                      Size {s}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort Products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Releases</option>
                </select>
              </div>
            </div>

            {(() => {
              let filtered = publishedProducts;
              if (currentPage === 'new-arrivals') {
                filtered = filtered.filter((p) => p.newArrival);
              } else if (currentPage === 'best-sellers') {
                filtered = filtered.filter((p) => p.bestSeller);
              }
              if (activeCategory !== 'all') {
                filtered = filtered.filter((p) => p.category === activeCategory);
              }
              if (activeCollection !== 'all') {
                filtered = filtered.filter((p) => p.collection === activeCollection);
              }
              if (activeSize !== 'all') {
                filtered = filtered.filter((p) =>
                  p.sizesCsv
                    .split(',')
                    .map((s) => s.trim())
                    .includes(activeSize)
                );
              }
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(
                  (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.tagsCsv.toLowerCase().includes(q)
                );
              }
              if (sortBy === 'price-asc') {
                filtered = [...filtered].sort((a, b) => a.salePrice - b.salePrice);
              } else if (sortBy === 'price-desc') {
                filtered = [...filtered].sort((a, b) => b.salePrice - a.salePrice);
              }

              if (filtered.length === 0) {
                return (
                  <div className="py-20 text-center border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <p className="text-base font-medium mb-2">
                      No garments match your current filter selection.
                    </p>
                    <p className="text-xs text-neutral-500 mb-6">
                      Reset filters to browse the full VYNOOX heavyweight archive.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveCollection('all');
                        setActiveSize('all');
                        setSearchQuery('');
                      }}
                      className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                    >
                      Reset Filters
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. COLLECTIONS PAGE */}
        {currentPage === 'collections' && (
          <div className="max-w-[1440px] mx-auto px-6 py-12">
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-10">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                CURATED CAPSULES
              </p>
              <h1 className="text-4xl md:text-5xl font-editorial">VYNOOX Collections</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {collections.map((col) => {
                const colProducts = publishedProducts.filter((p) => p.collection === col.name);
                return (
                  <div
                    key={col.id}
                    className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-[#EFECE6] overflow-hidden">
                        <img
                          src={col.image}
                          alt={col.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-8">
                        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
                          <span>CAPSULE ARCHIVE</span>
                          <span>{colProducts.length} GARMENTS</span>
                        </div>
                        <h2 className="text-2xl font-editorial font-semibold mb-3">{col.name}</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                          {col.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCollection(col.name);
                            navigateTo('shop-all');
                          }}
                          className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest"
                        >
                          Shop {col.name}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. PRODUCT DETAILS PAGE (PDP) — Contiguous Purchase Module */}
        {currentPage === 'product-details' && activeProduct && (
          <div className="max-w-[1440px] mx-auto px-6 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-8">
              <button type="button" onClick={() => navigateTo('home')} className="hover:underline">
                Home
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => navigateTo('shop-all')}
                className="hover:underline"
              >
                {activeProduct.collection}
              </button>
              <span>/</span>
              <span className="text-neutral-900 dark:text-white font-medium truncate">
                {activeProduct.name}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Sticky Gallery */}
              <div className="lg:col-span-7 space-y-4">
                {(() => {
                  const galleryImages = [
                    activeProduct.primaryImage,
                    activeProduct.secondaryImage,
                    ...(activeProduct.additionalImages || []),
                  ].filter(Boolean);
                  const currentImg = galleryImages[selectedGalleryIdx] || activeProduct.primaryImage;
                  return (
                    <>
                      <div className="aspect-[4/3] w-full bg-[#F3F1EC] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <img
                          src={currentImg}
                          alt={activeProduct.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {galleryImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                          {galleryImages.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedGalleryIdx(idx)}
                              className={`aspect-[4/3] border overflow-hidden ${
                                selectedGalleryIdx === idx
                                  ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900'
                                  : 'border-neutral-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`${activeProduct.name} view ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Right Column: Contiguous Purchase Module */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 md:p-8 space-y-6">
                <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                    <span>{activeProduct.collection.toUpperCase()}</span>
                    <span>SKU: {activeProduct.sku}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-editorial font-semibold">
                    {activeProduct.name}
                  </h1>
                  <div className="flex items-baseline gap-3 pt-1 font-mono tabular-nums">
                    <span className="text-2xl font-bold">
                      {generalSettings.currencySymbol}
                      {activeProduct.salePrice.toLocaleString('en-IN')}
                    </span>
                    {activeProduct.compareAtPrice > activeProduct.salePrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        {generalSettings.currencySymbol}
                        {activeProduct.compareAtPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">Incl. of all taxes</span>
                  </div>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {activeProduct.description}
                </p>

                {/* Color Variant Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider">
                      Colorway: <span className="font-normal">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.colorsCsv
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
                            selectedColor === color
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-900'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Size Variant Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider">
                      Size: <span className="font-mono">{selectedSize}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="underline text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                    >
                      Size &amp; Fit Architecture Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {activeProduct.sizesCsv
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2.5 text-xs font-mono border transition-colors ${
                            selectedSize === sz
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-900'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Material & Fit Spec */}
                <div className="py-3 px-4 bg-[#F4F2ED] dark:bg-neutral-800/60 text-xs space-y-1">
                  <div>
                    <span className="font-semibold">Fabrication: </span>
                    <span>{activeProduct.materialsCsv}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Silhouette: </span>
                    <span>{activeProduct.stylesCsv}</span>
                  </div>
                  <div className="font-mono text-[11px] pt-1 text-neutral-600 dark:text-neutral-400">
                    Availability:{' '}
                    {activeProduct.stockQuantity > 0
                      ? `${activeProduct.stockQuantity} units ready for studio dispatch`
                      : 'Out of Stock'}
                  </div>
                </div>

                {/* Quantity & Primary Purchase CTAs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setPdpQuantity(Math.max(1, pdpQuantity - 1))}
                        className="px-3 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-4 font-mono text-sm tabular-nums">{pdpQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setPdpQuantity(pdpQuantity + 1)}
                        className="px-3 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={activeProduct.stockQuantity <= 0 && !activeProduct.allowBackorder}
                      onClick={() =>
                        addToCart({
                          productId: activeProduct.id,
                          name: activeProduct.name,
                          slug: activeProduct.slug,
                          sku: activeProduct.sku,
                          price: activeProduct.salePrice,
                          regularPrice: activeProduct.regularPrice,
                          image: activeProduct.primaryImage,
                          size: selectedSize,
                          color: selectedColor,
                          material: activeProduct.materialsCsv,
                          style: activeProduct.stylesCsv,
                          quantity: pdpQuantity,
                        })
                      }
                      className="flex-1 py-3.5 px-6 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-40"
                    >
                      {activeProduct.stockQuantity > 0 ? 'Add to Shopping Bag' : 'Sold Out'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(activeProduct.id)}
                      className="p-3.5 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900"
                      aria-label="Toggle Wishlist"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlistIds.includes(activeProduct.id) ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {activeProduct.stockQuantity > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(
                          {
                            productId: activeProduct.id,
                            name: activeProduct.name,
                            slug: activeProduct.slug,
                            sku: activeProduct.sku,
                            price: activeProduct.salePrice,
                            regularPrice: activeProduct.regularPrice,
                            image: activeProduct.primaryImage,
                            size: selectedSize,
                            color: selectedColor,
                            material: activeProduct.materialsCsv,
                            style: activeProduct.stylesCsv,
                            quantity: pdpQuantity,
                          },
                          false
                        );
                        navigateTo('checkout');
                      }}
                      className="w-full py-3 border border-neutral-900 dark:border-white text-xs font-mono uppercase tracking-widest font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      Instant Checkout · Buy Now
                    </button>
                  )}
                </div>

                {/* PIN Code Delivery Verification */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <label className="block text-xs font-mono uppercase text-neutral-500">
                    Check Delivery &amp; COD Availability
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pinCheckInput}
                      onChange={(e) => setPinCheckInput(e.target.value)}
                      placeholder="Enter 6-digit PIN Code (e.g. 400013)"
                      className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 text-xs bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={checkPinServiceability}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-xs font-mono uppercase tracking-wider"
                    >
                      Verify
                    </button>
                  </div>
                  {pinCheckResult && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">{pinCheckResult}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Reviews & Ratings Section on PDP */}
            <div className="mt-20 pt-12 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  CLIENT FEEDBACK &amp; FIT VERIFICATION
                </p>
                <h2 className="text-3xl font-editorial">Verified Client Reviews</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Every review is moderated for authenticity. Clients with confirmed orders receive the Verified Purchase badge.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser) {
                      notify('Sign In Required', 'Please sign in to submit a product review.', 'info');
                      await loginWithGoogle();
                      return;
                    }
                    const hasOrdered = orders.some((o) => o.customerId === currentUser.uid);
                    const newRev: ReviewItem = {
                      id: `rev-${Date.now()}`,
                      storeId: 'vynoox',
                      productId: activeProduct.id,
                      productName: activeProduct.name,
                      authorUid: currentUser.uid,
                      authorName: currentUser.displayName || currentUser.email || 'VYNOOX Client',
                      rating: reviewRating,
                      title: reviewTitle.trim() || 'Impressive Heavyweight Quality',
                      comment: reviewComment.trim(),
                      reviewImage: '',
                      verifiedPurchase: hasOrdered,
                      status: 'approved',
                    };
                    await submitReview(newRev);
                    setReviewTitle('');
                    setReviewComment('');
                  }}
                  className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 mt-6"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider">
                    Write a Client Review
                  </h3>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 text-xs bg-transparent"
                    >
                      <option value={5}>5 Stars — Exceptional</option>
                      <option value={4}>4 Stars — Very Good</option>
                      <option value={3}>3 Stars — Satisfactory</option>
                      <option value={2}>2 Stars — Subpar</option>
                      <option value={1}>1 Star — Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize fabric feel and fit..."
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 text-xs bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Review Details</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with the 280 GSM drape, sizing, and wash..."
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 text-xs bg-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest"
                  >
                    Submit Review
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {reviews
                  .filter(
                    (r) =>
                      r.status === 'approved' &&
                      (r.productId === activeProduct.id || r.productId.includes('tee'))
                  )
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                        <span>{'★'.repeat(rev.rating)}</span>
                        {rev.verifiedPurchase && <span>VERIFIED PURCHASE</span>}
                      </div>
                      <h4 className="text-base font-semibold">{rev.title}</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="text-xs text-neutral-400 pt-2">By {rev.authorName}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. SHOPPING CART PAGE */}
        {currentPage === 'cart' && (
          <div className="max-w-[1440px] mx-auto px-6 py-12">
            <h1 className="text-4xl font-editorial mb-8">Shopping Bag</h1>
            {cart.length === 0 ? (
              <div className="py-20 text-center border border-neutral-200 bg-white dark:bg-neutral-900">
                <p className="text-base mb-4">Your VYNOOX shopping bag is currently empty.</p>
                <button
                  type="button"
                  onClick={() => navigateTo('shop-all')}
                  className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="p-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-24 h-20 object-cover bg-[#F3F1EC] border border-neutral-200"
                        />
                        <div>
                          <h3 className="text-base font-semibold">{item.name}</h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Size: {item.size} · Color: {item.color} · SKU: {item.sku}
                          </p>
                          <p className="text-sm font-mono font-semibold mt-1 tabular-nums">
                            {generalSettings.currencySymbol}
                            {item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-neutral-300">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                            className="px-2.5 py-1.5"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-mono tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                            className="px-2.5 py-1.5"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.size, item.color)}
                          className="text-xs text-neutral-500 hover:text-red-600 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-4 p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-5 h-fit">
                  <h2 className="text-lg font-editorial font-semibold border-b pb-3">
                    Order Summary
                  </h2>
                  {/* Coupon Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-neutral-500">
                      Privilege / Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="e.g. VYNOOX15"
                        className="flex-1 px-3 py-2 border border-neutral-300 text-xs font-mono uppercase bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = applyCouponCode(couponInput);
                          setCouponFeedback({ ok: res.success, msg: res.message });
                        }}
                        className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase"
                      >
                        Apply
                      </button>
                    </div>
                    {couponFeedback && (
                      <p
                        className={`text-xs ${
                          couponFeedback.ok ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {couponFeedback.msg}
                      </p>
                    )}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
                        <span className="font-mono">APPLIED: {appliedCoupon.code}</span>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="underline text-neutral-500"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm font-mono tabular-nums border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Subtotal</span>
                      <span>
                        {generalSettings.currencySymbol}
                        {cartSubtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Privilege Discount</span>
                      <span>
                        -{generalSettings.currencySymbol}
                        {cartDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipping</span>
                      <span>
                        {cartShipping === 0
                          ? 'COMPLIMENTARY'
                          : `${generalSettings.currencySymbol}${cartShipping}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-3">
                      <span>Total Payable</span>
                      <span>
                        {generalSettings.currencySymbol}
                        {cartTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('checkout')}
                    className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest font-semibold"
                  >
                    Proceed to Secure Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. CHECKOUT PAGE */}
        {currentPage === 'checkout' && (
          <div className="max-w-[1200px] mx-auto px-6 py-12">
            {confirmedOrder ? (
              <div className="max-w-2xl mx-auto p-8 md:p-12 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-semibold">
                      ORDER VERIFIED &amp; CONFIRMED
                    </p>
                    <h1 className="text-3xl font-editorial mt-1">
                      Order #{confirmedOrder.orderNumber} — Preparing Shipment
                    </h1>
                  </div>
                  <Check className="h-8 w-8 text-emerald-700" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono bg-[#F4F2ED] dark:bg-neutral-800 p-4">
                  <div>
                    <span className="text-neutral-500 block">PAYMENT STATUS</span>
                    <span className="font-semibold uppercase">
                      {confirmedOrder.paymentStatus} ({confirmedOrder.paymentMethod.toUpperCase()})
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">VERIFICATION REF</span>
                    <span className="font-semibold">{confirmedOrder.paymentReference}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">AWB TRACKING NUMBER</span>
                    <span className="font-semibold">{confirmedOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">TOTAL AMOUNT</span>
                    <span className="font-semibold">
                      {generalSettings.currencySymbol}
                      {confirmedOrder.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOrder(confirmedOrder)}
                    className="px-5 py-2.5 border border-neutral-900 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View / Print Tax Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      navigateTo('orders');
                    }}
                    className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider"
                  >
                    Track in My Orders
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 space-y-6">
                  <div className="border-b pb-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                      ENCRYPTED CLIENT CHECKOUT
                    </p>
                    <h1 className="text-3xl font-editorial mt-1">Shipping &amp; Verification</h1>
                  </div>

                  {!currentUser && (
                    <div className="p-4 border border-neutral-300 bg-[#F4F2ED] dark:bg-neutral-900 flex items-center justify-between gap-4">
                      <p className="text-xs">
                        Sign in with your Google Account to save this order to your Order History.
                      </p>
                      <button
                        type="button"
                        onClick={() => loginWithGoogle()}
                        className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase whitespace-nowrap shrink-0"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.fullName}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, fullName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.email}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, email: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, phone: e.target.value })
                        }
                        placeholder="+91 9876543210"
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Street Address *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.address}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, address: e.target.value })
                        }
                        placeholder="Building, Street, Landmark"
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.state}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, state: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.pinCode}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, pinCode: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Country *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.country}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, country: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                      />
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="pt-4 space-y-3">
                    <h2 className="text-sm font-mono uppercase tracking-wider">Payment Method</h2>
                    {paymentSettings.razorpayEnabled && (
                      <label className="flex items-start gap-3 p-4 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={checkoutForm.paymentMethod === 'razorpay'}
                          onChange={() =>
                            setCheckoutForm({ ...checkoutForm, paymentMethod: 'razorpay' })
                          }
                          className="mt-1"
                        />
                        <div className="text-xs">
                          <span className="font-semibold block text-sm">
                            Razorpay Secure Online Payment (UPI, Cards, NetBanking)
                          </span>
                          <span className="text-neutral-500">
                            Cryptographically verified on the backend via HMAC-SHA256 before marking order as Paid.
                          </span>
                        </div>
                      </label>
                    )}

                    {paymentSettings.codEnabled && (
                      <label className="flex items-start gap-3 p-4 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={checkoutForm.paymentMethod === 'cod'}
                          onChange={() =>
                            setCheckoutForm({ ...checkoutForm, paymentMethod: 'cod' })
                          }
                          className="mt-1"
                        />
                        <div className="text-xs">
                          <span className="font-semibold block text-sm">
                            Cash on Delivery (Pay in Cash/UPI upon Doorstep Delivery)
                          </span>
                          <span className="text-neutral-500">
                            Available on orders up to {generalSettings.currencySymbol}
                            {paymentSettings.codMaxOrderAmount.toLocaleString('en-IN')}.
                          </span>
                        </div>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingPayment || cart.length === 0}
                    className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest font-semibold hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {isProcessingPayment
                      ? 'Verifying Cryptographic Payment Signature...'
                      : checkoutForm.paymentMethod === 'razorpay'
                      ? `Pay & Verify ${generalSettings.currencySymbol}${cartTotal.toLocaleString(
                          'en-IN'
                        )}`
                      : `Confirm Cash on Delivery Order (${generalSettings.currencySymbol}${cartTotal.toLocaleString(
                          'en-IN'
                        )})`}
                  </button>
                </form>

                {/* Right Summary */}
                <div className="lg:col-span-5 p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-fit space-y-4">
                  <h2 className="text-lg font-editorial font-semibold border-b pb-3">
                    Bag Summary ({totalBagCount} items)
                  </h2>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={`${item.productId}-${item.size}-${item.color}`}
                        className="flex items-center justify-between gap-3 text-xs border-b border-neutral-100 pb-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-12 object-cover border"
                          />
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-neutral-500">
                              {item.size} · {item.color} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums">
                          {generalSettings.currencySymbol}
                          {(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm font-mono tabular-nums pt-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Subtotal</span>
                      <span>
                        {generalSettings.currencySymbol}
                        {cartSubtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Discount</span>
                      <span>
                        -{generalSettings.currencySymbol}
                        {cartDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipping</span>
                      <span>
                        {cartShipping === 0
                          ? 'FREE'
                          : `${generalSettings.currencySymbol}${cartShipping}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-3">
                      <span>Total</span>
                      <span>
                        {generalSettings.currencySymbol}
                        {cartTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9 & 10. CUSTOMER LOGIN & REGISTRATION */}
        {(currentPage === 'login' || currentPage === 'register') && (
          <div className="max-w-md mx-auto px-6 py-20">
            <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6 text-center">
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                VYNOOX CLIENT PORTAL
              </p>
              <h1 className="text-3xl font-editorial">
                {currentPage === 'register' ? 'Create Client Account' : 'Client Sign In'}
              </h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Authenticate securely with Google to manage your saved addresses, track live shipments, and access private archive drops.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await loginWithGoogle();
                  navigateTo('account');
                }}
                className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-widest font-semibold"
              >
                Continue with Google Authentication
              </button>
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-center text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(currentPage === 'login' ? 'register' : 'login')
                  }
                  className="underline"
                >
                  {currentPage === 'login'
                    ? 'New Client? Register Here'
                    : 'Existing Client? Sign In'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 11. MY ACCOUNT PAGE */}
        {currentPage === 'account' && (
          <div className="max-w-[1100px] mx-auto px-6 py-12">
            <div className="border-b pb-6 mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  CLIENT PROFILE &amp; ADDRESS BOOK
                </p>
                <h1 className="text-4xl font-editorial mt-1">My Account</h1>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-4 py-2 border border-neutral-300 text-xs font-mono uppercase"
                >
                  Sign Out
                </button>
              )}
            </div>

            {!currentUser || !currentCustomerProfile ? (
              <div className="p-12 border border-neutral-200 bg-white text-center space-y-4">
                <p className="text-sm">Sign in to access your saved addresses and profile.</p>
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                >
                  Sign In with Google
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveCustomerProfile({
                    ...currentCustomerProfile,
                    fullName: checkoutForm.fullName,
                    phone: checkoutForm.phone,
                    defaultAddress: checkoutForm.address,
                    city: checkoutForm.city,
                    state: checkoutForm.state,
                    pinCode: checkoutForm.pinCode,
                    country: checkoutForm.country,
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={checkoutForm.fullName}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, fullName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-neutral-300 text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Verified Email</label>
                  <input
                    type="email"
                    disabled
                    value={currentCustomerProfile.email}
                    className="w-full px-3.5 py-2 border border-neutral-200 text-sm bg-neutral-100 text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-neutral-300 text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Default Street Address</label>
                  <input
                    type="text"
                    value={checkoutForm.address}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-neutral-300 text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 border border-neutral-300 text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Postal PIN Code</label>
                  <input
                    type="text"
                    value={checkoutForm.pinCode}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, pinCode: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-neutral-300 text-sm bg-transparent"
                  />
                </div>
                <div className="md:col-span-2 pt-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500 tabular-nums">
                    Lifetime Acquisitions: {currentCustomerProfile.ordersCount} Orders ·{' '}
                    {generalSettings.currencySymbol}
                    {currentCustomerProfile.totalSpent.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                  >
                    Save Profile &amp; Address
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 12. MY ORDERS PAGE */}
        {currentPage === 'orders' && (
          <div className="max-w-[1200px] mx-auto px-6 py-12">
            <h1 className="text-4xl font-editorial mb-8">My Orders &amp; Shipment Tracking</h1>
            {orders.length === 0 ? (
              <div className="p-16 text-center border border-neutral-200 bg-white dark:bg-neutral-900 space-y-4">
                <p className="text-sm text-neutral-600">
                  No orders found for your account yet. Place an order to track real-time dispatch stages.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('shop-all')}
                  className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                >
                  Shop Collection
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => {
                  const steps = [
                    'Pending',
                    'Confirmed',
                    'Processing',
                    'Packed',
                    'Shipped',
                    'Delivered',
                  ];
                  const activeStepIdx = steps.indexOf(ord.status);
                  return (
                    <div
                      key={ord.id}
                      className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                        <div>
                          <span className="text-xs font-mono text-neutral-500">
                            ORDER #{ord.orderNumber}
                          </span>
                          <h3 className="text-lg font-semibold">
                            Status: {ord.status} · Payment: {ord.paymentStatus.toUpperCase()}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-mono font-bold tabular-nums">
                            {generalSettings.currencySymbol}
                            {ord.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInvoiceModalOrder(ord)}
                            className="px-3.5 py-2 border border-neutral-300 text-xs font-mono uppercase"
                          >
                            Invoice
                          </button>
                          {ord.status !== 'Delivered' &&
                            ord.status !== 'Cancelled' &&
                            ord.status !== 'Refunded' && (
                              <button
                                type="button"
                                onClick={() => updateOrder(ord, { status: 'Cancelled' })}
                                className="px-3.5 py-2 border border-red-300 text-red-700 text-xs font-mono uppercase"
                              >
                                Cancel Order
                              </button>
                            )}
                        </div>
                      </div>

                      {/* 6-Stage Fulfillment Progress */}
                      {activeStepIdx !== -1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                          {steps.map((st, idx) => (
                            <div
                              key={st}
                              className={`p-2 text-center border text-xs font-mono ${
                                idx <= activeStepIdx
                                  ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  : 'border-neutral-200 text-neutral-400'
                              }`}
                            >
                              {idx + 1}. {st}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs font-mono text-neutral-500 flex flex-wrap gap-6 pt-2">
                        <span>AWB Tracking: {ord.trackingNumber || 'Pending Assignment'}</span>
                        <span>Carrier: {ord.carrier || shippingSettings.defaultCarrier}</span>
                        <span>
                          Destination: {ord.shippingAddress}, {ord.city} - {ord.pinCode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 13. WISHLIST PAGE */}
        {currentPage === 'wishlist' && (
          <div className="max-w-[1440px] mx-auto px-6 py-12">
            <h1 className="text-4xl font-editorial mb-8">Saved Wishlist</h1>
            {wishlistIds.length === 0 ? (
              <div className="py-20 text-center border border-neutral-200 bg-white">
                <p className="text-sm text-neutral-600 mb-4">Your wishlist is empty.</p>
                <button
                  type="button"
                  onClick={() => navigateTo('shop-all')}
                  className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                >
                  Explore Garments
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products
                  .filter((p) => wishlistIds.includes(p.id))
                  .map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 14–20. CMS PAGES (About Us, Contact Us, FAQ, Privacy, Terms, Shipping, Return & Refund) */}
        {[
          'about-us',
          'contact-us',
          'faq',
          'privacy-policy',
          'terms-and-conditions',
          'shipping-policy',
          'return-and-refund-policy',
        ].includes(currentPage) && (
          <div className="max-w-4xl mx-auto px-6 py-16">
            {(() => {
              const pageDoc =
                pages.find((p) => p.slug === currentPage) ||
                pages.find((p) => p.id === currentPage);
              if (!pageDoc) return null;

              return (
                <article className="space-y-8">
                  <header className="border-b border-neutral-200 dark:border-neutral-800 pb-8">
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                      VYNOOX OFFICIAL DOCUMENTATION
                    </p>
                    <h1 className="text-4xl md:text-5xl font-editorial">{pageDoc.title}</h1>
                    {pageDoc.subtitle && (
                      <p className="text-base text-neutral-600 dark:text-neutral-400 mt-3">
                        {pageDoc.subtitle}
                      </p>
                    )}
                  </header>

                  <div className="prose max-w-none space-y-5 text-sm md:text-base leading-relaxed whitespace-pre-line text-neutral-800 dark:text-neutral-200">
                    {pageDoc.content}
                  </div>

                  {/* Interactive Contact Form on Contact Us page */}
                  {currentPage === 'contact-us' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        notify(
                          'Concierge Inquiry Dispatched',
                          `Thank you, ${contactName}. Our team will respond to ${contactEmail} within 4 business hours.`,
                          'success'
                        );
                        setContactName('');
                        setContactEmail('');
                        setContactMessage('');
                      }}
                      className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 mt-8"
                    >
                      <h2 className="text-xl font-editorial font-semibold">
                        Send Direct Message to Client Concierge
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Your Name *</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm bg-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Order Number or Inquiry Details *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm bg-transparent"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-neutral-900 text-white text-xs font-mono uppercase tracking-widest"
                      >
                        Dispatch Inquiry
                      </button>
                    </form>
                  )}
                </article>
              );
            })()}
          </div>
        )}
      </main>

      {/* SLIDE-OVER SHOPPING BAG DRAWER */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FAF9F6] dark:bg-neutral-950 h-full flex flex-col justify-between border-l border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-editorial font-semibold">
                Shopping Bag ({totalBagCount})
              </h2>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-12">
                  Your shopping bag is empty.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 object-cover bg-[#F3F1EC] border border-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {item.size} · {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-neutral-300">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                            className="px-2 py-0.5 text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                            className="px-2 py-0.5 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums">
                          {generalSettings.currencySymbol}
                          {(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                <div className="flex justify-between text-sm font-mono tabular-nums">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-semibold">
                    {generalSettings.currencySymbol}
                    {cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('cart')}
                    className="py-3 border border-neutral-900 dark:border-white text-xs font-mono uppercase tracking-wider"
                  >
                    View Full Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('checkout')}
                    className="py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-wider font-semibold"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-editorial font-semibold">
                VYNOOX Architectural Size Chart (Inches)
              </h3>
              <button type="button" onClick={() => setSizeGuideOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <table className="w-full text-xs font-mono tabular-nums text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2">SIZE</th>
                  <th className="py-2">CHEST</th>
                  <th className="py-2">LENGTH</th>
                  <th className="py-2">SHOULDER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-2 font-semibold">XS</td>
                  <td className="py-2">42&quot;</td>
                  <td className="py-2">27.5&quot;</td>
                  <td className="py-2">20.5&quot;</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">S</td>
                  <td className="py-2">44&quot;</td>
                  <td className="py-2">28.5&quot;</td>
                  <td className="py-2">21.5&quot;</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">M</td>
                  <td className="py-2">46&quot;</td>
                  <td className="py-2">29.5&quot;</td>
                  <td className="py-2">22.5&quot;</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">L</td>
                  <td className="py-2">48&quot;</td>
                  <td className="py-2">30.5&quot;</td>
                  <td className="py-2">23.5&quot;</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">XL</td>
                  <td className="py-2">50&quot;</td>
                  <td className="py-2">31.5&quot;</td>
                  <td className="py-2">24.5&quot;</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">XXL</td>
                  <td className="py-2">52&quot;</td>
                  <td className="py-2">32.0&quot;</td>
                  <td className="py-2">25.5&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAX INVOICE MODAL */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white text-neutral-900 max-w-xl w-full p-8 border border-neutral-300 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold tracking-widest">{generalSettings.storeName}</h3>
                <p className="text-xs text-neutral-500 mt-1">{generalSettings.businessAddress}</p>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="font-bold">TAX INVOICE</p>
                <p>#{invoiceModalOrder.orderNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-neutral-500">BILLED TO:</p>
                <p className="font-semibold">{invoiceModalOrder.customerName}</p>
                <p>{invoiceModalOrder.shippingAddress}</p>
                <p>
                  {invoiceModalOrder.city}, {invoiceModalOrder.state} - {invoiceModalOrder.pinCode}
                </p>
              </div>
              <div className="text-right font-mono">
                <p>Method: {invoiceModalOrder.paymentMethod.toUpperCase()}</p>
                <p>Status: {invoiceModalOrder.paymentStatus.toUpperCase()}</p>
                <p>AWB: {invoiceModalOrder.trackingNumber}</p>
              </div>
            </div>
            <div className="border-t border-b py-3 text-xs font-mono tabular-nums space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {generalSettings.currencySymbol}
                  {invoiceModalOrder.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>
                  -{generalSettings.currencySymbol}
                  {invoiceModalOrder.discountAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {generalSettings.currencySymbol}
                  {invoiceModalOrder.shippingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t">
                <span>Total Inclusive of GST</span>
                <span>
                  {generalSettings.currencySymbol}
                  {invoiceModalOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase"
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModalOrder(null)}
                className="px-4 py-2 border border-neutral-300 text-xs font-mono uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITORIAL FOOTER */}
      <footer className="bg-[#111111] text-[#FAF9F6] border-t border-neutral-800 mt-20">
        <div className="max-w-[1440px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <span className="text-2xl font-bold tracking-[0.22em] font-architectural block">
              {generalSettings.storeName}
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              {generalSettings.footerTagline}
            </p>
            <p className="text-xs font-mono text-neutral-400">
              {generalSettings.storeEmail} · {generalSettings.contactNumber}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Catalog &amp; Archive
            </h3>
            <ul className="space-y-2 text-xs">
              {footerShopLinks.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(l.targetPage)}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Client Policies &amp; Legal
            </h3>
            <ul className="space-y-2 text-xs">
              {footerPolicyLinks.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(l.targetPage)}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Atelier Dispatch
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Insured express courier fulfillment across India with 7-day quality &amp; size exchange assurance.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
            <span>{generalSettings.footerCopyright}</span>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('admin');
              }}
              className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
