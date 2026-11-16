/**
 * Central manifest — public UI must resolve images only through this registry.
 * Categories E/F must never appear here with a public URL used in components.
 */

export type AssetCategory =
  | 'brand'
  | 'website_visual'
  | 'course_cover'
  | 'ebook_cover'
  | 'payment'

export type VisualAssetKey =
  | 'brand.logo'
  | 'homepage.hero.banner'
  | 'homepage.hero.left'
  | 'homepage.hero.right'
  | 'masthead.background'
  | 'masthead.decorative'
  | 'course.dms'
  | 'course.dms_tin'
  | 'course.phd_ticm'
  | 'course.dms_vitalogy'
  | 'course.dms_llvt'
  | 'course.tph_cert'
  | 'course.luminarian_order'
  | 'course.lecs_dip'
  | 'course.lecs_fel'
  | 'payment.metrobank_qr'

export type VisualAssetRecord = {
  key: VisualAssetKey
  category: AssetCategory
  /** Public URL path when approved; null = use themed placeholder */
  publicPath: string | null
  alt: string
  cmsLabel: string
  approvalRequired: boolean
}

export const visualAssets: Record<VisualAssetKey, VisualAssetRecord> = {
  'brand.logo': {
    key: 'brand.logo',
    category: 'brand',
    publicPath: '/assets/brand/logo.jpg',
    alt: 'TMSI–LAPS official emblem',
    cmsLabel: 'Institutional logo',
    approvalRequired: false,
  },
  'homepage.hero.banner': {
    key: 'homepage.hero.banner',
    category: 'website_visual',
    publicPath: '/assets/website-visual/homepage-hero-banner.jpg',
    alt: 'TMSI–LAPS institutional building, scholarly light, and contemplative landscape',
    cmsLabel: 'Homepage hero banner (full width)',
    approvalRequired: false,
  },
  'homepage.hero.left': {
    key: 'homepage.hero.left',
    category: 'website_visual',
    publicPath: null,
    alt: 'Legacy slot — use homepage.hero.banner',
    cmsLabel: 'Homepage hero (left) — superseded by banner',
    approvalRequired: true,
  },
  'homepage.hero.right': {
    key: 'homepage.hero.right',
    category: 'website_visual',
    publicPath: null,
    alt: 'Legacy slot — use homepage.hero.banner',
    cmsLabel: 'Homepage hero (right) — superseded by banner',
    approvalRequired: true,
  },
  'masthead.background': {
    key: 'masthead.background',
    category: 'website_visual',
    publicPath: '/assets/website-visual/masthead-background.png',
    alt: '',
    cmsLabel: 'Masthead background (books / emerald art)',
    approvalRequired: false,
  },
  'masthead.decorative': {
    key: 'masthead.decorative',
    category: 'website_visual',
    publicPath: null,
    alt: '',
    cmsLabel: 'Header decorative accent (fallback)',
    approvalRequired: true,
  },
  'course.dms': {
    key: 'course.dms',
    category: 'course_cover',
    publicPath: '/assets/course-covers/dms.jpg',
    alt: 'Doctor of Metaphysical Science — contemplative light and sacred geometry',
    cmsLabel: 'Course cover — DMS',
    approvalRequired: false,
  },
  'course.dms_tin': {
    key: 'course.dms_tin',
    category: 'course_cover',
    publicPath: '/assets/course-covers/dms-tin.jpg',
    alt: 'DMS in Transpersonal Integrative Naturopathy course artwork',
    cmsLabel: 'Course cover — DMS-TIN',
    approvalRequired: true,
  },
  'course.phd_ticm': {
    key: 'course.phd_ticm',
    category: 'course_cover',
    publicPath: '/assets/course-covers/phd-ticm.jpg',
    alt: 'PhD-TICM — lotus and balanced stones on still water',
    cmsLabel: 'Course cover — PhD-TICM',
    approvalRequired: false,
  },
  'course.dms_vitalogy': {
    key: 'course.dms_vitalogy',
    category: 'course_cover',
    publicPath: '/assets/course-covers/dms-vitalogy.jpg',
    alt: 'DMS–Vitalogy program artwork',
    cmsLabel: 'Course cover — DMS-Vitalogy',
    approvalRequired: true,
  },
  'course.dms_llvt': {
    key: 'course.dms_llvt',
    category: 'course_cover',
    publicPath: '/assets/course-covers/dms-llvt.jpg',
    alt: 'DMS-LLVT program artwork',
    cmsLabel: 'Course cover — DMS-LLVT',
    approvalRequired: true,
  },
  'course.tph_cert': {
    key: 'course.tph_cert',
    category: 'course_cover',
    publicPath: '/assets/course-covers/tph-cert.jpg',
    alt: 'Transcendentalism-PH — lotus, sacred geometry, and open book',
    cmsLabel: 'Course cover — Transcendentalism-PH',
    approvalRequired: false,
  },
  'course.luminarian_order': {
    key: 'course.luminarian_order',
    category: 'course_cover',
    publicPath: '/assets/website-visual/luminarian-symbol.jpg',
    alt: 'Luminarian Order symbolic artwork',
    cmsLabel: 'Course cover — Luminarian Order',
    approvalRequired: true,
  },
  'course.lecs_dip': {
    key: 'course.lecs_dip',
    category: 'course_cover',
    publicPath: '/assets/course-covers/lecs-dip.jpg',
    alt: 'LECS Diplomate — contemplation by still water and mountains',
    cmsLabel: 'Course cover — LECS Diplomate',
    approvalRequired: false,
  },
  'course.lecs_fel': {
    key: 'course.lecs_fel',
    category: 'course_cover',
    publicPath: '/assets/course-covers/lecs-fel.jpg',
    alt: 'LECS Fellow — luminous book and sacred geometry in the hall',
    cmsLabel: 'Course cover — LECS Fellow',
    approvalRequired: false,
  },
  'payment.metrobank_qr': {
    key: 'payment.metrobank_qr',
    category: 'payment',
    publicPath: '/assets/payment/metrobank-instaPay-qr.png',
    alt: 'Metrobank InstaPay QR code for program fee transfer',
    cmsLabel: 'Metrobank QR (payments only)',
    approvalRequired: false,
  },
}

export function getVisualAsset(key: VisualAssetKey) {
  return visualAssets[key]
}

export type MediaPathOverrides = Partial<Record<VisualAssetKey, string | null>>

function isSiteRelativePublicPath(path: string | null | undefined): path is string {
  if (path == null) return false
  const trimmed = path.trim()
  return trimmed.startsWith('/') && !trimmed.startsWith('//')
}

export function resolvePublicImageUrl(
  key: VisualAssetKey,
  overrides?: MediaPathOverrides,
): string | null {
  if (overrides && overrides[key] !== undefined) {
    const override = overrides[key]
    if (isSiteRelativePublicPath(override)) {
      return override
    }
  }
  return visualAssets[key].publicPath
}

/** CMS slot list for Image Manager */
export const cmsImageSlots = Object.values(visualAssets).filter(
  (a) => a.category !== 'payment',
)