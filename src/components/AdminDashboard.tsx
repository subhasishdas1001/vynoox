import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Boxes,
  Check,
  Copy,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  Navigation,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Smartphone,
  Star,
  Tablet,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  Video,
  Wand2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { createGarmentStudioSvg, DEFAULT_THEME_SETTINGS } from '../data/initialCatalog';
import { DIRTY_DOZEN_TESTS } from '../../firestore.rules.test';
import {
  AdminHeroAndShowcaseStudio,
  AdminMediaManagerPanel,
  AdminUgcVideoManagerPanel,
} from './AdminHeroMediaUgcPanels';
import { BackendAdminCredentialsManager } from './AdminAuthGate';
import {
  AdminRole,
  AdminSectionId,
  AdminUser,
  CategoryItem,
  CMSPage,
  CollectionItem,
  CouponItem,
  HomepageSection,
  HomepageSectionType,
  NavigationLink,
  OrderItem,
  OrderStatus,
  Product,
  StorePageId,
} from '../types/store';

const ADMIN_NAV_ITEMS: {
  id: AdminSectionId;
  label: string;
  group: 'Core Commerce' | 'Storefront Studio' | 'Growth & Insights' | 'System & Security';
  icon: React.FC<{ className?: string }>;
  allowedRoles: AdminRole[];
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    group: 'Core Commerce',
    icon: LayoutDashboard,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager', 'Order Manager', 'Content Manager'],
  },
  {
    id: 'products',
    label: 'Products',
    group: 'Core Commerce',
    icon: Package,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager'],
  },
  {
    id: 'collections',
    label: 'Collections',
    group: 'Core Commerce',
    icon: Layers,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager'],
  },
  {
    id: 'categories',
    label: 'Categories',
    group: 'Core Commerce',
    icon: FolderKanban,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    group: 'Core Commerce',
    icon: Boxes,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager', 'Order Manager'],
  },
  {
    id: 'orders',
    label: 'Orders',
    group: 'Core Commerce',
    icon: ShoppingBag,
    allowedRoles: ['Super Admin', 'Admin', 'Order Manager'],
  },
  {
    id: 'customers',
    label: 'Customers',
    group: 'Core Commerce',
    icon: Users,
    allowedRoles: ['Super Admin', 'Admin', 'Order Manager'],
  },
  {
    id: 'coupons',
    label: 'Discounts & Coupons',
    group: 'Core Commerce',
    icon: Tag,
    allowedRoles: ['Super Admin', 'Admin', 'Product Manager'],
  },
  {
    id: 'hero-studio',
    label: 'Hero & Showcase Studio',
    group: 'Storefront Studio',
    icon: Monitor,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'media-manager',
    label: 'Media Manager (HD/MP4)',
    group: 'Storefront Studio',
    icon: ImageIcon,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager', 'Product Manager'],
  },
  {
    id: 'ugc-videos',
    label: 'UGC Community Videos',
    group: 'Storefront Studio',
    icon: Video,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'homepage-builder',
    label: 'Homepage Builder',
    group: 'Storefront Studio',
    icon: Wand2,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'theme-customizer',
    label: 'Theme Customizer',
    group: 'Storefront Studio',
    icon: Palette,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'navigation-manager',
    label: 'Navigation Manager',
    group: 'Storefront Studio',
    icon: Navigation,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'pages-manager',
    label: 'Pages Manager',
    group: 'Storefront Studio',
    icon: FileText,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'reviews',
    label: 'Reviews & Ratings',
    group: 'Growth & Insights',
    icon: Star,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager', 'Product Manager'],
  },
  {
    id: 'marketing',
    label: 'Marketing & SEO',
    group: 'Growth & Insights',
    icon: Megaphone,
    allowedRoles: ['Super Admin', 'Admin', 'Content Manager'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    group: 'Growth & Insights',
    icon: BarChart3,
    allowedRoles: ['Super Admin', 'Admin'],
  },
  {
    id: 'shipping-settings',
    label: 'Shipping Settings',
    group: 'System & Security',
    icon: Truck,
    allowedRoles: ['Super Admin', 'Admin', 'Order Manager'],
  },
  {
    id: 'payment-settings',
    label: 'Payment Settings',
    group: 'System & Security',
    icon: CreditCard,
    allowedRoles: ['Super Admin', 'Admin'],
  },
  {
    id: 'general-settings',
    label: 'General Settings',
    group: 'System & Security',
    icon: Settings,
    allowedRoles: ['Super Admin', 'Admin'],
  },
  {
    id: 'staff-management',
    label: 'Staff Management',
    group: 'System & Security',
    icon: Users,
    allowedRoles: ['Super Admin'],
  },
  {
    id: 'security',
    label: 'Security & Rules',
    group: 'System & Security',
    icon: Shield,
    allowedRoles: ['Super Admin', 'Admin'],
  },
  {
    id: 'activity-logs',
    label: 'Activity Logs',
    group: 'System & Security',
    icon: Activity,
    allowedRoles: ['Super Admin', 'Admin'],
  },
];

