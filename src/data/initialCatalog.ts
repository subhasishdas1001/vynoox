import {
  CategoryItem,
  CMSPage,
  CollectionItem,
  CouponItem,
  HeroConfig,
  HomepageSection,
  MarketingSettings,
  MediaLibraryItem,
  NavigationLink,
  NewArrivalsShowcaseConfig,
  PaymentSettings,
  Product,
  ReviewItem,
  ShippingSettings,
  StoreGeneralSettings,
  ThemeSettings,
  UgcSectionConfig,
} from '../types/store';

/**
 * Generates high-contrast luxury fashion studio SVG data-URI artwork
 * adhering to the Zero-Broken-Image Policy.
 */
export function createGarmentStudioSvg(options: {
  garmentType: 'oversized-tee' | 'crew-tee' | 'hoodie' | 'cargo' | 'collection';
  primaryFill: string;
  secondaryFill: string;
  backdropColor: string;
  codeLabel: string;
  titleLabel: string;
  fabricSpec: string;
  viewAngle?: 'FRONT' | 'BACK';
}): string {
  const {
    garmentType,
    primaryFill,
    secondaryFill,
    backdropColor,
    codeLabel,
    titleLabel,
    fabricSpec,
    viewAngle = 'FRONT',
  } = options;

  let silhouettePath = '';
  if (garmentType === 'oversized-tee') {
    silhouettePath = `
      <path d="M235 160 L315 135 C345 162 455 162 485 135 L565 160 L660 285 L575 340 L530 275 L530 620 L270 620 L270 275 L225 340 L140 285 Z" fill="url(#garmentGrad)" stroke="${secondaryFill}" stroke-width="2.5"/>
      <path d="M315 135 C345 176 455 176 485 135" fill="none" stroke="${secondaryFill}" stroke-width="6" opacity="0.65"/>
      <line x1="270" y1="275" x2="315" y2="135" stroke="${secondaryFill}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
      <line x1="530" y1="275" x2="485" y2="135" stroke="${secondaryFill}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
      <line x1="270" y1="598" x2="530" y2="598" stroke="${secondaryFill}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
    `;
  } else if (garmentType === 'crew-tee') {
    silhouettePath = `
      <path d="M255 155 L330 132 C355 156 445 156 470 132 L545 155 L625 265 L555 312 L515 250 L515 615 L285 615 L285 250 L245 312 L175 265 Z" fill="url(#garmentGrad)" stroke="${secondaryFill}" stroke-width="2.5"/>
      <path d="M330 132 C355 168 445 168 470 132" fill="none" stroke="${secondaryFill}" stroke-width="7" opacity="0.7"/>
      <line x1="285" y1="595" x2="515" y2="595" stroke="${secondaryFill}" stroke-width="1.5" opacity="0.45"/>
    `;
  } else if (garmentType === 'hoodie') {
    silhouettePath = `
      <path d="M320 140 C310 75 490 75 480 140 Z" fill="${primaryFill}" stroke="${secondaryFill}" stroke-width="2.5"/>
      <path d="M240 165 L320 140 L480 140 L560 165 L650 380 L585 415 L535 280 L535 620 L265 620 L265 280 L215 415 L150 380 Z" fill="url(#garmentGrad)" stroke="${secondaryFill}" stroke-width="2.5"/>
      <path d="M315 455 L485 455 L505 580 L295 580 Z" fill="none" stroke="${secondaryFill}" stroke-width="2" opacity="0.55"/>
      <rect x="265" y="585" width="270" height="35" fill="${primaryFill}" stroke="${secondaryFill}" stroke-width="2"/>
    `;
  } else if (garmentType === 'cargo') {
    silhouettePath = `
      <path d="M290 130 L510 130 L555 630 L425 630 L400 285 L375 630 L245 630 Z" fill="url(#garmentGrad)" stroke="${secondaryFill}" stroke-width="2.5"/>
      <rect x="290" y="130" width="220" height="32" fill="${primaryFill}" stroke="${secondaryFill}" stroke-width="2"/>
      <rect x="255" y="310" width="52" height="95" fill="${primaryFill}" stroke="${secondaryFill}" stroke-width="2"/>
      <rect x="493" y="310" width="52" height="95" fill="${primaryFill}" stroke="${secondaryFill}" stroke-width="2"/>
      <line x1="400" y1="162" x2="400" y2="265" stroke="${secondaryFill}" stroke-width="2" opacity="0.6"/>
    `;
  } else {
    silhouettePath = `
      <rect x="220" y="130" width="360" height="480" fill="url(#garmentGrad)" stroke="${secondaryFill}" stroke-width="2"/>
      <line x1="220" y1="290" x2="580" y2="290" stroke="${secondaryFill}" stroke-width="1" opacity="0.4"/>
      <circle cx="400" cy="370" r="95" fill="none" stroke="${secondaryFill}" stroke-width="1.5" opacity="0.5"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 760" width="800" height="760">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${backdropColor}"/>
        <stop offset="100%" stop-color="#E6E3DC"/>
      </linearGradient>
      <linearGradient id="garmentGrad" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stop-color="${primaryFill}"/>
        <stop offset="50%" stop-color="${secondaryFill}"/>
        <stop offset="100%" stop-color="${primaryFill}"/>
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000000" flood-opacity="0.14"/>
      </filter>
    </defs>
    <rect width="800" height="760" fill="url(#bgGrad)"/>
    <rect x="36" y="36" width="728" height="688" fill="none" stroke="#111111" stroke-opacity="0.08" stroke-width="1"/>
    <text x="64" y="76" font-family="sans-serif" font-size="11" letter-spacing="3" fill="#525252">VYNOOX ATELIER · ${codeLabel}</text>
    <text x="736" y="76" text-anchor="end" font-family="monospace" font-size="11" letter-spacing="2" fill="#525252">${viewAngle} SPEC</text>
    <g filter="url(#softShadow)">
      ${silhouettePath}
    </g>
    <text x="400" y="365" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" letter-spacing="6" fill="#FAF9F6" opacity="0.72">VYNOOX</text>
    <text x="64" y="678" font-family="serif" font-size="22" font-weight="600" fill="#111111">${titleLabel}</text>
    <text x="64" y="702" font-family="monospace" font-size="11" letter-spacing="1.5" fill="#525252">${fabricSpec}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createCinematicHeroBackdropSvg(options: {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowColor: string;
  accentTone: string;
  editionLabel: string;
  aspect?: 'desktop' | 'mobile';
}): string {
  const {
    bgStart,
    bgMid,
    bgEnd,
    glowColor,
    accentTone,
    editionLabel,
    aspect = 'desktop',
  } = options;
  const w = aspect === 'mobile' ? 1080 : 1920;
  const h = aspect === 'mobile' ? 1920 : 1080;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="cinematicBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="52%" stop-color="${bgMid}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <radialGradient id="keyLight" cx="65%" cy="38%" r="58%">
        <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.34"/>
        <stop offset="55%" stop-color="${accentTone}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${bgStart}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="rimLight" cx="24%" cy="76%" r="50%">
        <stop offset="0%" stop-color="${accentTone}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${bgEnd}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#cinematicBg)"/>
    <rect width="${w}" height="${h}" fill="url(#keyLight)"/>
    <rect width="${w}" height="${h}" fill="url(#rimLight)"/>
    <g opacity="0.24" stroke="${glowColor}" stroke-width="1" fill="none">
      <path d="M 0 ${Math.round(h * 0.72)} Q ${Math.round(w * 0.42)} ${Math.round(h * 0.48)} ${w} ${Math.round(h * 0.64)}"/>
      <path d="M 0 ${Math.round(h * 0.78)} Q ${Math.round(w * 0.48)} ${Math.round(h * 0.54)} ${w} ${Math.round(h * 0.71)}"/>
      <path d="M ${Math.round(w * 0.58)} 0 C ${Math.round(w * 0.46)} ${Math.round(h * 0.36)}, ${Math.round(w * 0.76)} ${Math.round(h * 0.68)}, ${Math.round(w * 0.62)} ${h}"/>
    </g>
    <g opacity="0.08" fill="${glowColor}">
      <circle cx="${Math.round(w * 0.68)}" cy="${Math.round(h * 0.44)}" r="${Math.round(Math.min(w, h) * 0.32)}"/>
      <circle cx="${Math.round(w * 0.64)}" cy="${Math.round(h * 0.48)}" r="${Math.round(Math.min(w, h) * 0.21)}"/>
    </g>
    <text x="${w - 64}" y="${h - 42}" text-anchor="end" font-family="monospace" font-size="12" letter-spacing="5" fill="${glowColor}" opacity="0.38">${editionLabel}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createUgcVerticalPosterSvg(options: {
  bgTop: string;
  bgBottom: string;
  garmentTone: string;
  accentColor: string;
  handle: string;
  garmentTag: string;
  locationTag: string;
}): string {
  const { bgTop, bgBottom, garmentTone, accentColor, handle, garmentTag, locationTag } = options;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="ugcBg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="${bgTop}"/>
        <stop offset="100%" stop-color="${bgBottom}"/>
      </linearGradient>
      <radialGradient id="ugcSpot" cx="50%" cy="42%" r="52%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${bgBottom}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="720" height="1280" fill="url(#ugcBg)"/>
    <rect width="720" height="1280" fill="url(#ugcSpot)"/>
    <g opacity="0.92">
      <circle cx="360" cy="360" r="64" fill="${garmentTone}" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.45"/>
      <path d="M180 465 L285 430 C320 460 400 460 435 430 L540 465 L635 645 L540 700 L495 595 L495 1030 L225 1030 L225 595 L180 700 L85 645 Z" fill="${garmentTone}" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.55"/>
      <text x="360" y="685" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" letter-spacing="9" fill="#FAF9F6" opacity="0.65">VYNOOX</text>
    </g>
    <text x="48" y="74" font-family="monospace" font-size="14" letter-spacing="3" fill="#FAF9F6" opacity="0.65">${locationTag}</text>
    <text x="48" y="102" font-family="sans-serif" font-size="15" font-weight="600" letter-spacing="1.5" fill="#FAF9F6" opacity="0.85">${handle}</text>
    <text x="48" y="1220" font-family="monospace" font-size="13" letter-spacing="2.5" fill="${accentColor}" opacity="0.7">${garmentTag}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const HERO_CAMPAIGN_SVG = createCinematicHeroBackdropSvg({
  bgStart: '#0C0C0C',
  bgMid: '#181715',
  bgEnd: '#252320',
  glowColor: '#E5E0D5',
  accentTone: '#A8A29E',
  editionLabel: 'VYNOOX ARCHIVE 04 · 280 GSM MINERAL WASH ATELIER',
  aspect: 'desktop',
});

export const HERO_CAMPAIGN_MOBILE_SVG = createCinematicHeroBackdropSvg({
  bgStart: '#0C0C0C',
  bgMid: '#181715',
  bgEnd: '#272522',
  glowColor: '#E5E0D5',
  accentTone: '#A8A29E',
  editionLabel: 'VYNOOX ARCHIVE 04 · MOBILE LOOKBOOK',
  aspect: 'mobile',
});

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'unisex-acid-washed-oversized-tee-charcoal',
    storeId: 'vynoox',
    name: 'Unisex Acid Washed Oversized Tee — Charcoal Obsidian',
    slug: 'unisex-acid-washed-oversized-tee-charcoal',
    description:
      'Crafted from custom-milled 280 GSM heavyweight combed organic cotton, our signature Unisex Acid Washed Oversized Tee undergoes a multi-stage artisanal enzyme and mineral acid wash. Engineered with dropped shoulders, a reinforced 1.2-inch high-density ribbed collar, and an architectural boxy drape that holds its structure wear after wear.',
    regularPrice: 1999,
    salePrice: 1499,
    compareAtPrice: 1999,
    sku: 'VYN-AW-001',
    barcode: '8904251001018',
    category: 'Oversized Tees',
    collection: 'Acid Wash Series',
    status: 'published',
    stockQuantity: 48,
    lowStockThreshold: 8,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: true,
    bestSeller: true,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#27272A',
      secondaryFill: '#3F3F46',
      backdropColor: '#F4F2ED',
      codeLabel: 'VYN-AW-001',
      titleLabel: 'Acid Washed Oversized Tee · Charcoal',
      fabricSpec: '280 GSM COMBED COTTON · ENZYME ACID WASH · BOXY DRAPE',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#1F1F22',
      secondaryFill: '#52525B',
      backdropColor: '#ECE9E1',
      codeLabel: 'VYN-AW-001',
      titleLabel: 'Acid Washed Oversized Tee · Reverse View',
      fabricSpec: 'REINFORCED SHOULDER SEAM · DOUBLE NEEDLE HEM',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'XS,S,M,L,XL,XXL',
    colorsCsv: 'Washed Charcoal,Vintage Bone,Oxidized Olive',
    materialsCsv: '100% Heavyweight Combed Cotton (280 GSM)',
    stylesCsv: 'Oversized Drop-Shoulder Fit',
    tagsCsv: 'acid-wash,oversized,unisex,bestseller,heavyweight',
    variantInventoryJson: JSON.stringify({
      'XS / Washed Charcoal': 6,
      'S / Washed Charcoal': 10,
      'M / Washed Charcoal': 12,
      'L / Washed Charcoal': 10,
      'XL / Washed Charcoal': 6,
      'XXL / Washed Charcoal': 4,
    }),
    seoTitle: 'Unisex Acid Washed Oversized Tee | VYNOOX Luxury Streetwear',
    seoDescription:
      'Shop the VYNOOX Unisex Acid Washed Oversized Tee in 280 GSM heavyweight combed cotton. Architectural boxy fit with artisanal mineral wash.',
  },
  {
    id: 'unisex-classic-crew-t-shirt-bone',
    storeId: 'vynoox',
    name: 'Unisex Classic Crew T-Shirt — Bone Ivory',
    slug: 'unisex-classic-crew-t-shirt-bone',
    description:
      'An elevated everyday staple from the VYNOOX Core Essentials archive. Cut from 240 GSM long-staple Supima cotton jersey with a smooth bio-washed handfeel, tailored shoulder lines, and a no-sag double-ribbed crew neckline designed for effortless layering or standalone refinement.',
    regularPrice: 1499,
    salePrice: 1199,
    compareAtPrice: 1499,
    sku: 'VYN-CC-002',
    barcode: '8904251001025',
    category: 'Classic Crew Tees',
    collection: 'Core Crewneck Essentials',
    status: 'published',
    stockQuantity: 64,
    lowStockThreshold: 10,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: false,
    bestSeller: true,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'crew-tee',
      primaryFill: '#EAE5D9',
      secondaryFill: '#CBC4B4',
      backdropColor: '#F3F1EC',
      codeLabel: 'VYN-CC-002',
      titleLabel: 'Unisex Classic Crew T-Shirt · Bone Ivory',
      fabricSpec: '240 GSM LONG-STAPLE COTTON · BIO-WASHED FINISH',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'crew-tee',
      primaryFill: '#E3DDD0',
      secondaryFill: '#B8B0A0',
      backdropColor: '#EAE7E0',
      codeLabel: 'VYN-CC-002',
      titleLabel: 'Unisex Classic Crew T-Shirt · Reverse View',
      fabricSpec: 'STRUCTURED COLLAR RIB · TAILORED DRAPE',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'XS,S,M,L,XL,XXL',
    colorsCsv: 'Bone Ivory,Obsidian Black,Slate Grey',
    materialsCsv: '100% Long-Staple Organic Cotton (240 GSM)',
    stylesCsv: 'Relaxed Tailored Crew Fit',
    tagsCsv: 'classic-crew,essentials,unisex,bestseller,organic-cotton',
    variantInventoryJson: JSON.stringify({
      'XS / Bone Ivory': 8,
      'S / Bone Ivory': 12,
      'M / Bone Ivory': 16,
      'L / Bone Ivory': 14,
      'XL / Bone Ivory': 8,
      'XXL / Bone Ivory': 6,
    }),
    seoTitle: 'Unisex Classic Crew T-Shirt — Bone Ivory | VYNOOX',
    seoDescription:
      'Discover the VYNOOX Unisex Classic Crew T-Shirt in 240 GSM long-staple cotton. Clean architectural tailoring with durable ribbed collar.',
  },
  {
    id: 'unisex-acid-washed-oversized-tee-espresso',
    storeId: 'vynoox',
    name: 'Unisex Acid Washed Oversized Tee — Oxidized Espresso',
    slug: 'unisex-acid-washed-oversized-tee-espresso',
    description:
      'Pigment-dyed in deep roasted espresso and stone-tumbled for a distinctive vintage patina. Every piece in the VYNOOX Acid Wash Series features unique tonal highs and lows across the seams, paired with a generous oversized silhouette and breathable 280 GSM jersey construction.',
    regularPrice: 2099,
    salePrice: 1599,
    compareAtPrice: 2099,
    sku: 'VYN-AW-003',
    barcode: '8904251001032',
    category: 'Oversized Tees',
    collection: 'Acid Wash Series',
    status: 'published',
    stockQuantity: 35,
    lowStockThreshold: 6,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: true,
    bestSeller: false,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#3B2F2B',
      secondaryFill: '#594842',
      backdropColor: '#F4F1EA',
      codeLabel: 'VYN-AW-003',
      titleLabel: 'Acid Washed Oversized Tee · Oxidized Espresso',
      fabricSpec: '280 GSM HEAVY JERSEY · ARTISANAL MINERAL PATINA',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#332824',
      secondaryFill: '#4E3E39',
      backdropColor: '#ECE8DF',
      codeLabel: 'VYN-AW-003',
      titleLabel: 'Acid Washed Oversized Tee · Back Detail',
      fabricSpec: 'TONAL SEAM DISTRESSING · RELAXED SLEEVE DROP',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'S,M,L,XL,XXL',
    colorsCsv: 'Oxidized Espresso,Washed Charcoal',
    materialsCsv: '100% Heavyweight Combed Cotton (280 GSM)',
    stylesCsv: 'Oversized Drop-Shoulder Fit',
    tagsCsv: 'acid-wash,oversized,espresso,new-arrival,unisex',
    variantInventoryJson: JSON.stringify({
      'S / Oxidized Espresso': 7,
      'M / Oxidized Espresso': 10,
      'L / Oxidized Espresso': 9,
      'XL / Oxidized Espresso': 5,
      'XXL / Oxidized Espresso': 4,
    }),
    seoTitle: 'Unisex Acid Washed Oversized Tee — Oxidized Espresso | VYNOOX',
    seoDescription:
      'Artisanal pigment-dyed Unisex Acid Washed Oversized Tee in Oxidized Espresso by VYNOOX. 280 GSM heavyweight luxury streetwear.',
  },
  {
    id: 'unisex-classic-crew-t-shirt-obsidian',
    storeId: 'vynoox',
    name: 'Unisex Classic Crew T-Shirt — Obsidian Noir',
    slug: 'unisex-classic-crew-t-shirt-obsidian',
    description:
      'Engineered for chromatic depth and zero fade, the Obsidian Noir Classic Crew T-Shirt combines reactive-dyed 240 GSM combed cotton with clean architectural proportions. Features flatlock interior seam reinforcement and a custom woven VYNOOX neck label.',
    regularPrice: 1499,
    salePrice: 1199,
    compareAtPrice: 1499,
    sku: 'VYN-CC-004',
    barcode: '8904251001049',
    category: 'Classic Crew Tees',
    collection: 'Core Crewneck Essentials',
    status: 'published',
    stockQuantity: 52,
    lowStockThreshold: 8,
    trackInventory: true,
    allowBackorder: false,
    featured: false,
    newArrival: true,
    bestSeller: true,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'crew-tee',
      primaryFill: '#141416',
      secondaryFill: '#2C2C30',
      backdropColor: '#F2F0EB',
      codeLabel: 'VYN-CC-004',
      titleLabel: 'Unisex Classic Crew T-Shirt · Obsidian Noir',
      fabricSpec: '240 GSM REACTIVE-DYED COTTON · ZERO-FADE FINISH',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'crew-tee',
      primaryFill: '#111113',
      secondaryFill: '#27272B',
      backdropColor: '#EAE7E0',
      codeLabel: 'VYN-CC-004',
      titleLabel: 'Unisex Classic Crew T-Shirt · Reverse View',
      fabricSpec: 'FLATLOCK SEAM REINFORCEMENT · UNISEX FIT',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'XS,S,M,L,XL,XXL',
    colorsCsv: 'Obsidian Noir,Bone Ivory',
    materialsCsv: '100% Long-Staple Organic Cotton (240 GSM)',
    stylesCsv: 'Relaxed Tailored Crew Fit',
    tagsCsv: 'classic-crew,black-tee,unisex,essentials,bestseller',
    variantInventoryJson: JSON.stringify({
      'XS / Obsidian Noir': 6,
      'S / Obsidian Noir': 10,
      'M / Obsidian Noir': 14,
      'L / Obsidian Noir': 12,
      'XL / Obsidian Noir': 6,
      'XXL / Obsidian Noir': 4,
    }),
    seoTitle: 'Unisex Classic Crew T-Shirt — Obsidian Noir | VYNOOX',
    seoDescription:
      'Shop the VYNOOX Unisex Classic Crew T-Shirt in Obsidian Noir. 240 GSM reactive-dyed organic cotton with structured collar rib.',
  },
  {
    id: 'architectural-heavyweight-hoodie-graphite',
    storeId: 'vynoox',
    name: 'Architectural Heavyweight Boxy Hoodie — Washed Graphite',
    slug: 'architectural-heavyweight-hoodie-graphite',
    description:
      'Constructed from 500 GSM loopback French terry cotton with an acid-washed graphite surface treatment. Designed with a double-layered sculptural hood without drawstrings, hidden side-seam pockets, and heavyweight 2x2 rib-knit cuffs and waistband.',
    regularPrice: 3999,
    salePrice: 3299,
    compareAtPrice: 3999,
    sku: 'VYN-HD-005',
    barcode: '8904251001056',
    category: 'Heavyweight Hoodies',
    collection: 'Architectural Outerwear',
    status: 'published',
    stockQuantity: 22,
    lowStockThreshold: 5,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: true,
    bestSeller: true,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'hoodie',
      primaryFill: '#2E3033',
      secondaryFill: '#474A4F',
      backdropColor: '#F4F2ED',
      codeLabel: 'VYN-HD-005',
      titleLabel: 'Architectural Heavyweight Hoodie · Graphite',
      fabricSpec: '500 GSM DOUBLE-FACED FRENCH TERRY · DRAWSTRING-FREE HOOD',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'hoodie',
      primaryFill: '#26282B',
      secondaryFill: '#3E4146',
      backdropColor: '#ECE9E2',
      codeLabel: 'VYN-HD-005',
      titleLabel: 'Architectural Heavyweight Hoodie · Reverse View',
      fabricSpec: 'DROP SHOULDER SEAM · HEAVY 2X2 RIBBED HEM',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: 'S,M,L,XL,XXL',
    colorsCsv: 'Washed Graphite,Obsidian Black,Raw Stone',
    materialsCsv: '100% Heavyweight Loopback French Terry (500 GSM)',
    stylesCsv: 'Boxy Cropped Architectural Fit',
    tagsCsv: 'hoodie,heavyweight,outerwear,acid-wash,luxury',
    variantInventoryJson: JSON.stringify({
      'S / Washed Graphite': 4,
      'M / Washed Graphite': 6,
      'L / Washed Graphite': 6,
      'XL / Washed Graphite': 4,
      'XXL / Washed Graphite': 2,
    }),
    seoTitle: 'Architectural Heavyweight Boxy Hoodie | VYNOOX',
    seoDescription:
      '500 GSM loopback French terry hoodie in acid-washed graphite by VYNOOX. Minimalist drawstring-free hood and architectural drape.',
  },
  {
    id: 'tailored-wide-leg-cargo-trouser-slate',
    storeId: 'vynoox',
    name: 'Tailored Wide-Leg Cargo Trouser — Brutalist Slate',
    slug: 'tailored-wide-leg-cargo-trouser-slate',
    description:
      'Bridging sartorial tailoring and utilitarian streetwear. Cut from high-density 340 GSM brushed cotton gabardine with deep front pleats, concealed magnetic gusset cargo pockets, and adjustable ankle tabs for versatile silhouette styling.',
    regularPrice: 3499,
    salePrice: 2799,
    compareAtPrice: 3499,
    sku: 'VYN-CR-006',
    barcode: '8904251001063',
    category: 'Cargo & Trousers',
    collection: 'Tailored Street Bottoms',
    status: 'published',
    stockQuantity: 19,
    lowStockThreshold: 5,
    trackInventory: true,
    allowBackorder: false,
    featured: true,
    newArrival: true,
    bestSeller: false,
    primaryImage: createGarmentStudioSvg({
      garmentType: 'cargo',
      primaryFill: '#3A3F42',
      secondaryFill: '#52585C',
      backdropColor: '#F3F1EC',
      codeLabel: 'VYN-CR-006',
      titleLabel: 'Tailored Wide-Leg Cargo Trouser · Slate',
      fabricSpec: '340 GSM COTTON GABARDINE · CONCEALED GUSSET POCKETS',
      viewAngle: 'FRONT',
    }),
    secondaryImage: createGarmentStudioSvg({
      garmentType: 'cargo',
      primaryFill: '#32373A',
      secondaryFill: '#494F53',
      backdropColor: '#EBE8E0',
      codeLabel: 'VYN-CR-006',
      titleLabel: 'Tailored Wide-Leg Cargo Trouser · Reverse View',
      fabricSpec: 'ADJUSTABLE HEM TABS · ARTICULATED KNEE PLEATS',
      viewAngle: 'BACK',
    }),
    videoUrl: '',
    sizesCsv: '28,30,32,34,36',
    colorsCsv: 'Brutalist Slate,Obsidian Black,Warm Khaki',
    materialsCsv: '100% High-Density Brushed Cotton Gabardine (340 GSM)',
    stylesCsv: 'Wide-Leg Pleated Architectural Cut',
    tagsCsv: 'cargo,trousers,bottoms,tailored,streetwear',
    variantInventoryJson: JSON.stringify({
      '28 / Brutalist Slate': 3,
      '30 / Brutalist Slate': 5,
      '32 / Brutalist Slate': 5,
      '34 / Brutalist Slate': 4,
      '36 / Brutalist Slate': 2,
    }),
    seoTitle: 'Tailored Wide-Leg Cargo Trouser — Brutalist Slate | VYNOOX',
    seoDescription:
      'High-density 340 GSM cotton gabardine wide-leg cargo trousers with front pleats and concealed pockets by VYNOOX.',
  },
];

export const INITIAL_COLLECTIONS: CollectionItem[] = [
  {
    id: 'acid-wash-series',
    storeId: 'vynoox',
    name: 'Acid Wash Series',
    slug: 'acid-wash-series',
    description:
      'Artisanal mineral and enzyme-washed 280 GSM heavyweight garments with one-of-a-kind vintage tonal depth.',
    image: createGarmentStudioSvg({
      garmentType: 'oversized-tee',
      primaryFill: '#27272A',
      secondaryFill: '#3F3F46',
      backdropColor: '#EFECE6',
      codeLabel: 'COLLECTION 01',
      titleLabel: 'Acid Wash Series',
      fabricSpec: '280 GSM HEAVYWEIGHT · ARTISANAL MINERAL FINISH',
    }),
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'core-crewneck-essentials',
    storeId: 'vynoox',
    name: 'Core Crewneck Essentials',
    slug: 'core-crewneck-essentials',
    description:
      'Precision-cut 240 GSM long-staple cotton crewnecks engineered for structural longevity and clean daily drape.',
    image: createGarmentStudioSvg({
      garmentType: 'crew-tee',
      primaryFill: '#EAE5D9',
      secondaryFill: '#CBC4B4',
      backdropColor: '#F4F2ED',
      codeLabel: 'COLLECTION 02',
      titleLabel: 'Core Crewneck Essentials',
      fabricSpec: '240 GSM SUPIMA ORGANIC COTTON · TAILORED RIB',
    }),
    featured: true,
    sortOrder: 2,
  },
  {
    id: 'architectural-outerwear',
    storeId: 'vynoox',
    name: 'Architectural Outerwear',
    slug: 'architectural-outerwear',
    description:
      '500 GSM double-faced French terry hoodies and structured layering silhouettes crafted for cold-weather presence.',
    image: createGarmentStudioSvg({
      garmentType: 'hoodie',
      primaryFill: '#2E3033',
      secondaryFill: '#474A4F',
      backdropColor: '#EFECE6',
      codeLabel: 'COLLECTION 03',
      titleLabel: 'Architectural Outerwear',
      fabricSpec: '500 GSM FRENCH TERRY · SCULPTURAL PROPORTIONS',
    }),
    featured: true,
    sortOrder: 3,
  },
  {
    id: 'tailored-street-bottoms',
    storeId: 'vynoox',
    name: 'Tailored Street Bottoms',
    slug: 'tailored-street-bottoms',
    description:
      'Pleated wide-leg cargo trousers and heavyweight twill bottoms combining sartorial lines with utility.',
    image: createGarmentStudioSvg({
      garmentType: 'cargo',
      primaryFill: '#3A3F42',
      secondaryFill: '#52585C',
      backdropColor: '#F3F1EC',
      codeLabel: 'COLLECTION 04',
      titleLabel: 'Tailored Street Bottoms',
      fabricSpec: '340 GSM BRUSHED GABARDINE · WIDE-LEG CUT',
    }),
    featured: false,
    sortOrder: 4,
  },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'oversized-tees',
    storeId: 'vynoox',
    name: 'Oversized Tees',
    slug: 'oversized-tees',
    description: '280 GSM drop-shoulder boxy tees with mineral and acid-washed treatments.',
  },
  {
    id: 'classic-crew-tees',
    storeId: 'vynoox',
    name: 'Classic Crew Tees',
    slug: 'classic-crew-tees',
    description: '240 GSM structured crewnecks with reinforced high-density collar ribs.',
  },
  {
    id: 'heavyweight-hoodies',
    storeId: 'vynoox',
    name: 'Heavyweight Hoodies',
    slug: 'heavyweight-hoodies',
    description: '500 GSM loopback French terry pullovers with minimalist drawstring-free hoods.',
  },
  {
    id: 'cargo-and-trousers',
    storeId: 'vynoox',
    name: 'Cargo & Trousers',
    slug: 'cargo-and-trousers',
    description: 'Tailored wide-leg utility trousers in brushed cotton gabardine.',
  },
];

export const INITIAL_COUPONS: CouponItem[] = [
  {
    id: 'vynoox15',
    storeId: 'vynoox',
    code: 'VYNOOX15',
    type: 'percentage',
    value: 15,
    minPurchase: 1400,
    expiryDate: '2027-12-31',
    usageLimit: 500,
    usedCount: 18,
    appliesTo: 'all',
    active: true,
  },
  {
    id: 'atelier500',
    storeId: 'vynoox',
    code: 'ATELIER500',
    type: 'fixed',
    value: 500,
    minPurchase: 2999,
    expiryDate: '2027-12-31',
    usageLimit: 250,
    usedCount: 9,
    appliesTo: 'all',
    active: true,
  },
  {
    id: 'freeship',
    storeId: 'vynoox',
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    minPurchase: 999,
    expiryDate: '2027-12-31',
    usageLimit: 1000,
    usedCount: 42,
    appliesTo: 'all',
    active: true,
  },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-101',
    storeId: 'vynoox',
    productId: 'unisex-acid-washed-oversized-tee-charcoal',
    productName: 'Unisex Acid Washed Oversized Tee — Charcoal Obsidian',
    authorUid: 'verified-client-01',
    authorName: 'Aarav Mehta · Creative Director, Mumbai',
    rating: 5,
    title: 'Unmatched 280 GSM drape and authentic mineral wash',
    comment:
      'After testing dozens of streetwear blanks, VYNOOX stands in a league of its own. The collar rib stays crisp after 15 washes and the charcoal acid wash looks like a boutique Milanese archive piece.',
    reviewImage: '',
    verifiedPurchase: true,
    status: 'approved',
  },
  {
    id: 'rev-102',
    storeId: 'vynoox',
    productId: 'unisex-classic-crew-t-shirt-bone',
    productName: 'Unisex Classic Crew T-Shirt — Bone Ivory',
    authorUid: 'verified-client-02',
    authorName: 'Rhea Kapoor · Architectural Stylist, New Delhi',
    rating: 5,
    title: 'Zero transparency and clean shoulder architecture',
    comment:
      'Most off-white tees are too thin, but this 240 GSM Bone Ivory crew has substantial weight while remaining breathable. Ordered three more for my studio wardrobe.',
    reviewImage: '',
    verifiedPurchase: true,
    status: 'approved',
  },
  {
    id: 'rev-103',
    storeId: 'vynoox',
    productId: 'architectural-heavyweight-hoodie-graphite',
    productName: 'Architectural Heavyweight Boxy Hoodie — Washed Graphite',
    authorUid: 'verified-client-03',
    authorName: 'Kabir Sen · Industrial Designer, Bengaluru',
    rating: 5,
    title: '500 GSM French terry feels like luxury armor',
    comment:
      'The drawstring-free double hood holds its sculptural form effortlessly. Worth every rupee.',
    reviewImage: '',
    verifiedPurchase: true,
    status: 'approved',
  },
];

export const INITIAL_CMS_PAGES: CMSPage[] = [
  {
    id: 'about-us',
    storeId: 'vynoox',
    title: 'About VYNOOX',
    slug: 'about-us',
    subtitle: 'Architectural Streetwear & Heavyweight Essentials Engineered for Permanence',
    content: `VYNOOX was founded on a singular conviction: everyday garments should be engineered with the same structural rigor as brutalist architecture.

Rather than chasing disposable seasonal trends, the VYNOOX Atelier focuses on fabric density, mineral and enzyme surface treatments, and precision boxy proportions. Every Unisex Acid Washed Oversized Tee and Classic Crew T-Shirt is milled from long-staple combed cotton between 240 GSM and 500 GSM, pre-shrunk, and finished with high-density ribbed collars that never lose their tension.

01. Heavyweight Materiality
We source exclusively 100% combed organic and Supima-grade cotton yarns. Our signature 280 GSM jersey provides an unmistakable architectural drape while remaining breathable across climates.

02. Artisanal Mineral & Acid Wash
Each garment in our Acid Wash Series undergoes controlled enzyme tumbling and mineral pigment baths, ensuring subtle seam highlights and an authentic vintage patina unique to every piece.

03. Ethical Small-Batch Production
Every VYNOOX release is produced in strictly audited small batches with reinforced flatlock seams and zero plastic packaging.`,
    seoTitle: 'About Us — The VYNOOX Atelier & Craftsmanship Philosophy',
    seoDescription:
      'Learn how VYNOOX engineers 240–500 GSM heavyweight luxury streetwear and acid-washed essentials.',
    published: true,
  },
  {
    id: 'contact-us',
    storeId: 'vynoox',
    title: 'Contact Concierge',
    slug: 'contact-us',
    subtitle: 'Direct Client Care, Styling Consultations & Wholesale Inquiries',
    content: `Our Client Concierge team is available Monday through Saturday, 10:00 AM – 7:00 PM IST to assist with sizing guidance, bespoke bulk orders, and order tracking.

Atelier & Dispatch Hub:
VYNOOX Design Studio, Plot 42, Industrial Estate, Lower Parel, Mumbai, Maharashtra 400013, India

Electronic Mail:
concierge@vynoox.com

Direct Client Line:
+91 (022) 4890-7721`,
    seoTitle: 'Contact Us — VYNOOX Client Concierge',
    seoDescription: 'Connect with VYNOOX Client Concierge for order support, sizing advice, and press inquiries.',
    published: true,
  },
  {
    id: 'faq',
    storeId: 'vynoox',
    title: 'Frequently Asked Questions',
    slug: 'faq',
    subtitle: 'Sizing, Garment Care, Shipping & Payment Information',
    content: `Q: How do VYNOOX Oversized Tees fit compared to Classic Crew T-Shirts?
A: Our Unisex Acid Washed Oversized Tees feature a generous drop-shoulder boxy cut. Take your true size for the intended architectural oversized look, or size down one size for a standard relaxed fit. Our Unisex Classic Crew T-Shirts feature a true-to-size relaxed tailored cut.

Q: How should I wash acid-washed heavyweight garments?
A: Turn the garment inside out and machine wash cold (30°C) on a gentle cycle with mild liquid detergent. Do not bleach or tumble dry on high heat; lay flat or hang in shade to preserve the 280 GSM cotton fibers and mineral wash patina.

Q: Do you offer Cash on Delivery (COD) and Razorpay online payments?
A: Yes. We support instant encrypted online payments via Razorpay (UPI, Cards, NetBanking) as well as Cash on Delivery across serviceable PIN codes in India.

Q: How long does delivery take?
A: Orders are dispatched within 24–48 hours from our studio warehouse. Metro cities receive delivery in 2–4 business days; rest of India takes 4–6 business days.`,
    seoTitle: 'FAQ — Sizing, Care & Shipping | VYNOOX',
    seoDescription: 'Answers to common questions about VYNOOX heavyweight tees, sizing, acid-wash care, and delivery.',
    published: true,
  },
  {
    id: 'privacy-policy',
    storeId: 'vynoox',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    subtitle: 'Data Protection, PII Isolation & Encryption Standards',
    content: `At VYNOOX, protecting your personal data is fundamental to our relationship with our clients.

1. Information We Collect
When you register an account or place an order, we collect your name, email address, phone number, and shipping address strictly for order fulfillment and client support.

2. Payment Security
VYNOOX never stores raw credit card numbers or banking passwords. All online transactions are processed through PCI-DSS compliant payment gateways with server-side HMAC-SHA256 cryptographic signature verification.

3. Strict PII Isolation
Customer profiles and order histories are protected by zero-trust database security rules ensuring only you and authorized order fulfillment administrators can access your records.`,
    seoTitle: 'Privacy Policy | VYNOOX',
    seoDescription: 'Read the VYNOOX Privacy Policy covering personal data protection and payment security.',
    published: true,
  },
  {
    id: 'terms-and-conditions',
    storeId: 'vynoox',
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    subtitle: 'Conditions of Sale, Intellectual Property & Store Usage',
    content: `Welcome to VYNOOX. By accessing our digital storefront or placing an order, you agree to the following Terms and Conditions:

1. Product Authenticity & Artisanal Variation
Due to the artisanal enzyme and mineral acid-wash process used on our garments, subtle variations in shading and seam distressing are intentional hallmarks of craftsmanship and not manufacturing defects.

2. Pricing & Taxes
All prices displayed on the storefront are inclusive of applicable Goods and Services Tax (GST) unless stated otherwise.

3. Order Acceptance & Verification
An order is marked as Paid only after backend cryptographic signature verification or confirmed Cash on Delivery collection upon dispatch.`,
    seoTitle: 'Terms and Conditions | VYNOOX',
    seoDescription: 'Official Terms and Conditions for purchasing from the VYNOOX online store.',
    published: true,
  },
  {
    id: 'shipping-policy',
    storeId: 'vynoox',
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    subtitle: 'Domestic & Express Dispatch Timelines, Free Shipping Thresholds & Tracking',
    content: `1. Processing & Dispatch
Every VYNOOX garment undergoes a 4-point quality inspection and steam-finishing check prior to packaging. Orders placed before 2:00 PM IST ship the same or next business day.

2. Shipping Rates & Free Delivery
Complimentary standard shipping is automatically applied on all orders above our Free Shipping Threshold (₹1,999). Standard orders below the threshold incur a flat ₹99 logistics fee.

3. Real-Time Tracking
Once your order transitions to Shipped status, a live AWB tracking number and carrier name appear directly in your My Orders dashboard.`,
    seoTitle: 'Shipping Policy | VYNOOX',
    seoDescription: 'Delivery timelines, free shipping thresholds, and order tracking policies for VYNOOX.',
    published: true,
  },
  {
    id: 'return-and-refund-policy',
    storeId: 'vynoox',
    title: 'Return and Refund Policy',
    slug: 'return-and-refund-policy',
    subtitle: '7-Day Hassle-Free Size Exchanges & Quality Guarantee',
    content: `1. 7-Day Return & Exchange Window
We accept returns and size exchanges within 7 days of delivery, provided the garment is unworn, unwashed, and retains its original woven tags and biodegradable garment bag.

2. Reverse Pickup Process
Initiate a return or exchange request via your My Orders page or by contacting concierge@vynoox.com. Our courier partner will arrange a doorstep reverse pickup within 48 hours.

3. Refund Settlement
Once the returned garment passes studio inspection, refunds are processed within 3–5 business days to your original payment method or bank account.`,
    seoTitle: 'Return and Refund Policy | VYNOOX',
    seoDescription: '7-day return, size exchange, and refund terms for VYNOOX apparel.',
    published: true,
  },
];

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-announcement',
    type: 'announcement_bar',
    name: 'Announcement Bar',
    visible: true,
    order: 1,
    heading: 'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹1,999 · USE CODE VYNOOX15 FOR 15% OFF',
    subheading: '',
    description: '',
    buttonText: 'Shop Archive',
    buttonLink: 'shop-all',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#111111',
    textColor: '#FAF9F6',
    layout: 'centered',
    spacingY: 'compact',
  },
  {
    id: 'sec-hero',
    type: 'hero_banner',
    name: 'Full-Screen Cinematic Hero',
    visible: true,
    order: 2,
    heading: 'Architectural Proportions. Heavyweight Permanence.',
    subheading: 'VYNOOX · ARCHIVE 04',
    description:
      'Milled from 280 GSM combed organic cotton and finished with artisanal mineral acid washes. Engineered in small batches for enduring structure.',
    buttonText: 'Shop New Arrivals',
    buttonLink: 'new-arrivals',
    secondaryButtonText: 'Explore Collections',
    secondaryButtonLink: 'collections',
    backgroundImage: HERO_CAMPAIGN_SVG,
    videoUrl: '',
    backgroundColor: '#0C0C0C',
    textColor: '#FAF9F6',
    layout: 'centered',
    spacingY: 'spacious',
  },
  {
    id: 'sec-new-arrivals',
    type: 'new_arrivals',
    name: 'New Arrivals Product Showcase',
    visible: true,
    order: 3,
    heading: 'NEW ARRIVALS',
    subheading: 'Discover our latest essentials.',
    description: 'Freshly milled small-batch editions straight from the VYNOOX production floor.',
    buttonText: 'View All New Arrivals',
    buttonLink: 'new-arrivals',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#FAF9F6',
    textColor: '#111111',
    layout: 'grid-3',
    spacingY: 'normal',
  },
  {
    id: 'sec-ugc-community',
    type: 'ugc_video_showcase',
    name: 'VYNOOX Community UGC Video Showcase',
    visible: true,
    order: 4,
    heading: 'VYNOOX COMMUNITY',
    subheading: 'Real people. Real style. Real stories.',
    description: 'Vertical 9:16 community styling lookbooks from across Mumbai, Bengaluru, New Delhi, and London.',
    buttonText: 'Shop Featured Looks',
    buttonLink: 'shop-all',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#111111',
    textColor: '#FAF9F6',
    layout: 'grid-4',
    spacingY: 'normal',
  },
  {
    id: 'sec-featured-collections',
    type: 'featured_collections',
    name: 'Featured Collections',
    visible: true,
    order: 5,
    heading: 'Curated Capsules',
    subheading: '01. CATEGORICAL ARCHITECTURE',
    description: 'Explore our signature fabrications across heavyweight jersey, loopback French terry, and brushed cotton gabardine.',
    buttonText: 'View All Capsules',
    buttonLink: 'collections',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#FAF9F6',
    textColor: '#111111',
    layout: 'grid-3',
    spacingY: 'normal',
  },
  {
    id: 'sec-best-sellers',
    type: 'best_sellers',
    name: 'Best Sellers',
    visible: true,
    order: 6,
    heading: 'Best Sellers',
    subheading: '02. MOST REQUESTED SILHOUETTES',
    description: 'Our defining Unisex Acid Washed Oversized Tees and Classic Crew T-Shirts with the highest repeat-client reorder rate.',
    buttonText: 'Explore Best Sellers',
    buttonLink: 'best-sellers',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#F3F1EC',
    textColor: '#111111',
    layout: 'grid-3',
    spacingY: 'normal',
  },
  {
    id: 'sec-brand-story',
    type: 'brand_story',
    name: 'Brand Story & Materiality',
    visible: true,
    order: 7,
    heading: 'Built on 280 GSM Heavyweight Integrity',
    subheading: '03. MATERIAL SPECIFICATIONS & PROOF',
    description:
      'Every VYNOOX garment is engineered around three measurable standards: 240–500 GSM long-staple cotton density, multi-stage enzyme & mineral washing for zero shrinkage, and 1.2-inch high-tension ribbed collars.',
    buttonText: 'Read Our Story',
    buttonLink: 'about-us',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#141413',
    textColor: '#FAF9F6',
    layout: 'editorial',
    spacingY: 'spacious',
  },
  {
    id: 'sec-newsletter',
    type: 'newsletter',
    name: 'Newsletter Dispatch',
    visible: true,
    order: 8,
    heading: 'Join The Private Archive',
    subheading: 'EARLY ACCESS & SMALL-BATCH DISPATCHES',
    description: 'Receive private invitations to limited acid-wash drops and atelier restocks before public release.',
    buttonText: 'Subscribe',
    buttonLink: 'home',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#F3F1EC',
    textColor: '#111111',
    layout: 'centered',
    spacingY: 'normal',
  },
  {
    id: 'sec-featured-products',
    type: 'featured_products',
    name: 'Featured Products',
    visible: false,
    order: 9,
    heading: 'Signature Atelier Editions',
    subheading: 'ESSENTIAL GARMENTS',
    description: 'Our defining Unisex Acid Washed Oversized Tees and Classic Crew T-Shirts.',
    buttonText: 'Shop Complete Catalog',
    buttonLink: 'shop-all',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#FAF9F6',
    textColor: '#111111',
    layout: 'grid-3',
    spacingY: 'normal',
  },
  {
    id: 'sec-testimonials',
    type: 'customer_testimonials',
    name: 'Customer Testimonials',
    visible: false,
    order: 10,
    heading: 'Verified Client Perspectives',
    subheading: 'FIELD REPORTS',
    description: 'Direct feedback from creative directors, architects, and designers wearing VYNOOX daily.',
    buttonText: 'Shop Best Sellers',
    buttonLink: 'best-sellers',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#FAF9F6',
    textColor: '#111111',
    layout: 'grid-3',
    spacingY: 'normal',
  },
  {
    id: 'sec-promo-banner',
    type: 'promotional_banner',
    name: 'Promotional Banner',
    visible: false,
    order: 11,
    heading: 'Private Archive Access — 15% Off First Acquisition',
    subheading: 'LIMITED EDITION PRIVILEGE',
    description: 'Apply code VYNOOX15 at checkout for 15% off orders above ₹1,400.',
    buttonText: 'Claim Offer',
    buttonLink: 'shop-all',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#1C1B19',
    textColor: '#FAF9F6',
    layout: 'centered',
    spacingY: 'compact',
  },
  {
    id: 'sec-social-gallery',
    type: 'social_media_gallery',
    name: 'Social Media Lookbook Gallery',
    visible: false,
    order: 12,
    heading: 'In The Field · @VYNOOX.OFFICIAL',
    subheading: 'COMMUNITY EDITORIAL',
    description: 'Tag @vynoox.official to be featured in our seasonal lookbook archive.',
    buttonText: 'Explore Lookbook',
    buttonLink: 'collections',
    backgroundImage: '',
    videoUrl: '',
    backgroundColor: '#FAF9F6',
    textColor: '#111111',
    layout: 'grid-4',
    spacingY: 'normal',
  },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  logoText: 'VYNOOX',
  logoImageUrl: '',
  faviconUrl: '',
  primaryColor: '#111111',
  secondaryColor: '#525252',
  backgroundColor: '#FAF9F6',
  textColor: '#111111',
  headingFont: 'Cormorant Garamond',
  bodyFont: 'Plus Jakarta Sans',
  baseFontSize: '15px',
  buttonStyle: 'sharp',
  borderRadius: '2px',
  headerDesign: 'minimal-3-zone',
  footerDesign: 'editorial-4-col',
  productCardDesign: 'minimal-editorial',
  productPageLayout: 'sticky-split',
  collectionPageLayout: 'sidebar-filters',
  pageWidth: '1440px',
  sectionSpacing: 'standard',
  darkMode: false,
};

export const DEFAULT_GENERAL_SETTINGS: StoreGeneralSettings = {
  storeName: 'VYNOOX',
  storeLogo: '',
  storeEmail: 'concierge@vynoox.com',
  contactNumber: '+91 (022) 4890-7721',
  businessAddress: 'Plot 42, Industrial Estate, Lower Parel, Mumbai, Maharashtra 400013, India',
  currency: 'INR',
  currencySymbol: '₹',
  country: 'India',
  timeZone: 'Asia/Kolkata (IST)',
  instagramUrl: 'https://instagram.com/vynoox',
  twitterUrl: 'https://x.com/vynoox',
  youtubeUrl: 'https://youtube.com/@vynoox',
  faviconUrl: '',
  maintenanceMode: false,
  announcementBarText:
    'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹1,999 · USE CODE VYNOOX15 FOR 15% OFF',
  footerCopyright: '© 2026 VYNOOX ATELIER. All Rights Reserved.',
  footerTagline:
    'International luxury streetwear and heavyweight acid-washed essentials engineered for permanence.',
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  standardShippingCharge: 99,
  expressShippingCharge: 249,
  freeShippingThreshold: 1999,
  serviceablePinCodesCsv: '*',
  estimatedDeliveryText: '2–4 Business Days (Metro) · 4–6 Business Days (Rest of India)',
  defaultCarrier: 'BlueDart Express / Delhivery Prime',
  zones: [
    {
      id: 'zone-metro',
      name: 'Tier-1 Metro Cities',
      statesCsv: 'Maharashtra,Delhi,Karnataka,Tamil Nadu,Telangana',
      rate: 99,
      estimatedDays: '2–3 Business Days',
    },
    {
      id: 'zone-national',
      name: 'National Standard',
      statesCsv: 'All Other Indian States & UTs',
      rate: 129,
      estimatedDays: '4–6 Business Days',
    },
  ],
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  razorpayEnabled: true,
  razorpayKeyId: 'rzp_live_vynoox_atelier',
  codEnabled: true,
  codMaxOrderAmount: 15000,
  codExtraFee: 0,
  stripeEnabled: false,
  stripePublishableKey: '',
  requireBackendSignatureVerification: true,
};

export const DEFAULT_MARKETING_SETTINGS: MarketingSettings = {
  defaultSeoTitle: 'VYNOOX — Architectural Luxury Streetwear & Heavyweight Essentials',
  defaultMetaDescription:
    'Shop VYNOOX Unisex Acid Washed Oversized Tees, Classic Crew T-Shirts, and 500 GSM Heavyweight Hoodies.',
  socialShareImageUrl: '',
  googleAnalyticsId: 'G-VYNOOX2026',
  metaPixelId: '9841203948102',
  newsletterHeading: 'Join The Private Archive',
  newsletterSubtext: 'Receive early access to small-batch acid-wash releases and restocks.',
  abandonedCartRecoveryEnabled: true,
  abandonedCartDiscountCode: 'VYNOOX15',
  promoBannerEnabled: true,
  promoBannerText: 'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹1,999 · CODE: VYNOOX15',
};

export const DEFAULT_NAVIGATION_LINKS: NavigationLink[] = [
  { id: 'nav-1', label: 'Shop All', targetPage: 'shop-all', location: 'header', order: 1 },
  { id: 'nav-2', label: 'New Arrivals', targetPage: 'new-arrivals', location: 'header', order: 2 },
  { id: 'nav-3', label: 'Best Sellers', targetPage: 'best-sellers', location: 'header', order: 3 },
  { id: 'nav-4', label: 'Collections', targetPage: 'collections', location: 'header', order: 4 },
  { id: 'nav-5', label: 'About Us', targetPage: 'about-us', location: 'header', order: 5 },
  { id: 'nav-f1', label: 'Shop All', targetPage: 'shop-all', location: 'footer_shop', order: 1 },
  { id: 'nav-f2', label: 'New Arrivals', targetPage: 'new-arrivals', location: 'footer_shop', order: 2 },
  { id: 'nav-f3', label: 'Best Sellers', targetPage: 'best-sellers', location: 'footer_shop', order: 3 },
  { id: 'nav-f4', label: 'Collections', targetPage: 'collections', location: 'footer_shop', order: 4 },
  { id: 'nav-f5', label: 'Wishlist', targetPage: 'wishlist', location: 'footer_shop', order: 5 },
  { id: 'nav-p1', label: 'About Us', targetPage: 'about-us', location: 'footer_policies', order: 1 },
  { id: 'nav-p2', label: 'Contact Us', targetPage: 'contact-us', location: 'footer_policies', order: 2 },
  { id: 'nav-p3', label: 'FAQ', targetPage: 'faq', location: 'footer_policies', order: 3 },
  { id: 'nav-p4', label: 'Shipping Policy', targetPage: 'shipping-policy', location: 'footer_policies', order: 4 },
  { id: 'nav-p5', label: 'Return & Refund Policy', targetPage: 'return-and-refund-policy', location: 'footer_policies', order: 5 },
  { id: 'nav-p6', label: 'Privacy Policy', targetPage: 'privacy-policy', location: 'footer_policies', order: 6 },
  { id: 'nav-p7', label: 'Terms & Conditions', targetPage: 'terms-and-conditions', location: 'footer_policies', order: 7 },
];

export const HERO_SLIDE_2_SVG = createCinematicHeroBackdropSvg({
  bgStart: '#121316',
  bgMid: '#1E2024',
  bgEnd: '#2B2E33',
  glowColor: '#D6D3D1',
  accentTone: '#71717A',
  editionLabel: 'VYNOOX · 500 GSM HEAVYWEIGHT MONOLITH FLEECE',
  aspect: 'desktop',
});

export const HERO_SLIDE_3_SVG = createCinematicHeroBackdropSvg({
  bgStart: '#181613',
  bgMid: '#26231E',
  bgEnd: '#35312A',
  glowColor: '#EAE5D9',
  accentTone: '#A8A29E',
  editionLabel: 'VYNOOX · CORE CREWNECK ESSENTIALS · 240 GSM SUPIMA',
  aspect: 'desktop',
});

// Default empty video URL until a real MP4 is uploaded or selected in Admin
export const DEFAULT_CINEMATIC_MP4_URL = '';

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  heightPreset: '100vh',
  desktopHeight: '100vh',
  tabletHeight: '85vh',
  mobileHeight: '82vh',
  contentMaxWidth: '820px',
  autoSlideshow: true,
  defaultSlideDurationSeconds: 7,
  showManualNav: true,
  enableTextAnimations: true,
  slides: [
    {
      id: 'hero-slide-1',
      enabled: true,
      order: 1,
      mediaMode: 'image',
      desktopImageUrl: HERO_CAMPAIGN_SVG,
      mobileImageUrl: HERO_CAMPAIGN_MOBILE_SVG,
      desktopVideoUrl: '',
      mobileVideoUrl: '',
      fallbackImageUrl: HERO_CAMPAIGN_SVG,
      focalPoint: 'center center',
      videoScale: 'cover',
      overlayColor: '#09090B',
      overlayOpacity: 42,
      brandLabel: 'VYNOOX ATELIER · ARCHIVE 04',
      heading: 'Architectural Proportions. Heavyweight Permanence.',
      description:
        'Custom-milled 280 GSM organic cotton finished with artisanal mineral acid washes. Engineered in small batches for enduring structure and effortless drape.',
      primaryButtonText: 'Shop New Arrivals',
      primaryButtonLink: 'new-arrivals',
      primaryButtonStyle: 'solid-light',
      secondaryButtonText: 'Explore Collections',
      secondaryButtonLink: 'collections',
      secondaryButtonStyle: 'outline-light',
      fontFamily: 'Cormorant Garamond',
      fontSize: 'display',
      fontWeight: '600',
      textColor: '#FAF9F6',
      textAlign: 'left',
      textPosition: 'bottom-left',
      textSpacing: 'relaxed',
      durationSeconds: 7,
    },
    {
      id: 'hero-slide-2',
      enabled: false,
      order: 2,
      mediaMode: 'image',
      desktopImageUrl: HERO_SLIDE_2_SVG,
      mobileImageUrl: HERO_CAMPAIGN_MOBILE_SVG,
      desktopVideoUrl: '',
      mobileVideoUrl: '',
      fallbackImageUrl: HERO_SLIDE_2_SVG,
      focalPoint: 'center center',
      videoScale: 'cover',
      overlayColor: '#000000',
      overlayOpacity: 50,
      brandLabel: 'MOTION LOOKBOOK · 500 GSM LOOPBACK',
      heading: 'The Acid Washed Oversized Series.',
      description:
        'Drop-shoulder silhouettes with high-tension 1.2-inch ribbed collars and zero-shrinkage enzyme treatments.',
      primaryButtonText: 'Explore Acid Wash Series',
      primaryButtonLink: 'shop-all',
      primaryButtonStyle: 'solid-light',
      secondaryButtonText: 'View Best Sellers',
      secondaryButtonLink: 'best-sellers',
      secondaryButtonStyle: 'glass-minimal',
      fontFamily: 'Cormorant Garamond',
      fontSize: 'display',
      fontWeight: '600',
      textColor: '#FAF9F6',
      textAlign: 'center',
      textPosition: 'center',
      textSpacing: 'normal',
      durationSeconds: 8,
    },
    {
      id: 'hero-slide-3',
      enabled: false,
      order: 3,
      mediaMode: 'image',
      desktopImageUrl: HERO_SLIDE_3_SVG,
      mobileImageUrl: HERO_CAMPAIGN_MOBILE_SVG,
      desktopVideoUrl: '',
      mobileVideoUrl: '',
      fallbackImageUrl: HERO_SLIDE_3_SVG,
      focalPoint: '50% 40%',
      videoScale: 'cover',
      overlayColor: '#111111',
      overlayOpacity: 38,
      brandLabel: 'CORE ESSENTIALS · 240 GSM SUPIMA',
      heading: 'Unisex Classic Crew & Cargo Architecture.',
      description:
        'Refined daily uniform pieces tailored from long-staple cotton jersey and brushed cotton twill.',
      primaryButtonText: 'Shop Classic Crew Tees',
      primaryButtonLink: 'shop-all',
      primaryButtonStyle: 'solid-light',
      secondaryButtonText: 'Our Material Story',
      secondaryButtonLink: 'about-us',
      secondaryButtonStyle: 'outline-light',
      fontFamily: 'Cormorant Garamond',
      fontSize: 'xl',
      fontWeight: '600',
      textColor: '#FAF9F6',
      textAlign: 'left',
      textPosition: 'bottom-left',
      textSpacing: 'normal',
      durationSeconds: 7,
    },
  ],
};

export const DEFAULT_NEW_ARRIVALS_CONFIG: NewArrivalsShowcaseConfig = {
  visible: true,
  heading: 'NEW ARRIVALS',
  subtitle: 'Discover our latest essentials.',
  maxProducts: 6,
  gridColumns: 3,
  productOrder: 'featured',
  selectedProductIds: [],
  backgroundColor: '#FAF9F6',
  textColor: '#111111',
  sectionSpacing: 'normal',
  viewAllButtonText: 'View All New Arrivals',
  viewAllButtonLink: 'new-arrivals',
};

export const DEFAULT_UGC_CONFIG: UgcSectionConfig = {
  visible: true,
  heading: 'VYNOOX COMMUNITY',
  subtitle: 'Real people. Real style. Real stories.',
  maxVisibleVideos: 4,
  cardWidth: 'standard',
  aspectRatio: '9:16',
  backgroundColor: '#111111',
  textColor: '#FAF9F6',
  hoverAutoplay: true,
  mutedByDefault: true,
  loopVideos: true,
  videos: [
    {
      id: 'ugc-vid-1',
      enabled: true,
      featured: true,
      order: 1,
      customerHandle: '@arjun.k',
      caption: 'Styling the 280 GSM Acid Washed Oversized Tee in Charcoal Obsidian for studio days in Mumbai.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-in-casual-clothes-posing-in-a-studio-41744-large.mp4',
      thumbnailUrl: createUgcVerticalPosterSvg({
        bgTop: '#18181B',
        bgBottom: '#09090B',
        garmentTone: '#27272A',
        accentColor: '#D4D4D8',
        handle: '@arjun.k',
        garmentTag: 'VYN-AW-001 · CHARCOAL OBSIDIAN',
        locationTag: 'MUMBAI · LOOK 01',
      }),
      productId: 'unisex-acid-washed-oversized-tee-charcoal',
      productTagLabel: 'Acid Washed Oversized Tee — Charcoal',
      productSlug: 'unisex-acid-washed-oversized-tee-charcoal',
      durationSeconds: 12,
      fileSizeBytes: 2450000,
    },
    {
      id: 'ugc-vid-2',
      enabled: true,
      featured: true,
      order: 2,
      customerHandle: '@mira.deshmukh',
      caption: 'Boxy drop-shoulder drape on the Vintage Olive Acid Washed Tee paired with wide-leg trousers.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-posing-for-the-camera-in-a-studio-41739-large.mp4',
      thumbnailUrl: createUgcVerticalPosterSvg({
        bgTop: '#242921',
        bgBottom: '#11140F',
        garmentTone: '#3B4237',
        accentColor: '#C7D0C0',
        handle: '@mira.deshmukh',
        garmentTag: 'VYN-AW-003 · VINTAGE OLIVE',
        locationTag: 'BENGALURU · LOOK 02',
      }),
      productId: 'unisex-acid-washed-oversized-tee-olive',
      productTagLabel: 'Acid Washed Oversized Tee — Olive',
      productSlug: 'unisex-acid-washed-oversized-tee-olive',
      durationSeconds: 15,
      fileSizeBytes: 3120000,
    },
    {
      id: 'ugc-vid-3',
      enabled: true,
      featured: true,
      order: 3,
      customerHandle: '@kabir.studio',
      caption: '240 GSM Bone Ivory Classic Crew T-Shirt layered under unstructured outerwear.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-posing-in-studio-with-colored-lights-41742-large.mp4',
      thumbnailUrl: createUgcVerticalPosterSvg({
        bgTop: '#292723',
        bgBottom: '#141311',
        garmentTone: '#EAE5D9',
        accentColor: '#D6CFC0',
        handle: '@kabir.studio',
        garmentTag: 'VYN-CC-002 · BONE IVORY',
        locationTag: 'NEW DELHI · LOOK 03',
      }),
      productId: 'unisex-classic-crew-t-shirt-bone',
      productTagLabel: 'Unisex Classic Crew T-Shirt — Bone',
      productSlug: 'unisex-classic-crew-t-shirt-bone',
      durationSeconds: 11,
      fileSizeBytes: 2180000,
    },
    {
      id: 'ugc-vid-4',
      enabled: true,
      featured: true,
      order: 4,
      customerHandle: '@zoya.arch',
      caption: '500 GSM Monolith Loopback Hoodie & Relaxed Utility Cargo Trousers on late-evening walks.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-neon-light-39879-large.mp4',
      thumbnailUrl: createUgcVerticalPosterSvg({
        bgTop: '#1C1B1A',
        bgBottom: '#0C0C0B',
        garmentTone: '#232325',
        accentColor: '#A1A1AA',
        handle: '@zoya.arch',
        garmentTag: 'VYN-HD-005 · MONOLITH HOODIE',
        locationTag: 'LONDON · LOOK 04',
      }),
      productId: 'heavyweight-acid-wash-hoodie-monolith',
      productTagLabel: '500 GSM Monolith Hoodie',
      productSlug: 'heavyweight-acid-wash-hoodie-monolith',
      durationSeconds: 14,
      fileSizeBytes: 2890000,
    },
  ],
};

export const INITIAL_MEDIA_LIBRARY: MediaLibraryItem[] = [
  {
    id: 'media-hero-1-desktop',
    title: 'Archive 04 Cinematic Dark Studio Backdrop (Desktop)',
    fileName: 'vynoox-archive04-hero-desktop.svg',
    mediaType: 'image',
    deviceTarget: 'desktop',
    url: HERO_CAMPAIGN_SVG,
    fileSizeBytes: 48200,
    dimensions: '1920x1080',
    uploadedAt: '2026-11-04',
  },
  {
    id: 'media-hero-1-mobile',
    title: 'Archive 04 Portrait Studio Backdrop (Mobile)',
    fileName: 'vynoox-archive04-hero-mobile.svg',
    mediaType: 'image',
    deviceTarget: 'mobile',
    url: HERO_CAMPAIGN_MOBILE_SVG,
    fileSizeBytes: 39400,
    dimensions: '1080x1920',
    uploadedAt: '2026-11-04',
  },
  {
    id: 'media-hero-2-desktop',
    title: 'Monolith 500 GSM Atmospheric Frame (Desktop)',
    fileName: 'vynoox-monolith-hero-desktop.svg',
    mediaType: 'image',
    deviceTarget: 'desktop',
    url: HERO_SLIDE_2_SVG,
    fileSizeBytes: 46100,
    dimensions: '1920x1080',
    uploadedAt: '2026-11-04',
  },
];

