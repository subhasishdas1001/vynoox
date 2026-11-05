import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Heart,
  Maximize2,
  Pause,
  Play,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  HeroButtonStyle,
  HeroConfig,
  HeroSlide,
  NewArrivalsShowcaseConfig,
  Product,
  UgcSectionConfig,
  UgcVideoItem,
} from '../types/store';

function hexToRgba(hex: string, opacityPercent: number): string {
  const clean = (hex || '#000000').replace('#', '').trim();
  const alpha = Math.max(0, Math.min(100, opacityPercent)) / 100;
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getHeroButtonClasses(style: HeroButtonStyle): string {
  switch (style) {
    case 'solid-dark':
      return 'bg-[#111111] text-[#FAF9F6] border border-[#111111] hover:bg-neutral-800';
    case 'outline-light':
      return 'bg-transparent text-white border border-white/75 hover:bg-white hover:text-[#111111]';
    case 'glass-minimal':
      return 'bg-white/15 backdrop-blur-md text-white border border-white/30 hover:bg-white/25';
    case 'solid-light':
    default:
      return 'bg-[#FAF9F6] text-[#111111] border border-[#FAF9F6] hover:bg-neutral-200';
  }
}

function getColorSwatchHex(colorName: string): string {
  const lower = colorName.toLowerCase();
  if (lower.includes('charcoal') || lower.includes('obsidian') || lower.includes('monolith'))
    return '#27272A';
  if (lower.includes('black') || lower.includes('onyx')) return '#111111';
  if (lower.includes('bone') || lower.includes('ivory') || lower.includes('cream'))
    return '#EAE5D9';
  if (lower.includes('olive') || lower.includes('sage')) return '#4B5345';
  if (lower.includes('slate') || lower.includes('grey') || lower.includes('ash'))
    return '#71717A';
  if (lower.includes('sand') || lower.includes('taupe') || lower.includes('khaki'))
    return '#C2B9A7';
  if (lower.includes('cobalt') || lower.includes('navy')) return '#1E293B';
  return '#525252';
}

export const FullScreenCinematicHero: React.FC<{
  overrideConfig?: HeroConfig;
  forcedViewport?: 'desktop' | 'tablet' | 'mobile';
  focusedSlideId?: string;
}> = ({ overrideConfig, forcedViewport, focusedSlideId }) => {
  const { heroConfig: storeHeroConfig, navigateTo } = useStore();
  const config = overrideConfig || storeHeroConfig;

  const activeSlides = useMemo(() => {
    const allSorted = [...(config.slides || [])].sort((a, b) => a.order - b.order);
    const enabledOnly = allSorted.filter((s) => s.enabled || s.id === focusedSlideId);
    return enabledOnly.length > 0 ? enabledOnly : allSorted;
  }, [config.slides, focusedSlideId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoFailedMap, setVideoFailedMap] = useState<Record<string, boolean>>({});
  const [isInViewport, setIsInViewport] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  const heroContainerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!focusedSlideId) return;
    const idx = activeSlides.findIndex((s) => s.id === focusedSlideId);
    if (idx >= 0) {
      setCurrentIndex(idx);
    }
  }, [focusedSlideId, activeSlides]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);

    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener?.('change', handler);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Pause hero video when scrolled outside the viewport (Section 9 Optimization)
  useEffect(() => {
    const el = heroContainerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const safeIndex = activeSlides.length > 0 ? currentIndex % activeSlides.length : 0;
  const currentSlide: HeroSlide | undefined = activeSlides[safeIndex];

  const effectiveDevice: 'desktop' | 'tablet' | 'mobile' = forcedViewport
    ? forcedViewport
    : windowWidth < 640
    ? 'mobile'
    : windowWidth < 1024
    ? 'tablet'
    : 'desktop';

  const isDefaultPlaceholderUrl = (url?: string): boolean => {
    if (!url || !url.trim()) return true;
    return (
      url.startsWith('data:image/svg+xml') ||
      url.includes('assets.mixkit.co')
    );
  };

  const resolveBestMediaUrl = (
    primary?: string,
    secondary?: string,
    fallback?: string
  ): string => {
    if (primary && !isDefaultPlaceholderUrl(primary)) return primary;
    if (secondary && !isDefaultPlaceholderUrl(secondary)) return secondary;
    if (fallback && !isDefaultPlaceholderUrl(fallback)) return fallback;
    return primary || secondary || fallback || '';
  };

  const resolveBestVideoUrl = (
    primary?: string,
    secondary?: string
  ): string => {
    if (primary && !isDefaultPlaceholderUrl(primary)) return primary;
    if (secondary && !isDefaultPlaceholderUrl(secondary)) return secondary;
    return '';
  };

  const activeImageSrc = currentSlide
    ? effectiveDevice === 'mobile'
      ? resolveBestMediaUrl(
          currentSlide.mobileImageUrl,
          currentSlide.desktopImageUrl,
          currentSlide.fallbackImageUrl
        )
      : resolveBestMediaUrl(
          currentSlide.desktopImageUrl,
          currentSlide.mobileImageUrl,
          currentSlide.fallbackImageUrl
        )
    : '';

  const activeVideoSrc = currentSlide
    ? effectiveDevice === 'mobile'
      ? resolveBestVideoUrl(
          currentSlide.mobileVideoUrl,
          currentSlide.desktopVideoUrl
        )
      : resolveBestVideoUrl(
          currentSlide.desktopVideoUrl,
          currentSlide.mobileVideoUrl
        )
    : '';

  // Never pass an inline SVG banner as the video poster because it masks the video frame
  const resolvedVideoPoster = useMemo(() => {
    if (!currentSlide) return undefined;
    const candidate =
      effectiveDevice === 'mobile'
        ? currentSlide.mobileImageUrl || currentSlide.desktopImageUrl || currentSlide.fallbackImageUrl
        : currentSlide.desktopImageUrl || currentSlide.fallbackImageUrl;
    if (!candidate || isDefaultPlaceholderUrl(candidate)) return undefined;
    return candidate;
  }, [currentSlide, effectiveDevice]);

  const videoStatusKey = currentSlide ? `${currentSlide.id}::${activeVideoSrc}` : '';

  // Automatic Slideshow Timer (paused in Studio when focusedSlideId is active)
  useEffect(() => {
    if (
      focusedSlideId ||
      !config.autoSlideshow ||
      activeSlides.length <= 1 ||
      !isInViewport
    )
      return;
    const durationMs =
      Math.max(
        2,
        Number(currentSlide?.durationSeconds || config.defaultSlideDurationSeconds || 7)
      ) * 1000;
    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [
    focusedSlideId,
    config.autoSlideshow,
    config.defaultSlideDurationSeconds,
    activeSlides.length,
    safeIndex,
    currentSlide?.durationSeconds,
    isInViewport,
  ]);

  // Manage background video playback based on viewport visibility & activeVideoSrc changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (
      currentSlide?.mediaMode === 'video' &&
      activeVideoSrc &&
      isInViewport
    ) {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Fallback if browser blocks autoplay until metadata is ready
        });
      }
    } else {
      vid.pause();
    }
  }, [
    currentSlide?.id,
    currentSlide?.mediaMode,
    activeVideoSrc,
    isInViewport,
  ]);

  if (!currentSlide) return null;

  const resolvedHeight =
    config.heightPreset === '100vh'
      ? effectiveDevice === 'mobile'
        ? config.mobileHeight || '85vh'
        : effectiveDevice === 'tablet'
        ? config.tabletHeight || '88vh'
        : '100vh'
      : config.heightPreset === '85vh'
      ? '85vh'
      : config.heightPreset === '70vh'
      ? '70vh'
      : effectiveDevice === 'mobile'
      ? config.mobileHeight || '78vh'
      : effectiveDevice === 'tablet'
      ? config.tabletHeight || '82vh'
      : config.desktopHeight || '92vh';

  const shouldRenderVideo =
    currentSlide.mediaMode === 'video' &&
    Boolean(activeVideoSrc) &&
    !videoFailedMap[videoStatusKey];

  // 6-Position Transparent Overlay Layout
  const positionContainerClasses: Record<HeroSlide['textPosition'], string> = {
    'top-left': 'items-start justify-start pt-16 md:pt-24 pb-12',
    'top-center': 'items-start justify-center pt-16 md:pt-24 pb-12',
    center: 'items-center justify-center py-16',
    'bottom-left': 'items-end justify-start pb-16 md:pb-24 pt-12',
    'bottom-center': 'items-end justify-center pb-16 md:pb-24 pt-12',
    'bottom-right': 'items-end justify-end pb-16 md:pb-24 pt-12',
  };

  const headlineSizeClass =
    currentSlide.fontSize === 'sm'
      ? 'text-2xl sm:text-3xl md:text-4xl'
      : currentSlide.fontSize === 'md'
      ? 'text-3xl sm:text-4xl md:text-5xl'
      : currentSlide.fontSize === 'lg'
      ? 'text-4xl sm:text-5xl md:text-6xl'
      : currentSlide.fontSize === 'xl'
      ? 'text-4xl sm:text-6xl md:text-[4.25rem]'
      : 'text-4xl sm:text-6xl lg:text-[4.75rem]';

  const spacingGapClass =
    currentSlide.textSpacing === 'compact'
      ? 'space-y-3'
      : currentSlide.textSpacing === 'relaxed'
      ? 'space-y-6'
      : currentSlide.textSpacing === 'expansive'
      ? 'space-y-8'
      : 'space-y-5';

  return (
    <section
      ref={heroContainerRef}
      style={{
        height: resolvedHeight,
        minHeight: effectiveDevice === 'mobile' ? '520px' : '620px',
      }}
      className="relative w-full overflow-hidden bg-[#0C0C0C] select-none"
    >
      {/* Edge-to-Edge Full-Screen Media Layer */}
      <div className="absolute inset-0 w-full h-full">
        {shouldRenderVideo ? (
          <video
            ref={videoRef}
            key={videoStatusKey}
            src={activeVideoSrc}
            poster={resolvedVideoPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              v.muted = true;
              v.defaultMuted = true;
              if (isInViewport) {
                v.play().catch(() => {});
              }
            }}
            onCanPlay={(e) => {
              const v = e.currentTarget;
              v.muted = true;
              if (isInViewport && v.paused) {
                v.play().catch(() => {});
              }
            }}
            onError={() =>
              setVideoFailedMap((prev) => ({ ...prev, [videoStatusKey]: true }))
            }
            style={{
              objectPosition: currentSlide.focalPoint || 'center center',
            }}
            className={`w-full h-full ${
              currentSlide.videoScale === 'contain' ? 'object-contain' : 'object-cover'
            } transition-transform duration-1000`}
          />
        ) : (
          <img
            key={`${currentSlide.id}-${activeImageSrc}`}
            src={activeImageSrc}
            alt={currentSlide.heading || 'VYNOOX Hero Campaign'}
            referrerPolicy="no-referrer"
            style={{
              objectPosition: currentSlide.focalPoint || 'center center',
            }}
            className="w-full h-full object-cover transition-transform duration-1000 scale-100"
          />
        )}

        {/* Customizable Transparent Overlay + Subtle Vignette for Guaranteed Readability */}
        <div
          style={{
            backgroundColor: hexToRgba(
              currentSlide.overlayColor || '#000000',
              currentSlide.overlayOpacity ?? 42
            ),
          }}
          className="absolute inset-0 transition-colors duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 pointer-events-none" />
      </div>

      {/* Transparent Text Overlay (No background box — directly over media) */}
      <div
        className={`relative z-10 w-full h-full max-w-[1440px] mx-auto px-6 md:px-14 flex ${
          positionContainerClasses[currentSlide.textPosition || 'bottom-left']
        }`}
      >
        <div
          key={currentSlide.id}
          style={{
            maxWidth: config.contentMaxWidth || '820px',
            color: currentSlide.textColor || '#FAF9F6',
            textAlign: currentSlide.textAlign || 'left',
          }}
          className={`w-full ${spacingGapClass} ${
            config.enableTextAnimations
              ? 'animate-[fadeIn_0.65s_ease-out]'
              : ''
          }`}
        >
          {currentSlide.brandLabel && (
            <p
              style={{
                textShadow: '0 1px 12px rgba(0,0,0,0.45)',
              }}
              className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] opacity-90"
            >
              {currentSlide.brandLabel}
            </p>
          )}

          {currentSlide.heading && (
            <h1
              style={{
                fontFamily: currentSlide.fontFamily || 'Cormorant Garamond',
                fontWeight: currentSlide.fontWeight || '600',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              }}
              className={`${headlineSizeClass} leading-[1.04] tracking-tight`}
            >
              {currentSlide.heading}
            </h1>
          )}

          {currentSlide.description && (
            <p
              style={{
                textShadow: '0 1px 14px rgba(0,0,0,0.55)',
              }}
              className={`text-sm sm:text-base md:text-lg opacity-90 leading-relaxed max-w-2xl ${
                currentSlide.textAlign === 'center'
                  ? 'mx-auto'
                  : currentSlide.textAlign === 'right'
                  ? 'ml-auto'
                  : ''
              }`}
            >
              {currentSlide.description}
            </p>
          )}

          {(currentSlide.primaryButtonText || currentSlide.secondaryButtonText) && (
            <div
              className={`pt-2 flex flex-wrap items-center gap-4 ${
                currentSlide.textAlign === 'center'
                  ? 'justify-center'
                  : currentSlide.textAlign === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {currentSlide.primaryButtonText && (
                <button
                  type="button"
                  onClick={() => navigateTo(currentSlide.primaryButtonLink || 'new-arrivals')}
                  className={`px-8 py-4 text-xs font-mono uppercase tracking-[0.2em] font-semibold transition-all duration-200 ${getHeroButtonClasses(
                    currentSlide.primaryButtonStyle || 'solid-light'
                  )}`}
                >
                  {currentSlide.primaryButtonText}
                </button>
              )}

              {currentSlide.secondaryButtonText && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(currentSlide.secondaryButtonLink || 'collections')
                  }
                  className={`px-8 py-4 text-xs font-mono uppercase tracking-[0.2em] font-semibold transition-all duration-200 ${getHeroButtonClasses(
                    currentSlide.secondaryButtonStyle || 'outline-light'
                  )}`}
                >
                  {currentSlide.secondaryButtonText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Slideshow Controls & Minimal Slide Indicators */}
      {config.showManualNav && activeSlides.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-14 z-20 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {activeSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 transition-all duration-300 ${
                  idx === safeIndex
                    ? 'w-10 bg-white'
                    : 'w-4 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + activeSlides.length) % activeSlides.length
                )
              }
              className="h-9 w-9 flex items-center justify-center border border-white/30 bg-black/25 text-white hover:bg-white hover:text-black transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % activeSlides.length)
              }
              className="h-9 w-9 flex items-center justify-center border border-white/30 bg-black/25 text-white hover:bg-white hover:text-black transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export const NewArrivalsShowcaseSection: React.FC<{
  overrideConfig?: NewArrivalsShowcaseConfig;
}> = ({ overrideConfig }) => {
  const {
    products,
    newArrivalsConfig: storeConfig,
    generalSettings,
    wishlistIds,
    toggleWishlist,
    addToCart,
    navigateTo,
  } = useStore();

  const config = overrideConfig || storeConfig;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string>('L');
  const [quickViewColor, setQuickViewColor] = useState<string>('Washed Charcoal');

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published'),
    [products]
  );

  const showcaseProducts = useMemo(() => {
    let base: Product[] = [];
    if (config.selectedProductIds && config.selectedProductIds.length > 0) {
      base = config.selectedProductIds
        .map((id) => publishedProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p));
    }
    if (base.length === 0) {
      const arrivals = publishedProducts.filter((p) => p.newArrival);
      base = arrivals.length >= 3 ? arrivals : [...publishedProducts];
    }

    const sorted = [...base];
    if (config.productOrder === 'price-asc') {
      sorted.sort((a, b) => a.salePrice - b.salePrice);
    } else if (config.productOrder === 'price-desc') {
      sorted.sort((a, b) => b.salePrice - a.salePrice);
    } else if (config.productOrder === 'featured') {
      sorted.sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
    }

    return sorted.slice(0, Math.max(1, config.maxProducts || 6));
  }, [publishedProducts, config.selectedProductIds, config.productOrder, config.maxProducts]);

  if (!config.visible) return null;

  const padClass =
    config.sectionSpacing === 'compact'
      ? 'py-12'
      : config.sectionSpacing === 'spacious'
      ? 'py-24'
      : 'py-16 md:py-20';

  const gridColsClass =
    config.gridColumns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : config.gridColumns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const openQuickView = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const firstSize =
      prod.sizesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0] || 'L';
    const firstColor =
      prod.colorsCsv
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)[0] || 'Default';
    setQuickViewSize(firstSize);
    setQuickViewColor(firstColor);
    setQuickViewProduct(prod);
  };

  return (
    <section
      style={{
        backgroundColor: config.backgroundColor || '#FAF9F6',
        color: config.textColor || '#111111',
      }}
      className={`${padClass} border-b border-neutral-200 dark:border-neutral-800`}
    >
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-editorial tracking-tight font-semibold uppercase">
              {config.heading || 'NEW ARRIVALS'}
            </h2>
            <p className="text-sm opacity-75 mt-1.5">
              {config.subtitle || 'Discover our latest essentials.'}
            </p>
          </div>
          {config.viewAllButtonText && (
            <button
              type="button"
              onClick={() => navigateTo(config.viewAllButtonLink || 'new-arrivals')}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-semibold hover:underline whitespace-nowrap shrink-0"
            >
              <span>{config.viewAllButtonText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Product Showcase Grid */}
        <div className={`grid ${gridColsClass} gap-8`}>
          {showcaseProducts.map((product) => {
            const isHovered = hoveredId === product.id;
            const isWishlisted = wishlistIds.includes(product.id);
            const discountPct =
              product.compareAtPrice > product.salePrice
                ? Math.round(
                    ((product.compareAtPrice - product.salePrice) /
                      product.compareAtPrice) *
                      100
                  )
                : 0;
            const colors = product.colorsCsv
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean);
            const sizes = product.sizesCsv
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <article
                key={product.id}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  navigateTo('product-details', { productSlug: product.slug })
                }
                className="group cursor-pointer flex flex-col justify-between transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F1EC] border border-neutral-200/80">
                    <img
                      src={
                        isHovered && product.secondaryImage
                          ? product.secondaryImage
                          : product.primaryImage
                      }
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {/* Discount Label / Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {discountPct > 0 && (
                        <span className="px-2.5 py-1 bg-[#111111] text-[#FAF9F6] text-[10px] font-mono uppercase tracking-widest">
                          -{discountPct}% OFF
                        </span>
                      )}
                      {product.newArrival && (
                        <span className="px-2.5 py-1 bg-[#FAF9F6]/95 text-[#111111] text-[10px] font-mono uppercase tracking-widest">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Top-Right Wishlist & Quick View Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button
                        type="button"
                        aria-label="Toggle Wishlist"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="h-9 w-9 flex items-center justify-center bg-[#FAF9F6]/90 text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label="Quick View"
                        title="Quick View"
                        onClick={(e) => openQuickView(product, e)}
                        className="h-9 w-9 flex items-center justify-center bg-[#FAF9F6]/90 text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Hover Action Drawer: Quick View + Add to Cart */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            productId: product.id,
                            name: product.name,
                            slug: product.slug,
                            sku: product.sku,
                            price: product.salePrice,
                            regularPrice: product.regularPrice,
                            image: product.primaryImage,
                            size: sizes[2] || sizes[0] || 'L',
                            color: colors[0] || 'Default',
                            material: product.materialsCsv,
                            style: product.stylesCsv,
                            quantity: 1,
                          });
                        }}
                        className="flex-1 py-2.5 px-3 bg-[#FAF9F6] text-[#111111] text-[11px] font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openQuickView(product, e)}
                        className="py-2.5 px-3 border border-white/60 bg-black/40 text-white text-[11px] font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>

                  {/* Product Details Below Image */}
                  <div className="pt-4 space-y-2">
                    <h3 className="text-base font-medium leading-snug line-clamp-1 group-hover:underline">
                      {product.name}
                    </h3>

                    {/* Available Colors Swatches */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {colors.map((color) => (
                          <span
                            key={color}
                            title={color}
                            style={{ backgroundColor: getColorSwatchHex(color) }}
                            className="h-3.5 w-3.5 rounded-full border border-neutral-300 inline-block"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] opacity-65 truncate">
                        {colors.join(' · ')}
                      </span>
                    </div>

                    {/* Price & Compare-at Price */}
                    <div className="flex items-baseline gap-2.5 font-mono tabular-nums pt-0.5">
                      <span className="text-sm font-semibold">
                        {generalSettings.currencySymbol}
                        {product.salePrice.toLocaleString('en-IN')}
                      </span>
                      {product.compareAtPrice > product.salePrice && (
                        <span className="text-xs opacity-50 line-through">
                          {generalSettings.currencySymbol}
                          {product.compareAtPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF9F6] text-[#111111] border border-neutral-300 max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-2xl"
          >
            <div className="md:col-span-6 bg-[#F3F1EC] relative aspect-[4/3] md:aspect-auto">
              <img
                src={quickViewProduct.primaryImage}
                alt={quickViewProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                    {quickViewProduct.collection} · {quickViewProduct.sku}
                  </span>
                  <button
                    type="button"
                    aria-label="Close Quick View"
                    onClick={() => setQuickViewProduct(null)}
                    className="p-1 hover:bg-neutral-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-2xl font-editorial font-semibold">
                  {quickViewProduct.name}
                </h3>
                <div className="flex items-baseline gap-3 font-mono tabular-nums">
                  <span className="text-lg font-bold">
                    {generalSettings.currencySymbol}
                    {quickViewProduct.salePrice.toLocaleString('en-IN')}
                  </span>
                  {quickViewProduct.compareAtPrice > quickViewProduct.salePrice && (
                    <span className="text-xs text-neutral-400 line-through">
                      {generalSettings.currencySymbol}
                      {quickViewProduct.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {quickViewProduct.description}
                </p>

                {/* Color Selection */}
                <div className="pt-2 space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase text-neutral-500">
                    Color: <strong className="text-neutral-900">{quickViewColor}</strong>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickViewProduct.colorsCsv
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setQuickViewColor(col)}
                          className={`px-2.5 py-1 text-xs border ${
                            quickViewColor === col
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="pt-1 space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase text-neutral-500">
                    Size: <strong className="text-neutral-900">{quickViewSize}</strong>
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {quickViewProduct.sizesCsv
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setQuickViewSize(sz)}
                          className={`py-1.5 text-xs font-mono border ${
                            quickViewSize === sz
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      productId: quickViewProduct.id,
                      name: quickViewProduct.name,
                      slug: quickViewProduct.slug,
                      sku: quickViewProduct.sku,
                      price: quickViewProduct.salePrice,
                      regularPrice: quickViewProduct.regularPrice,
                      image: quickViewProduct.primaryImage,
                      size: quickViewSize,
                      color: quickViewColor,
                      material: quickViewProduct.materialsCsv,
                      style: quickViewProduct.stylesCsv,
                      quantity: 1,
                    });
                    setQuickViewProduct(null);
                  }}
                  className="w-full py-3 bg-[#111111] text-white text-xs font-mono uppercase tracking-widest font-semibold hover:bg-neutral-800"
                >
                  Add to Shopping Bag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const slug = quickViewProduct.slug;
                    setQuickViewProduct(null);
                    navigateTo('product-details', { productSlug: slug });
                  }}
                  className="w-full py-2.5 border border-neutral-300 text-xs font-mono uppercase tracking-wider hover:border-neutral-900"
                >
                  View Full Product Specifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const LazyUgcVideoCard: React.FC<{
  item: UgcVideoItem;
  aspectRatio: UgcSectionConfig['aspectRatio'];
  cardWidth: UgcSectionConfig['cardWidth'];
  hoverAutoplay: boolean;
  mutedByDefault: boolean;
  loopVideos: boolean;
  isActivePlaying: boolean;
  onRequestPlay: (id: string | null) => void;
  onOpenLightbox: (item: UgcVideoItem) => void;
  onShopProduct: (slug?: string, productId?: string) => void;
}> = ({
  item,
  aspectRatio,
  cardWidth,
  hoverAutoplay,
  mutedByDefault,
  loopVideos,
  isActivePlaying,
  onRequestPlay,
  onOpenLightbox,
  onShopProduct,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [inViewport, setInViewport] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Lazy load video source only when near viewport & pause when outside viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setNearViewport(true);
            setInViewport(true);
          } else {
            setInViewport(false);
          }
        });
      },
      { rootMargin: '220px 0px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActivePlaying && inViewport && !videoFailed) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isActivePlaying, inViewport, videoFailed]);

  const aspectClass =
    aspectRatio === '4:5'
      ? 'aspect-[4/5]'
      : aspectRatio === '1:1'
      ? 'aspect-square'
      : 'aspect-[9/16]';

  const widthClass =
    cardWidth === 'compact'
      ? 'min-w-[230px] sm:min-w-[250px]'
      : cardWidth === 'wide'
      ? 'min-w-[300px] sm:min-w-[340px]'
      : 'min-w-[265px] sm:min-w-[290px]';

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => {
        if (hoverAutoplay) onRequestPlay(item.id);
      }}
      onMouseLeave={() => {
        if (hoverAutoplay) onRequestPlay(null);
      }}
      onClick={() => onOpenLightbox(item)}
      className={`group relative ${aspectClass} ${widthClass} flex-1 snap-start overflow-hidden bg-neutral-900 border border-white/15 cursor-pointer transition-transform duration-300 hover:-translate-y-1`}
    >
      {/* Poster Image (Always rendered for instant visual paint) */}
      <img
        src={item.thumbnailUrl}
        alt={`${item.customerHandle} wearing VYNOOX`}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      {/* Lazy-Loaded MP4 Video Layer */}
      {nearViewport && item.videoUrl && !videoFailed && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.thumbnailUrl}
          muted={mutedByDefault}
          loop={loopVideos}
          playsInline
          preload="none"
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isActivePlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      )}

      {/* Subtle Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25 pointer-events-none" />

      {/* Top Bar: Handle + Play/Expand Badge */}
      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between text-xs font-mono text-white z-10">
        <span className="px-2.5 py-1 bg-black/50 backdrop-blur-xs border border-white/15 tracking-wide">
          {item.customerHandle}
        </span>
        <span className="h-8 w-8 flex items-center justify-center bg-black/50 backdrop-blur-xs border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
          {isActivePlaying ? (
            <Maximize2 className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </span>
      </div>

      {/* Bottom Content: Caption + Linked Product Tag */}
      <div className="absolute bottom-0 inset-x-0 p-4 space-y-3 text-white z-10">
        <p className="text-xs leading-relaxed opacity-90 line-clamp-2">
          {item.caption}
        </p>

        {item.productTagLabel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShopProduct(item.productSlug, item.productId);
            }}
            className="w-full py-2 px-3 bg-white/15 hover:bg-white hover:text-[#111111] backdrop-blur-xs border border-white/25 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between transition-colors"
          >
            <span className="truncate">{item.productTagLabel}</span>
            <ArrowRight className="h-3 w-3 shrink-0 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export const VynooxCommunityUgcSection: React.FC<{
  overrideConfig?: UgcSectionConfig;
}> = ({ overrideConfig }) => {
  const {
    ugcConfig: storeUgcConfig,
    products,
    generalSettings,
    navigateTo,
    addToCart,
  } = useStore();
  const config = overrideConfig || storeUgcConfig;

  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<UgcVideoItem | null>(null);
  const [lightboxMuted, setLightboxMuted] = useState<boolean>(false);

  const visibleVideos = useMemo(
    () =>
      (config.videos || [])
        .filter((v) => v.enabled)
        .sort((a, b) => a.order - b.order)
        .slice(0, Math.max(1, config.maxVisibleVideos || 4)),
    [config.videos, config.maxVisibleVideos]
  );

  if (!config.visible || visibleVideos.length === 0) return null;

  const handleShopProduct = (slug?: string, productId?: string) => {
    const matched = products.find(
      (p) => p.slug === slug || p.id === productId
    );
    if (matched) {
      navigateTo('product-details', { productSlug: matched.slug });
    } else {
      navigateTo('shop-all');
    }
  };

  const linkedLightboxProduct = lightboxVideo
    ? products.find(
        (p) =>
          p.id === lightboxVideo.productId || p.slug === lightboxVideo.productSlug
      )
    : undefined;

  return (
    <section
      style={{
        backgroundColor: config.backgroundColor || '#111111',
        color: config.textColor || '#FAF9F6',
      }}
      className="py-16 md:py-24 border-b border-neutral-800"
    >
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.25em] opacity-65 mb-2">
              9:16 VERTICAL LOOKBOOK ARCHIVE
            </p>
            <h2 className="text-3xl md:text-4xl font-editorial tracking-tight font-semibold uppercase">
              {config.heading || 'VYNOOX COMMUNITY'}
            </h2>
            <p className="text-sm opacity-75 mt-1.5">
              {config.subtitle || 'Real people. Real style. Real stories.'}
            </p>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest opacity-60">
            Click any look to open full video player
          </span>
        </div>

        {/* Responsive Horizontal Scroll on Mobile + Grid on Desktop */}
        <div className="flex lg:grid lg:grid-cols-4 gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
          {visibleVideos.map((vid) => (
            <LazyUgcVideoCard
              key={vid.id}
              item={vid}
              aspectRatio={config.aspectRatio || '9:16'}
              cardWidth={config.cardWidth || 'standard'}
              hoverAutoplay={config.hoverAutoplay}
              mutedByDefault={config.mutedByDefault}
              loopVideos={config.loopVideos}
              isActivePlaying={activePlayingId === vid.id}
              onRequestPlay={setActivePlayingId}
              onOpenLightbox={(item) => {
                setActivePlayingId(null);
                setLightboxVideo(item);
              }}
              onShopProduct={handleShopProduct}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Video Modal with Playback Controls */}
      {lightboxVideo && (
        <div
          onClick={() => setLightboxVideo(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111111] text-[#FAF9F6] border border-white/20 max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-2xl"
          >
            {/* Left Vertical 9:16 Video Player */}
            <div className="md:col-span-6 bg-black relative aspect-[9/16] max-h-[82vh] w-full flex items-center justify-center">
              <video
                src={lightboxVideo.videoUrl}
                poster={lightboxVideo.thumbnailUrl}
                controls
                autoPlay
                loop
                playsInline
                muted={lightboxMuted}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxMuted(!lightboxMuted)}
                className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 border border-white/25 text-white text-xs font-mono inline-flex items-center gap-1.5"
              >
                {lightboxMuted ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Sound On</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Story & Linked Garment Details */}
            <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block">
                      VYNOOX COMMUNITY LOOKBOOK
                    </span>
                    <h3 className="text-xl font-bold mt-0.5">
                      {lightboxVideo.customerHandle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Close Video Lightbox"
                    onClick={() => setLightboxVideo(null)}
                    className="p-2 border border-white/20 hover:bg-white hover:text-black transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed">
                  {lightboxVideo.caption}
                </p>

                {linkedLightboxProduct && (
                  <div className="p-4 border border-white/15 bg-white/5 space-y-3 mt-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                      FEATURED GARMENT IN THIS VIDEO
                    </span>
                    <div className="flex items-center gap-4">
                      <img
                        src={linkedLightboxProduct.primaryImage}
                        alt={linkedLightboxProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 object-cover bg-[#F3F1EC] border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold truncate">
                          {linkedLightboxProduct.name}
                        </h4>
                        <p className="text-xs font-mono text-neutral-300 mt-0.5 tabular-nums">
                          {generalSettings.currencySymbol}
                          {linkedLightboxProduct.salePrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
                            productId: linkedLightboxProduct.id,
                            name: linkedLightboxProduct.name,
                            slug: linkedLightboxProduct.slug,
                            sku: linkedLightboxProduct.sku,
                            price: linkedLightboxProduct.salePrice,
                            regularPrice: linkedLightboxProduct.regularPrice,
                            image: linkedLightboxProduct.primaryImage,
                            size: 'L',
                            color:
                              linkedLightboxProduct.colorsCsv.split(',')[0]?.trim() ||
                              'Default',
                            material: linkedLightboxProduct.materialsCsv,
                            style: linkedLightboxProduct.stylesCsv,
                            quantity: 1,
                          });
                          setLightboxVideo(null);
                        }}
                        className="py-2.5 bg-[#FAF9F6] text-[#111111] text-[11px] font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200"
                      >
                        Add to Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const slug = linkedLightboxProduct.slug;
                          setLightboxVideo(null);
                          navigateTo('product-details', { productSlug: slug });
                        }}
                        className="py-2.5 border border-white/30 text-[11px] font-mono uppercase tracking-wider hover:bg-white hover:text-black"
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>RATIO: {config.aspectRatio || '9:16'} VERTICAL</span>
                <button
                  type="button"
                  onClick={() => setLightboxVideo(null)}
                  className="underline text-white"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