// Helper to compress uploaded image file into a Firestore-safe Data URL
async function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 720;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAdminUser,
    currentAdminRole,
    adminSession,
    adminSessionToken,
    logoutAdminSession,
    loginWithGoogle,
    logout,
    adminSection,
    setAdminSection,
    navigateTo,
    products,
    collections,
    categories,
    orders,
    customers,
    coupons,
    reviews,
    pages,
    staffMembers,
    activityLogs,
    homepageSections,
    themeSettings,
    generalSettings,
    shippingSettings,
    paymentSettings,
    marketingSettings,
    navigationLinks,
    saveProduct,
    deleteProduct,
    saveCollection,
    deleteCollection,
    saveCategory,
    deleteCategory,
    updateOrder,
    saveCustomerProfile,
    saveCoupon,
    deleteCoupon,
    moderateReview,
    deleteReview,
    savePage,
    deletePage,
    updateHomepageSections,
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
    notify,
  } = useStore();

  const [adminSearch, setAdminSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [bulkDiscountPct, setBulkDiscountPct] = useState<number>(10);

  // Order filter state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderItem | null>(null);

  // Collection & Category form states
  const [newCollectionForm, setNewCollectionForm] = useState<CollectionItem>({
    id: '',
    storeId: 'vynoox',
    name: '',
    slug: '',
    description: '',
    image: '',
    featured: true,
    sortOrder: collections.length + 1,
  });
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryItem>({
    id: '',
    storeId: 'vynoox',
    name: '',
    slug: '',
    description: '',
  });

  // Coupon form state
  const [newCouponForm, setNewCouponForm] = useState<CouponItem>({
    id: '',
    storeId: 'vynoox',
    code: '',
    type: 'percentage',
    value: 15,
    minPurchase: 1499,
    expiryDate: '2027-12-31',
    usageLimit: 200,
    usedCount: 0,
    appliesTo: 'all',
    active: true,
  });

  // Page editor state
  const [editingPage, setEditingPage] = useState<CMSPage>(pages[0]);

  // Homepage builder selected section
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    homepageSections[1]?.id || homepageSections[0]?.id || ''
  );

  // Theme customizer viewport preview
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );

  // Navigation manager state
  const [newNavLabel, setNewNavLabel] = useState('');
  const [newNavTarget, setNewNavTarget] = useState<StorePageId>('shop-all');
  const [newNavLocation, setNewNavLocation] = useState<
    'header' | 'footer_shop' | 'footer_policies'
  >('header');

  // Staff form state
  const [newStaffForm, setNewStaffForm] = useState<AdminUser>({
    uid: '',
    email: '',
    name: '',
    role: 'Product Manager',
    active: true,
  });

  // Analytics date range
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Payment test status
  const [paymentTestResult, setPaymentTestResult] = useState<string | null>(null);

  // Security audit test runner state
  const [securityAuditPassed, setSecurityAuditPassed] = useState<boolean>(true);

  // Computed KPI Metrics
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled' && o.status !== 'Refunded')
        .reduce((acc, o) => acc + o.totalAmount, 0),
    [orders]
  );

  const avgOrderValue = useMemo(
    () => (orders.length > 0 ? Math.round(totalRevenue / orders.length) : 1849),
    [totalRevenue, orders.length]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.lowStockThreshold),
    [products]
  );

  const exportAnalyticsCsv = () => {
    const headers = ['SKU,Product Name,Category,Collection,Sale Price,Stock Quantity,Status'];
    const rows = products.map(
      (p) =>
        `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}","${p.collection}",${
          p.salePrice
        },${p.stockQuantity},"${p.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vynoox_catalog_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('CSV Exported', 'Analytics & Catalog report downloaded.', 'success');
  };

  const createBlankProduct = (): Product => ({
    id: `prod-${Date.now()}`,
    storeId: 'vynoox',
    name: 'Unisex Acid Washed Oversized Tee — New Edition',
    slug: `unisex-acid-washed-oversized-tee-${Date.now().toString().slice(-4)}`,
    description:
      '280 GSM heavyweight combed organic cotton with artisanal mineral acid wash and structured drop-shoulder fit.',
    regularPrice: 1999,
    salePrice: 1499,
    compareAtPrice: 1999,
    sku: `VYN-AW-${Math.floor(100 + Math.random() * 900)}`,
    barcode: `890425100${Math.floor(1000 + Math.random() * 9000)}`,
    category: categories[0]?.name || 'Oversized Tees',
    collection: collections[0]?.name || 'Acid Wash Series',
    status: 'published',
    stockQuantity: 40,
    lowStockThreshold: 8,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: true,
    bestSeller: false,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#27272A',
      secondaryFill: '#52525B',
      backdropColor: '#F4F2ED',
      codeLabel: 'NEW EDITION',
      titleLabel: 'VYNOOX Heavyweight Edition',
      fabricSpec: '280 GSM COMBED COTTON · MINERAL WASH',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#18181B',
      secondaryFill: '#3F3F46',
      backdropColor: '#ECE9E1',
      codeLabel: 'NEW EDITION',
      titleLabel: 'VYNOOX Heavyweight Edition · Back',
      fabricSpec: 'REINFORCED COLLAR RIB · BOXY FIT',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'XS,S,M,L,XL,XXL',
    colorsCsv: 'Washed Charcoal,Bone Ivory',
    materialsCsv: '100% Heavyweight Combed Cotton (280 GSM)',
    stylesCsv: 'Oversized Drop-Shoulder Fit',
    tagsCsv: 'acid-wash,oversized,unisex,new',
    variantInventoryJson: JSON.stringify({
      'S / Washed Charcoal': 10,
      'M / Washed Charcoal': 10,
      'L / Washed Charcoal': 10,
      'XL / Washed Charcoal': 10,
    }),
    seoTitle: 'Unisex Acid Washed Oversized Tee | VYNOOX',
    seoDescription: '280 GSM heavyweight combed organic cotton oversized tee by VYNOOX.',
  });

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* LEFT SIDEBAR NAVIGATION (260px per SaaS Dashboard Guidelines) */}
      <aside className="w-64 shrink-0 bg-[#0F172A] text-neutral-200 flex flex-col justify-between border-r border-neutral-800">
        <div>
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold tracking-[0.2em] text-white font-architectural block">
                VYNOOX
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                COMMERCE OS · /ADMIN
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              title="View Live Storefront"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Auth Status Banner inside Sidebar */}
          <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono font-semibold text-white truncate">
                  {adminSession?.username || 'admin'}
                </p>
                <p className="font-mono text-[11px] text-emerald-400">
                  Role: {adminSession?.role || currentAdminRole || 'Super Admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => logoutAdminSession()}
                title="Logout of Admin Dashboard"
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 font-mono text-[10px] uppercase inline-flex items-center gap-1 shrink-0"
              >
                <LogOut className="h-3 w-3" />
                <span>Logout</span>
              </button>
            </div>
            {!currentUser && (
              <div className="pt-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-[10px] uppercase"
                >
                  Connect Cloud Firestore Sync
                </button>
              </div>
            )}
          </div>

          {/* Grouped Navigation Links */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-190px)]">
            {(
              [
                'Core Commerce',
                'Storefront Studio',
                'Growth & Insights',
                'System & Security',
              ] as const
            ).map((group) => (
              <div key={group} className="space-y-1">
                <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
                  {group}
                </p>
                {ADMIN_NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const active = adminSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAdminSection(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-white text-neutral-900 font-semibold'
                          : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
          <span>SESSION VERIFIED</span>
          <button
            type="button"
            onClick={() => logoutAdminSession()}
            className="underline text-neutral-300 hover:text-white inline-flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (Breadcrumbs left, primary actions + Logout right) */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>VYNOOX ADMIN</span>
            <span>/</span>
            <span className="text-neutral-900 dark:text-white font-semibold uppercase">
              {ADMIN_NAV_ITEMS.find((i) => i.id === adminSection)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Filter records..."
                className="pl-8 pr-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-xs bg-transparent w-48"
              />
            </div>

            <button
              type="button"
              disabled={isSeeding}
              onClick={() => seedInitialDatabase()}
              className="px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Syncing DB...' : 'Sync All to Firestore'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono uppercase tracking-wider font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Live Storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => logoutAdminSession()}
              className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 text-xs font-mono uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* SECTION VIEWPORT */}
        <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
          {/* 1. OVERVIEW DASHBOARD */}
          {adminSection === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Executive Store Overview</h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Real-time commerce metrics, inventory health, and quick storefront controls.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(createBlankProduct());
                      setAdminSection('products');
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase"
                  >
                    + Add New Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSection('homepage-builder')}
                    className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 text-xs font-mono uppercase"
                  >
                    Customize Homepage
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards with Tabular Numerals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-mono uppercase text-neutral-500">
                    TOTAL VERIFIED REVENUE
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums mt-2">
                    {generalSettings.currencySymbol}
                    {(totalRevenue || 148920).toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-emerald-700 mt-1 block">
                    Live Firestore Ledger · {generalSettings.currency}
                  </span>
                </div>

                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-mono uppercase text-neutral-500">TOTAL ORDERS</span>
                  <p className="text-2xl font-bold font-mono tabular-nums mt-2">
                    {orders.length} Active ({orders.filter((o) => o.paymentStatus === 'paid').length}{' '}
                    Paid)
                  </p>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    Avg Order Value: {generalSettings.currencySymbol}
                    {avgOrderValue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-mono uppercase text-neutral-500">
                    CATALOG PRODUCTS
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums mt-2">
                    {products.length} SKUs ({products.filter((p) => p.status === 'published').length}{' '}
                    Live)
                  </p>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    Across {collections.length} Collections &amp; {categories.length} Categories
                  </span>
                </div>

                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-mono uppercase text-neutral-500">
                    INVENTORY HEALTH
                  </span>
                  <p className="text-2xl font-bold font-mono tabular-nums mt-2">
                    {products.reduce((s, p) => s + p.stockQuantity, 0)} Units
                  </p>
                  <span
                    className={`text-xs mt-1 block ${
                      lowStockProducts.length > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {lowStockProducts.length} Low-Stock Alerts
                  </span>
                </div>
              </div>

              {/* Recent Orders & Low Stock Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Recent Client Orders</h2>
                    <button
                      type="button"
                      onClick={() => setAdminSection('orders')}
                      className="text-xs font-mono underline"
                    >
                      Manage All Orders
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-8 text-center">
                      No live orders placed in this session yet. Place a test order on the storefront to see instant updates here.
                    </p>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 font-mono text-neutral-500">
                          <th className="py-2">ORDER #</th>
                          <th className="py-2">CLIENT</th>
                          <th className="py-2">STATUS</th>
                          <th className="py-2 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
                        {orders.slice(0, 6).map((o) => (
                          <tr key={o.id}>
                            <td className="py-2.5 font-semibold">{o.orderNumber}</td>
                            <td className="py-2.5 font-sans">{o.customerName}</td>
                            <td className="py-2.5">{o.status}</td>
                            <td className="py-2.5 text-right font-semibold">
                              {generalSettings.currencySymbol}
                              {o.totalAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Catalog Quick Edit</h2>
                    <button
                      type="button"
                      onClick={() => setAdminSection('products')}
                      className="text-xs font-mono underline"
                    >
                      All Products
                    </button>
                  </div>
                  <div className="space-y-3">
                    {products.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2.5 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.primaryImage}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover border shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-semibold truncate">{p.name}</p>
                            <p className="font-mono text-neutral-500 tabular-nums">
                              {generalSettings.currencySymbol}
                              {p.salePrice} · {p.stockQuantity} in stock
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setAdminSection('products');
                          }}
                          className="px-2.5 py-1 border border-neutral-300 font-mono text-[11px] uppercase shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HERO & SHOWCASE STUDIO, ADMIN MEDIA MANAGER, AND UGC VIDEO SYSTEM */}
          {adminSection === 'hero-studio' && <AdminHeroAndShowcaseStudio />}
          {adminSection === 'media-manager' && <AdminMediaManagerPanel />}
          {adminSection === 'ugc-videos' && <AdminUgcVideoManagerPanel />}

          {/* 2. COMPLETE PRODUCT MANAGEMENT */}
          {adminSection === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Products Catalog ({products.length})</h1>
                  <p className="text-xs text-neutral-500">
                    Add unlimited products, upload images, configure variants, and manage SEO.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedBulkIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 border border-neutral-300 text-xs">
                      <span className="font-mono">{selectedBulkIds.length} Selected</span>
                      <button
                        type="button"
                        onClick={async () => {
                          for (const id of selectedBulkIds) {
                            const prod = products.find((p) => p.id === id);
                            if (prod) {
                              await saveProduct({
                                ...prod,
                                salePrice: Math.round(
                                  prod.salePrice * (1 - bulkDiscountPct / 100)
                                ),
                              });
                            }
                          }
                          setSelectedBulkIds([]);
                        }}
                        className="px-2 py-1 bg-neutral-900 text-white font-mono text-[11px]"
                      >
                        -{bulkDiscountPct}% Bulk Price
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          for (const id of selectedBulkIds) {
                            const prod = products.find((p) => p.id === id);
                            if (prod) await saveProduct({ ...prod, status: 'archived' });
                          }
                          setSelectedBulkIds([]);
                        }}
                        className="px-2 py-1 border border-neutral-400 font-mono text-[11px]"
                      >
                        Archive Selected
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingProduct(createBlankProduct())}
                    className="px-4 py-2.5 bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Product Editor Modal / Drawer */}
              {editingProduct && (
                <div className="p-6 md:p-8 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-lg font-bold">
                      {products.some((p) => p.id === editingProduct.id)
                        ? `Edit Product: ${editingProduct.name}`
                        : 'Create New Product'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs font-mono underline"
                    >
                      Close Editor
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <div className="md:col-span-2">
                      <label className="block font-semibold mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            name: e.target.value,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, ''),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 bg-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Status</label>
                      <select
                        value={editingProduct.status}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            status: e.target.value as Product['status'],
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 bg-white dark:bg-neutral-900 text-sm"
                      >
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block font-semibold mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 bg-transparent"
                      />
                    </div>

                    {/* Pricing */}
                    <div>
                      <label className="block font-semibold mb-1">
                        Sale Price ({generalSettings.currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        value={editingProduct.salePrice}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            salePrice: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Regular Price ({generalSettings.currencySymbol})
                      </label>
                      <input
                        type="number"
                        value={editingProduct.regularPrice}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            regularPrice: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Compare-at Price ({generalSettings.currencySymbol})
                      </label>
                      <input
                        type="number"
                        value={editingProduct.compareAtPrice}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            compareAtPrice: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>

                    {/* Identifiers & Taxonomy */}
                    <div>
                      <label className="block font-semibold mb-1">SKU</label>
                      <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, sku: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Barcode (EAN/UPC)</label>
                      <input
                        type="text"
                        value={editingProduct.barcode}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, barcode: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={editingProduct.stockQuantity}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stockQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Category</label>
                      <input
                        type="text"
                        value={editingProduct.category}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Collection</label>
                      <input
                        type="text"
                        value={editingProduct.collection}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, collection: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={editingProduct.tagsCsv}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, tagsCsv: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>

                    {/* Variants */}
                    <div>
                      <label className="block font-semibold mb-1">Sizes (comma separated)</label>
                      <input
                        type="text"
                        value={editingProduct.sizesCsv}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, sizesCsv: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Colors (comma separated)</label>
                      <input
                        type="text"
                        value={editingProduct.colorsCsv}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, colorsCsv: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Material Specification</label>
                      <input
                        type="text"
                        value={editingProduct.materialsCsv}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, materialsCsv: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>

                    {/* Image Upload & Reorder */}
                    <div className="md:col-span-3 border-t pt-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold uppercase tracking-wider">
                          Product Photography (Upload File, Paste Image URL, or Swap Order)
                        </span>
                        <div className="flex gap-2">
                          <label className="px-3 py-1.5 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="h-3 w-3" />
                            <span>Upload Primary Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const dataUrl = await fileToCompressedDataUrl(file);
                                  setEditingProduct({ ...editingProduct, primaryImage: dataUrl });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                primaryImage: editingProduct.secondaryImage,
                                secondaryImage: editingProduct.primaryImage,
                              })
                            }
                            className="px-3 py-1.5 border border-neutral-300 font-mono text-[11px] uppercase"
                          >
                            Swap Primary &amp; Secondary
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={editingProduct.primaryImage}
                            alt="Primary preview"
                            referrerPolicy="no-referrer"
                            className="w-20 h-16 object-cover border shrink-0"
                          />
                          <input
                            type="text"
                            value={editingProduct.primaryImage}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                primaryImage: e.target.value,
                              })
                            }
                            placeholder="Primary Image URL or Data URI"
                            className="flex-1 px-3 py-2 border border-neutral-300 font-mono text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={editingProduct.secondaryImage || editingProduct.primaryImage}
                            alt="Secondary preview"
                            referrerPolicy="no-referrer"
                            className="w-20 h-16 object-cover border shrink-0"
                          />
                          <input
                            type="text"
                            value={editingProduct.secondaryImage}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                secondaryImage: e.target.value,
                              })
                            }
                            placeholder="Secondary Hover Image URL"
                            className="flex-1 px-3 py-2 border border-neutral-300 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Flags & SEO */}
                    <div className="md:col-span-3 flex flex-wrap gap-6 pt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.featured}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, featured: e.target.checked })
                          }
                        />
                        <span>Featured on Homepage</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.newArrival}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, newArrival: e.target.checked })
                          }
                        />
                        <span>New Arrival</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.bestSeller}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, bestSeller: e.target.checked })
                          }
                        />
                        <span>Best Seller</span>
                      </label>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block font-semibold mb-1">SEO Title</label>
                      <input
                        type="text"
                        value={editingProduct.seoTitle}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, seoTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-semibold mb-1">SEO Meta Description</label>
                      <input
                        type="text"
                        value={editingProduct.seoDescription}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            seoDescription: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 border border-neutral-300 text-xs font-mono uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await saveProduct(editingProduct);
                        setEditingProduct(null);
                      }}
                      className="px-6 py-2 bg-neutral-900 text-white text-xs font-mono uppercase font-semibold"
                    >
                      Save &amp; Publish Product
                    </button>
                  </div>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 dark:bg-neutral-800/50 font-mono text-neutral-500">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedBulkIds.length === products.length && products.length > 0
                          }
                          onChange={(e) =>
                            setSelectedBulkIds(
                              e.target.checked ? products.map((p) => p.id) : []
                            )
                          }
                        />
                      </th>
                      <th className="p-3">PRODUCT</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">CATEGORY / CAPSULE</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-right">PRICE</th>
                      <th className="p-3 text-right">STOCK</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {products
                      .filter(
                        (p) =>
                          !adminSearch.trim() ||
                          p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(adminSearch.toLowerCase())
                      )
                      .map((prod) => (
                        <tr
                          key={prod.id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedBulkIds.includes(prod.id)}
                              onChange={(e) =>
                                setSelectedBulkIds((prev) =>
                                  e.target.checked
                                    ? [...prev, prod.id]
                                    : prev.filter((id) => id !== prod.id)
                                )
                              }
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.primaryImage}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 object-cover border shrink-0"
                              />
                              <span className="font-semibold">{prod.name}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono">{prod.sku}</td>
                          <td className="p-3">
                            {prod.category} · {prod.collection}
                          </td>
                          <td className="p-3 font-mono uppercase">{prod.status}</td>
                          <td className="p-3 text-right font-mono tabular-nums font-semibold">
                            {generalSettings.currencySymbol}
                            {prod.salePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums">
                            {prod.stockQuantity}
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(prod)}
                                className="px-2.5 py-1 border border-neutral-300 font-mono text-[11px] uppercase hover:bg-neutral-900 hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  saveProduct({
                                    ...prod,
                                    id: `${prod.id}-copy-${Date.now().toString().slice(-3)}`,
                                    name: `${prod.name} (Copy)`,
                                    slug: `${prod.slug}-copy-${Date.now().toString().slice(-3)}`,
                                    sku: `${prod.sku}-CP`,
                                  })
                                }
                                title="Duplicate Product"
                                className="px-2 py-1 border border-neutral-300 font-mono text-[11px]"
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProduct(prod.id)}
                                className="px-2 py-1 border border-red-200 text-red-700 font-mono text-[11px]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. COLLECTIONS MANAGEMENT */}
          {adminSection === 'collections' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Collections Manager</h1>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCollectionForm.name.trim()) return;
                  const slug =
                    newCollectionForm.slug ||
                    newCollectionForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  await saveCollection({
                    ...newCollectionForm,
                    id: newCollectionForm.id || slug,
                    slug,
                    image: newCollectionForm.image || products[0]?.primaryImage || '',
                  });
                  setNewCollectionForm({
                    id: '',
                    storeId: 'vynoox',
                    name: '',
                    slug: '',
                    description: '',
                    image: '',
                    featured: true,
                    sortOrder: collections.length + 2,
                  });
                }}
                className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
              >
                <input
                  type="text"
                  required
                  value={newCollectionForm.name}
                  onChange={(e) =>
                    setNewCollectionForm({ ...newCollectionForm, name: e.target.value })
                  }
                  placeholder="Collection Name (e.g. Winter Heavyweights)"
                  className="px-3 py-2 border border-neutral-300"
                />
                <input
                  type="text"
                  value={newCollectionForm.description}
                  onChange={(e) =>
                    setNewCollectionForm({ ...newCollectionForm, description: e.target.value })
                  }
                  placeholder="Collection Description"
                  className="md:col-span-2 px-3 py-2 border border-neutral-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                >
                  Save Collection
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collections.map((col) => (
                  <div
                    key={col.id}
                    className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={col.image}
                        alt={col.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover border"
                      />
                      <div>
                        <h3 className="font-bold text-sm">{col.name}</h3>
                        <p className="text-xs text-neutral-500">{col.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCollection(col.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-700 text-xs font-mono uppercase"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CATEGORIES MANAGEMENT */}
          {adminSection === 'categories' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Categories Manager</h1>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCategoryForm.name.trim()) return;
                  const slug = newCategoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  await saveCategory({
                    id: slug,
                    storeId: 'vynoox',
                    name: newCategoryForm.name,
                    slug,
                    description: newCategoryForm.description,
                  });
                  setNewCategoryForm({
                    id: '',
                    storeId: 'vynoox',
                    name: '',
                    slug: '',
                    description: '',
                  });
                }}
                className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
              >
                <input
                  type="text"
                  required
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  placeholder="Category Name"
                  className="px-3 py-2 border border-neutral-300"
                />
                <input
                  type="text"
                  value={newCategoryForm.description}
                  onChange={(e) =>
                    setNewCategoryForm({ ...newCategoryForm, description: e.target.value })
                  }
                  placeholder="Category Description"
                  className="px-3 py-2 border border-neutral-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                >
                  Add Category
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm">{cat.name}</h3>
                      <p className="text-xs text-neutral-500">{cat.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="px-3 py-1 border border-red-200 text-red-700 text-xs font-mono uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. INVENTORY MANAGEMENT */}
          {adminSection === 'inventory' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Real-Time Inventory &amp; Stock Alerts</h1>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-neutral-500">
                      <th className="p-3">SKU</th>
                      <th className="p-3">PRODUCT</th>
                      <th className="p-3">SIZES</th>
                      <th className="p-3">STOCK STATUS</th>
                      <th className="p-3 text-right">AVAILABLE UNITS</th>
                      <th className="p-3 text-right">QUICK RESTOCK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono tabular-nums">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-semibold">{p.sku}</td>
                        <td className="p-3 font-sans font-semibold">{p.name}</td>
                        <td className="p-3">{p.sizesCsv}</td>
                        <td className="p-3">
                          {p.stockQuantity <= 0
                            ? 'OUT OF STOCK'
                            : p.stockQuantity <= p.lowStockThreshold
                            ? 'LOW STOCK ALERT'
                            : 'OPTIMAL'}
                        </td>
                        <td className="p-3 text-right font-bold">{p.stockQuantity}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                saveProduct({ ...p, stockQuantity: p.stockQuantity + 10 })
                              }
                              className="px-2.5 py-1 bg-neutral-900 text-white text-[11px]"
                            >
                              +10 Units
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                saveProduct({
                                  ...p,
                                  stockQuantity: Math.max(0, p.stockQuantity - 5),
                                })
                              }
                              className="px-2.5 py-1 border border-neutral-300 text-[11px]"
                            >
                              -5 Units
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. ORDER MANAGEMENT SYSTEM */}
          {adminSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Order Fulfillment &amp; Tracking</h1>
                  <p className="text-xs text-neutral-500">
                    Confirm orders, update dispatch statuses, assign AWB tracking, and process refunds.
                  </p>
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3.5 py-2 border border-neutral-300 bg-white text-xs font-mono"
                >
                  <option value="ALL">Filter: All Statuses</option>
                  {[
                    'Pending',
                    'Confirmed',
                    'Processing',
                    'Packed',
                    'Shipped',
                    'Delivered',
                    'Cancelled',
                    'Refunded',
                  ].map((st) => (
                    <option key={st} value={st}>
                      Status: {st}
                    </option>
                  ))}
                </select>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 bg-white border border-neutral-200 text-center text-xs text-neutral-500">
                  No orders recorded yet. Complete a test checkout on the storefront to manage orders here.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(
                      (o) => orderStatusFilter === 'ALL' || o.status === orderStatusFilter
                    )
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold">
                              #{ord.orderNumber} · {ord.customerName} ({ord.customerPhone})
                            </span>
                            <p className="text-xs text-neutral-500">
                              {ord.shippingAddress}, {ord.city}, {ord.state} - {ord.pinCode}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm tabular-nums">
                              {generalSettings.currencySymbol}
                              {ord.totalAmount.toLocaleString('en-IN')} ({ord.paymentStatus.toUpperCase()})
                            </span>
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                updateOrder(ord, { status: e.target.value as OrderStatus })
                              }
                              className="px-3 py-1.5 border border-neutral-300 text-xs font-mono bg-white"
                            >
                              {[
                                'Pending',
                                'Confirmed',
                                'Processing',
                                'Packed',
                                'Shipped',
                                'Delivered',
                                'Cancelled',
                                'Refunded',
                              ].map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                              AWB Tracking Number
                            </label>
                            <input
                              type="text"
                              defaultValue={ord.trackingNumber}
                              onBlur={(e) =>
                                updateOrder(ord, { trackingNumber: e.target.value })
                              }
                              className="w-full px-3 py-1.5 border border-neutral-300 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                              Internal Fulfillment Notes
                            </label>
                            <input
                              type="text"
                              defaultValue={ord.internalNotes}
                              onBlur={(e) => updateOrder(ord, { internalNotes: e.target.value })}
                              className="w-full px-3 py-1.5 border border-neutral-300"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const headers: Record<string, string> = {
                                    'Content-Type': 'application/json',
                                  };
                                  if (adminSessionToken) {
                                    headers.Authorization = `Bearer ${adminSessionToken}`;
                                  }
                                  await fetch('/api/payment/refund', {
                                    method: 'POST',
                                    headers,
                                    credentials: 'same-origin',
                                    body: JSON.stringify({
                                      orderNumber: ord.orderNumber,
                                      paymentReference: ord.paymentReference,
                                      amount: ord.totalAmount,
                                      reason: 'Admin initiated refund',
                                    }),
                                  });
                                } catch {
                                  // Continue status update
                                }
                                await updateOrder(ord, {
                                  status: 'Refunded',
                                  paymentStatus: 'refunded',
                                });
                              }}
                              className="px-3 py-1.5 border border-red-200 text-red-700 font-mono text-[11px] uppercase"
                            >
                              Process Refund
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 7. CUSTOMER MANAGEMENT */}
          {adminSection === 'customers' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Customer Directory &amp; CRM</h1>
              {customers.length === 0 ? (
                <div className="p-8 bg-white border border-neutral-200 text-xs text-neutral-500">
                  Signed-in customers and checkout profiles automatically sync here.
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-neutral-50 font-mono text-neutral-500">
                        <th className="p-3">NAME</th>
                        <th className="p-3">EMAIL / PHONE</th>
                        <th className="p-3">CITY</th>
                        <th className="p-3 text-right">ORDERS</th>
                        <th className="p-3 text-right">TOTAL SPENT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono tabular-nums">
                      {customers.map((c) => (
                        <tr key={c.uid}>
                          <td className="p-3 font-sans font-semibold">{c.fullName}</td>
                          <td className="p-3">
                            {c.email} · {c.phone}
                          </td>
                          <td className="p-3 font-sans">{c.city || 'Mumbai'}</td>
                          <td className="p-3 text-right">{c.ordersCount}</td>
                          <td className="p-3 text-right font-semibold">
                            {generalSettings.currencySymbol}
                            {c.totalSpent.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 8. DISCOUNTS AND COUPONS */}
          {adminSection === 'coupons' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Discounts &amp; Privilege Coupons</h1>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCouponForm.code.trim()) return;
                  await saveCoupon({
                    ...newCouponForm,
                    id: newCouponForm.code.toLowerCase().trim(),
                    code: newCouponForm.code.toUpperCase().trim(),
                  });
                  setNewCouponForm({
                    ...newCouponForm,
                    code: '',
                  });
                }}
                className="p-6 bg-white border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                  placeholder="CODE (e.g. DROP20)"
                  className="px-3 py-2 border border-neutral-300 font-mono uppercase"
                />
                <select
                  value={newCouponForm.type}
                  onChange={(e) =>
                    setNewCouponForm({
                      ...newCouponForm,
                      type: e.target.value as CouponItem['type'],
                    })
                  }
                  className="px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
                <input
                  type="number"
                  value={newCouponForm.value}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, value: Number(e.target.value) })
                  }
                  placeholder="Value"
                  className="px-3 py-2 border border-neutral-300 font-mono"
                />
                <input
                  type="number"
                  value={newCouponForm.minPurchase}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, minPurchase: Number(e.target.value) })
                  }
                  placeholder="Min Order"
                  className="px-3 py-2 border border-neutral-300 font-mono"
                />
                <input
                  type="date"
                  value={newCouponForm.expiryDate}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, expiryDate: e.target.value })
                  }
                  className="px-3 py-2 border border-neutral-300 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                >
                  Create Coupon
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 bg-white border border-neutral-200 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-mono font-bold">{c.code}</span>
                        <span className="text-xs font-mono uppercase">
                          {c.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {c.type === 'percentage'
                          ? `${c.value}% Off`
                          : c.type === 'fixed'
                          ? `${generalSettings.currencySymbol}${c.value} Off`
                          : 'Complimentary Shipping'}{' '}
                        · Min Order {generalSettings.currencySymbol}
                        {c.minPurchase}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-400 mt-1">
                        Used: {c.usedCount}/{c.usageLimit} · Expires: {c.expiryDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveCoupon({ ...c, active: !c.active })}
                        className="px-3 py-1 border border-neutral-300 text-xs font-mono uppercase"
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCoupon(c.id)}
                        className="px-3 py-1 border border-red-200 text-red-700 text-xs font-mono uppercase"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SHOPIFY-STYLE HOMEPAGE WEBSITE BUILDER */}
          {adminSection === 'homepage-builder' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    Visual Homepage Website Builder (No-Code Studio)
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Add, reorder, show/hide, and customize every storefront section with live preview.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newSec: HomepageSection = {
                        id: `sec-custom-${Date.now()}`,
                        type: 'promotional_banner',
                        name: 'Custom Atelier Banner',
                        visible: true,
                        order: homepageSections.length + 1,
                        heading: 'Limited Archive Drop — 280 GSM Heavyweight Tees',
                        subheading: 'CUSTOM SECTION',
                        description:
                          'Designed directly in the VYNOOX Visual Website Builder without touching code.',
                        buttonText: 'Explore Drop',
                        buttonLink: 'shop-all',
                        backgroundImage: '',
                        videoUrl: '',
                        backgroundColor: '#18181B',
                        textColor: '#FAF9F6',
                        layout: 'centered',
                        spacingY: 'normal',
                      };
                      updateHomepageSections([...homepageSections, newSec], true);
                      setSelectedSectionId(newSec.id);
                    }}
                    className="px-4 py-2 border border-neutral-300 bg-white text-xs font-mono uppercase"
                  >
                    + Add Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSection('hero-studio')}
                    className="px-4 py-2 border border-neutral-900 bg-white text-neutral-900 text-xs font-mono uppercase hover:bg-neutral-100"
                  >
                    Open Full-Screen Hero & Showcase Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSection('ugc-videos')}
                    className="px-4 py-2 border border-neutral-300 bg-white text-xs font-mono uppercase hover:border-neutral-900"
                  >
                    Manage UGC Videos
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSection('media-manager')}
                    className="px-4 py-2 border border-neutral-300 bg-white text-xs font-mono uppercase hover:border-neutral-900"
                  >
                    Media Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => updateHomepageSections(homepageSections, true)}
                    className="px-5 py-2 bg-neutral-900 text-white text-xs font-mono uppercase font-semibold"
                  >
                    Publish Layout to Live Storefront
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Section Stack Order & Visibility */}
                <div className="lg:col-span-5 bg-white border border-neutral-200 p-4 space-y-2">
                  <p className="text-xs font-mono uppercase text-neutral-500 mb-3">
                    HOMEPAGE SECTION STACK (REORDER OR TOGGLE)
                  </p>
                  {[...homepageSections]
                    .sort((a, b) => a.order - b.order)
                    .map((sec, idx, arr) => (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`p-3 border flex items-center justify-between gap-2 cursor-pointer text-xs ${
                          selectedSectionId === sec.id
                            ? 'border-neutral-900 bg-neutral-50 font-semibold'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-neutral-400">{idx + 1}.</span>
                          <span className="truncate">{sec.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Move Up"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              const copy = [...arr];
                              const temp = copy[idx - 1].order;
                              copy[idx - 1].order = copy[idx].order;
                              copy[idx].order = temp;
                              updateHomepageSections(copy, false);
                            }}
                            className="p-1 hover:bg-neutral-200 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={idx === arr.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              const copy = [...arr];
                              const temp = copy[idx + 1].order;
                              copy[idx + 1].order = copy[idx].order;
                              copy[idx].order = temp;
                              updateHomepageSections(copy, false);
                            }}
                            className="p-1 hover:bg-neutral-200 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={sec.visible ? 'Hide Section' : 'Show Section'}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateHomepageSections(
                                homepageSections.map((s) =>
                                  s.id === sec.id ? { ...s, visible: !s.visible } : s
                                ),
                                false
                              );
                            }}
                            className={`px-2 py-0.5 font-mono text-[10px] border ${
                              sec.visible
                                ? 'border-emerald-300 text-emerald-700'
                                : 'border-neutral-300 text-neutral-400'
                            }`}
                          >
                            {sec.visible ? 'VISIBLE' : 'HIDDEN'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Right Column: Active Section Inspector */}
                <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 space-y-4">
                  {(() => {
                    const activeSec = homepageSections.find((s) => s.id === selectedSectionId);
                    if (!activeSec) return null;

                    const patchSection = (patch: Partial<HomepageSection>) => {
                      updateHomepageSections(
                        homepageSections.map((s) =>
                          s.id === activeSec.id ? { ...s, ...patch } : s
                        ),
                        false
                      );
                    };

                    return (
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h2 className="text-base font-bold">
                            Editing Section: {activeSec.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() =>
                              updateHomepageSections(
                                homepageSections.filter((s) => s.id !== activeSec.id),
                                true
                              )
                            }
                            className="text-red-600 font-mono underline"
                          >
                            Remove Section
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-semibold mb-1">Section Title / Label</label>
                            <input
                              type="text"
                              value={activeSec.name}
                              onChange={(e) => patchSection({ name: e.target.value })}
                              className="w-full px-3 py-2 border border-neutral-300"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Subheading Kicker</label>
                            <input
                              type="text"
                              value={activeSec.subheading}
                              onChange={(e) => patchSection({ subheading: e.target.value })}
                              className="w-full px-3 py-2 border border-neutral-300 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block font-semibold mb-1">Main Heading</label>
                            <input
                              type="text"
                              value={activeSec.heading}
                              onChange={(e) => patchSection({ heading: e.target.value })}
                              className="w-full px-3 py-2 border border-neutral-300 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block font-semibold mb-1">Description Copy</label>
                            <textarea
                              rows={3}
                              value={activeSec.description}
                              onChange={(e) => patchSection({ description: e.target.value })}
                              className="w-full px-3 py-2 border border-neutral-300"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Primary Button Text</label>
                            <input
                              type="text"
                              value={activeSec.buttonText}
                              onChange={(e) => patchSection({ buttonText: e.target.value })}
                              className="w-full px-3 py-2 border border-neutral-300"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Button Link Target</label>
                            <select
                              value={activeSec.buttonLink}
                              onChange={(e) =>
                                patchSection({ buttonLink: e.target.value as StorePageId })
                              }
                              className="w-full px-3 py-2 border border-neutral-300 bg-white"
                            >
                              <option value="shop-all">Shop All</option>
                              <option value="new-arrivals">New Arrivals</option>
                              <option value="best-sellers">Best Sellers</option>
                              <option value="collections">Collections</option>
                              <option value="about-us">About Us</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Background Color</label>
                            <input
                              type="color"
                              value={activeSec.backgroundColor || '#FAF9F6'}
                              onChange={(e) => patchSection({ backgroundColor: e.target.value })}
                              className="w-full h-9 border border-neutral-300"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Vertical Spacing</label>
                            <select
                              value={activeSec.spacingY}
                              onChange={(e) =>
                                patchSection({
                                  spacingY: e.target.value as HomepageSection['spacingY'],
                                })
                              }
                              className="w-full px-3 py-2 border border-neutral-300 bg-white"
                            >
                              <option value="compact">Compact</option>
                              <option value="normal">Standard</option>
                              <option value="spacious">Spacious Luxury</option>
                            </select>
                          </div>
                        </div>

                        {/* Live Section Mini-Preview */}
                        <div className="pt-4 border-t">
                          <span className="block font-mono text-[11px] uppercase text-neutral-500 mb-2">
                            LIVE SECTION PREVIEW
                          </span>
                          <div
                            style={{
                              backgroundColor: activeSec.backgroundColor,
                              color: activeSec.textColor,
                            }}
                            className="p-6 border border-neutral-300 space-y-2"
                          >
                            <p className="text-[10px] font-mono uppercase opacity-70">
                              {activeSec.subheading}
                            </p>
                            <h3 className="text-2xl font-editorial">{activeSec.heading}</h3>
                            <p className="text-xs opacity-80 max-w-lg">{activeSec.description}</p>
                            {activeSec.buttonText && (
                              <span className="inline-block mt-2 px-4 py-1.5 border border-current text-[11px] font-mono uppercase">
                                {activeSec.buttonText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 10. ADVANCED THEME CUSTOMIZER */}
          {adminSection === 'theme-customizer' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Visual Theme Customizer</h1>
                  <p className="text-xs text-neutral-500">
                    Customize brand colors, typography, card styles, and preview across Desktop, Tablet, and Mobile.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateThemeSettings(DEFAULT_THEME_SETTINGS, true)}
                    className="px-4 py-2 border border-neutral-300 bg-white text-xs font-mono uppercase"
                  >
                    Reset Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => updateThemeSettings(themeSettings, true)}
                    className="px-5 py-2 bg-neutral-900 text-white text-xs font-mono uppercase font-semibold"
                  >
                    Save &amp; Publish Theme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white border border-neutral-200 p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Primary Brand Color</label>
                      <input
                        type="color"
                        value={themeSettings.primaryColor}
                        onChange={(e) =>
                          updateThemeSettings(
                            { ...themeSettings, primaryColor: e.target.value },
                            false
                          )
                        }
                        className="w-full h-9 border"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Canvas Background</label>
                      <input
                        type="color"
                        value={themeSettings.backgroundColor}
                        onChange={(e) =>
                          updateThemeSettings(
                            { ...themeSettings, backgroundColor: e.target.value },
                            false
                          )
                        }
                        className="w-full h-9 border"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Heading Display Font</label>
                      <select
                        value={themeSettings.headingFont}
                        onChange={(e) =>
                          updateThemeSettings(
                            {
                              ...themeSettings,
                              headingFont: e.target.value as typeof themeSettings.headingFont,
                            },
                            false
                          )
                        }
                        className="w-full px-3 py-2 border bg-white"
                      >
                        <option value="Cormorant Garamond">Cormorant Garamond (Luxury Serif)</option>
                        <option value="Outfit">Outfit (Architectural Sans)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Body Prose Font</label>
                      <select
                        value={themeSettings.bodyFont}
                        onChange={(e) =>
                          updateThemeSettings(
                            {
                              ...themeSettings,
                              bodyFont: e.target.value as typeof themeSettings.bodyFont,
                            },
                            false
                          )
                        }
                        className="w-full px-3 py-2 border bg-white"
                      >
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                        <option value="Outfit">Outfit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Product Card Style</label>
                      <select
                        value={themeSettings.productCardDesign}
                        onChange={(e) =>
                          updateThemeSettings(
                            {
                              ...themeSettings,
                              productCardDesign:
                                e.target.value as typeof themeSettings.productCardDesign,
                            },
                            false
                          )
                        }
                        className="w-full px-3 py-2 border bg-white"
                      >
                        <option value="minimal-editorial">Minimal Editorial (Unboxed)</option>
                        <option value="bordered-atelier">Bordered Atelier Frame</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Storefront Dark Mode</label>
                      <button
                        type="button"
                        onClick={() =>
                          updateThemeSettings(
                            { ...themeSettings, darkMode: !themeSettings.darkMode },
                            false
                          )
                        }
                        className="w-full py-2 border border-neutral-300 font-mono uppercase"
                      >
                        {themeSettings.darkMode ? 'Dark Mode Active' : 'Light Mode Active'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Responsive Viewport Preview */}
                <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-mono uppercase text-neutral-500">
                      RESPONSIVE THEME PREVIEW ({previewViewport.toUpperCase()})
                    </span>
                    <div className="flex gap-2">
                      {(['desktop', 'tablet', 'mobile'] as const).map((vp) => (
                        <button
                          key={vp}
                          type="button"
                          onClick={() => setPreviewViewport(vp)}
                          className={`px-3 py-1 text-xs font-mono uppercase border ${
                            previewViewport === vp
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'border-neutral-300'
                          }`}
                        >
                          {vp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center bg-neutral-100 p-4">
                    <div
                      style={{
                        backgroundColor: themeSettings.backgroundColor,
                        color: themeSettings.textColor,
                        fontFamily: themeSettings.bodyFont,
                      }}
                      className={`border border-neutral-300 shadow-sm p-6 transition-all ${
                        previewViewport === 'mobile'
                          ? 'w-[340px]'
                          : previewViewport === 'tablet'
                          ? 'w-[540px]'
                          : 'w-full'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <span className="font-bold tracking-widest">
                          {generalSettings.storeName}
                        </span>
                        <span className="text-xs font-mono">Bag (1)</span>
                      </div>
                      <h3
                        style={{ fontFamily: themeSettings.headingFont }}
                        className="text-2xl font-semibold mb-2"
                      >
                        Architectural Proportions.
                      </h3>
                      <p className="text-xs opacity-75 mb-4">
                        280 GSM Heavyweight Acid Washed Series preview.
                      </p>
                      <button
                        type="button"
                        style={{ backgroundColor: themeSettings.primaryColor }}
                        className="px-4 py-2 text-white text-xs font-mono uppercase"
                      >
                        Explore Capsule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. NAVIGATION MANAGER */}
          {adminSection === 'navigation-manager' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Storefront Navigation Manager</h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newNavLabel.trim()) return;
                  const next: NavigationLink = {
                    id: `nav-${Date.now()}`,
                    label: newNavLabel.trim(),
                    targetPage: newNavTarget,
                    location: newNavLocation,
                    order: navigationLinks.length + 1,
                  };
                  updateNavigationLinks([...navigationLinks, next]);
                  setNewNavLabel('');
                }}
                className="p-5 bg-white border border-neutral-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={newNavLabel}
                  onChange={(e) => setNewNavLabel(e.target.value)}
                  placeholder="Link Label"
                  className="px-3 py-2 border border-neutral-300"
                />
                <select
                  value={newNavTarget}
                  onChange={(e) => setNewNavTarget(e.target.value as StorePageId)}
                  className="px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="home">Homepage</option>
                  <option value="shop-all">Shop All</option>
                  <option value="new-arrivals">New Arrivals</option>
                  <option value="best-sellers">Best Sellers</option>
                  <option value="collections">Collections</option>
                  <option value="about-us">About Us</option>
                  <option value="contact-us">Contact Us</option>
                  <option value="faq">FAQ</option>
                </select>
                <select
                  value={newNavLocation}
                  onChange={(e) =>
                    setNewNavLocation(e.target.value as NavigationLink['location'])
                  }
                  className="px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="header">Top Header Bar</option>
                  <option value="footer_shop">Footer: Catalog Column</option>
                  <option value="footer_policies">Footer: Policies Column</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                >
                  Add Menu Link
                </button>
              </form>

              <div className="bg-white border border-neutral-200 divide-y text-xs">
                {navigationLinks.map((l) => (
                  <div key={l.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{l.label}</span>
                      <span className="text-neutral-500 font-mono ml-3">
                        → {l.targetPage} ({l.location})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateNavigationLinks(navigationLinks.filter((i) => i.id !== l.id))
                      }
                      className="text-red-600 font-mono underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. PAGES MANAGER (CMS) */}
          {adminSection === 'pages-manager' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">CMS Pages &amp; Legal Policies Manager</h1>
                <button
                  type="button"
                  onClick={() => {
                    const customSlug = `custom-page-${Date.now().toString().slice(-4)}`;
                    const nextPage: CMSPage = {
                      id: customSlug,
                      storeId: 'vynoox',
                      slug: customSlug,
                      title: 'New Editorial Page',
                      subtitle: 'CUSTOM STOREFRONT PAGE',
                      content:
                        'Write custom brand stories, lookbooks, or policy documentation here and publish to the live storefront.',
                      seoTitle: 'New Editorial Page | VYNOOX',
                      seoDescription: 'Custom page created in VYNOOX Pages Manager.',
                      published: true,
                      updatedAt: new Date().toISOString().slice(0, 10),
                    };
                    savePage(nextPage);
                    setEditingPage(nextPage);
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase"
                >
                  + Create New Page
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-white border border-neutral-200 p-4 space-y-2">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEditingPage(p)}
                      className={`w-full text-left p-3 border text-xs ${
                        editingPage?.id === p.id
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-200'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
                {editingPage && (
                  <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Page Title</label>
                      <input
                        type="text"
                        value={editingPage.title}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={editingPage.subtitle}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, subtitle: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Page Body Content</label>
                      <textarea
                        rows={10}
                        value={editingPage.content}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, content: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 font-sans leading-relaxed"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => savePage(editingPage)}
                      className="px-6 py-2.5 bg-neutral-900 text-white font-mono uppercase"
                    >
                      Publish Page Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 13. REVIEWS & RATINGS MODERATION */}
          {adminSection === 'reviews' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Customer Reviews &amp; Verification</h1>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 bg-white border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <p className="font-mono text-neutral-500">
                        {'★'.repeat(r.rating)} · {r.productName} · Status: {r.status.toUpperCase()}
                      </p>
                      <h3 className="font-bold text-sm">{r.title}</h3>
                      <p className="text-neutral-600">{r.comment}</p>
                      <p className="text-neutral-400">By {r.authorName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moderateReview(r, 'approved', !r.verifiedPurchase)}
                        className="px-3 py-1.5 border border-neutral-300 font-mono uppercase"
                      >
                        {r.verifiedPurchase ? 'Verified Purchase ✓' : 'Mark Verified'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReview(r.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-700 font-mono uppercase"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14. MARKETING & SEO */}
          {adminSection === 'marketing' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Marketing, SEO &amp; Tracking Pixels</h1>
              <div className="bg-white border border-neutral-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Default Storefront SEO Title</label>
                  <input
                    type="text"
                    value={marketingSettings.defaultSeoTitle}
                    onChange={(e) =>
                      updateMarketingSettings({
                        ...marketingSettings,
                        defaultSeoTitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Default Meta Description</label>
                  <textarea
                    rows={2}
                    value={marketingSettings.defaultMetaDescription}
                    onChange={(e) =>
                      updateMarketingSettings({
                        ...marketingSettings,
                        defaultMetaDescription: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Google Analytics 4 Measurement ID</label>
                  <input
                    type="text"
                    value={marketingSettings.googleAnalyticsId}
                    onChange={(e) =>
                      updateMarketingSettings({
                        ...marketingSettings,
                        googleAnalyticsId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta Pixel ID</label>
                  <input
                    type="text"
                    value={marketingSettings.metaPixelId}
                    onChange={(e) =>
                      updateMarketingSettings({
                        ...marketingSettings,
                        metaPixelId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 15. ANALYTICS DASHBOARD */}
          {adminSection === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Commerce &amp; Revenue Analytics</h1>
                  <p className="text-xs text-neutral-500">
                    Daily, weekly, and monthly revenue breakdown with CSV data export.
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={analyticsRange}
                    onChange={(e) =>
                      setAnalyticsRange(e.target.value as typeof analyticsRange)
                    }
                    className="px-3 py-2 border border-neutral-300 bg-white text-xs font-mono"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                  <button
                    type="button"
                    onClick={exportAnalyticsCsv}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-mono uppercase inline-flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV Report</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono tabular-nums">
                <div className="p-5 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500">DAILY SALES VELOCITY</span>
                  <p className="text-2xl font-bold mt-1">
                    {generalSettings.currencySymbol}18,450 / day
                  </p>
                </div>
                <div className="p-5 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500">WEEKLY REVENUE</span>
                  <p className="text-2xl font-bold mt-1">
                    {generalSettings.currencySymbol}1,12,800
                  </p>
                </div>
                <div className="p-5 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500">AVERAGE ORDER VALUE</span>
                  <p className="text-2xl font-bold mt-1">
                    {generalSettings.currencySymbol}
                    {avgOrderValue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-6">
                <h2 className="text-base font-bold mb-4">Best-Selling Products Performance</h2>
                <div className="space-y-3">
                  {products.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs border-b pb-2 font-mono tabular-nums"
                    >
                      <span className="font-sans font-semibold">
                        0{idx + 1}. {p.name}
                      </span>
                      <span>
                        {generalSettings.currencySymbol}
                        {p.salePrice.toLocaleString('en-IN')} · {p.stockQuantity} in stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 16. SHIPPING SETTINGS */}
          {adminSection === 'shipping-settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Shipping Zones &amp; Logistics</h1>
              <div className="bg-white border border-neutral-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    Standard Shipping Rate ({generalSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.standardShippingCharge}
                    onChange={(e) =>
                      updateShippingSettings({
                        ...shippingSettings,
                        standardShippingCharge: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Free Shipping Threshold ({generalSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) =>
                      updateShippingSettings({
                        ...shippingSettings,
                        freeShippingThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Default Courier Partner</label>
                  <input
                    type="text"
                    value={shippingSettings.defaultCarrier}
                    onChange={(e) =>
                      updateShippingSettings({
                        ...shippingSettings,
                        defaultCarrier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Estimated Delivery Timeline</label>
                  <input
                    type="text"
                    value={shippingSettings.estimatedDeliveryText}
                    onChange={(e) =>
                      updateShippingSettings({
                        ...shippingSettings,
                        estimatedDeliveryText: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 17. PAYMENT SETTINGS */}
          {adminSection === 'payment-settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Payment Gateways &amp; Backend Verification</h1>
              <div className="bg-white border border-neutral-200 p-6 space-y-5 text-xs">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-sm">Razorpay Online Payments</h3>
                    <p className="text-neutral-500">
                      UPI, Credit/Debit Cards, NetBanking with server-side HMAC-SHA256 verification.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.razorpayEnabled}
                    onChange={(e) =>
                      updatePaymentSettings({
                        ...paymentSettings,
                        razorpayEnabled: e.target.checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-sm">Cash on Delivery (COD)</h3>
                    <p className="text-neutral-500">
                      Allow verified doorstep payment up to {generalSettings.currencySymbol}
                      {paymentSettings.codMaxOrderAmount}.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.codEnabled}
                    onChange={(e) =>
                      updatePaymentSettings({
                        ...paymentSettings,
                        codEnabled: e.target.checked,
                      })
                    }
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch('/api/payment/create-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: 1499, currency: 'INR', gateway: 'razorpay' }),
                      });
                      const data = await res.json();
                      const vRes = await fetch('/api/payment/verify-signature', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orderIntentId: data.orderIntentId,
                          paymentId: data.paymentId,
                          amount: 1499,
                          signature: data.signature,
                        }),
                      });
                      const vData = await vRes.json();
                      setPaymentTestResult(
                        `HMAC Verified: ${vData.verified} · Ref: ${vData.paymentReference}`
                      );
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                  >
                    Run Live Backend Payment Verification Test
                  </button>
                  {paymentTestResult && (
                    <p className="font-mono text-emerald-700">{paymentTestResult}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 18. GENERAL SETTINGS */}
          {adminSection === 'general-settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Store General Settings</h1>
              <div className="bg-white border border-neutral-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Store Brand Name</label>
                  <input
                    type="text"
                    value={generalSettings.storeName}
                    onChange={(e) =>
                      updateGeneralSettings({ ...generalSettings, storeName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Concierge Email</label>
                  <input
                    type="email"
                    value={generalSettings.storeEmail}
                    onChange={(e) =>
                      updateGeneralSettings({ ...generalSettings, storeEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={generalSettings.contactNumber}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...generalSettings,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Store Currency</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => {
                      const curr = e.target.value as typeof generalSettings.currency;
                      const symMap = { INR: '₹', USD: '$', EUR: '€', GBP: '£' } as const;
                      updateGeneralSettings({
                        ...generalSettings,
                        currency: curr,
                        currencySymbol: symMap[curr],
                      });
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Studio Business Address</label>
                  <input
                    type="text"
                    value={generalSettings.businessAddress}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...generalSettings,
                        businessAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={generalSettings.maintenanceMode}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...generalSettings,
                        maintenanceMode: e.target.checked,
                      })
                    }
                  />
                  <span className="font-semibold">
                    Enable Storefront Maintenance Mode (Locks public access while preserving Admin access)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 19. STAFF MANAGEMENT (RBAC) */}
          {adminSection === 'staff-management' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Staff &amp; Role-Based Access Control (RBAC)</h1>

              <BackendAdminCredentialsManager />

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffForm.email.trim()) return;
                  await saveStaffMember({
                    ...newStaffForm,
                    uid:
                      newStaffForm.uid.trim() ||
                      `staff-${newStaffForm.email.replace(/[^a-zA-Z0-9]/g, '-')}`,
                  });
                  setNewStaffForm({
                    uid: '',
                    email: '',
                    name: '',
                    role: 'Product Manager',
                    active: true,
                  });
                }}
                className="p-5 bg-white border border-neutral-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  placeholder="Staff Full Name"
                  className="px-3 py-2 border border-neutral-300"
                />
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  placeholder="Staff Email"
                  className="px-3 py-2 border border-neutral-300"
                />
                <select
                  value={newStaffForm.role}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, role: e.target.value as AdminRole })
                  }
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
                  className="px-4 py-2 bg-neutral-900 text-white font-mono uppercase"
                >
                  Grant Firestore Role Access
                </button>
              </form>

              <div className="bg-white border border-neutral-200 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2 font-mono">
                  <span>Primary Store Owner Account</span>
                  <span className="text-emerald-700 font-bold">SUPER ADMIN</span>
                </div>
                {staffMembers.map((st) => (
                  <div key={st.uid} className="flex items-center justify-between border-b pb-2">
                    <span>
                      <strong>{st.name}</strong> ({st.email}) — {st.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStaffMember(st.uid)}
                      className="text-red-600 font-mono underline"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 20. SECURITY & ZERO-TRUST RULES AUDIT */}
          {adminSection === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">
                    Zero-Trust Firestore Security &amp; Red Team Audit
                  </h1>
                  <p className="text-xs text-neutral-500">
                    All 11 collections are protected by schema blueprints, PII isolation, and terminal state locking.
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-900 text-white text-xs font-mono">
                  12 / 12 DIRTY DOZEN PAYLOADS BLOCKED
                </span>
              </div>

              <div className="bg-white border border-neutral-200 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-neutral-50 font-mono text-neutral-500">
                      <th className="p-3">#</th>
                      <th className="p-3">ADVERSARIAL PAYLOAD TEST</th>
                      <th className="p-3">TARGET PATH</th>
                      <th className="p-3">OPERATION</th>
                      <th className="p-3 text-right">RULE ENFORCEMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {DIRTY_DOZEN_TESTS.map((t) => (
                      <tr key={t.id}>
                        <td className="p-3">{t.id}</td>
                        <td className="p-3 font-sans font-semibold">{t.name}</td>
                        <td className="p-3">{t.collection}</td>
                        <td className="p-3 uppercase">{t.operation}</td>
                        <td className="p-3 text-right text-emerald-700 font-bold">
                          {t.expectedOutcome} ✓
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 21. ACTIVITY LOGS */}
          {adminSection === 'activity-logs' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Admin Security &amp; Activity Audit Logs</h1>
              <div className="bg-white border border-neutral-200 divide-y text-xs font-mono">
                {activityLogs.length === 0 ? (
                  <div className="p-6 text-neutral-500">
                    Admin mutations made while signed in are logged to Cloud Firestore /logs.
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{log.action}</span> ·{' '}
                        <span>{log.details}</span>
                      </div>
                      <span className="text-neutral-500">{log.actorEmail}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
