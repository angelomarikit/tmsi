import type { VisualAssetKey } from '@/data/visual-assets'

export type LeapProgram = {
  id: string
  slug: string
  code: string
  title: string
  subtitle: string
  feePhp: number
  description: string
  /** Manifest key for promotional cover only — never a course PDF */
  coverAssetKey: VisualAssetKey
  /** Homepage carousel artwork (distinct from catalogue cover when needed) */
  carouselCoverPath: string | null
  /** Storage path to learning PDF — private; not used in <img> */
  courseMaterialPath: string | null
  featuredInCarousel?: boolean
  footerStrip?: boolean
}

export const leapPrograms: LeapProgram[] = [
  {
    id: 'dms',
    slug: 'doctor-of-metaphysical-science',
    code: 'DMS',
    title: 'DMS',
    subtitle: 'Doctor of Metaphysical Science',
    feePhp: 14000,
    description:
      'Metaphysical philosophy, consciousness, transcendentalism and Luminarian thought.',
    coverAssetKey: 'course.dms',
    carouselCoverPath: '/assets/course-covers/carousel/dms.jpg',
    courseMaterialPath: null,
    featuredInCarousel: true,
  },
  {
    id: 'dms-tin',
    slug: 'dms-transpersonal-integrative-naturopathy',
    code: 'DMS-TIN',
    title: 'DMS-TIN',
    subtitle: 'DMS in Transpersonal Integrative Naturopathy',
    feePhp: 14000,
    description:
      'Transpersonal perspectives on integrative naturopathy and holistic well-being.',
    coverAssetKey: 'course.dms_tin',
    carouselCoverPath: '/assets/course-covers/dms-tin.jpg',
    courseMaterialPath: null,
    featuredInCarousel: true,
  },
  {
    id: 'phd-ticm',
    slug: 'phd-transpersonal-integrative-complementary-medicine',
    code: 'PhD-TICM',
    title: 'PhD-TICM',
    subtitle: 'PhD in Transpersonal Integrative Complementary Medicine',
    feePhp: 14000,
    description:
      'Advanced philosophical inquiry into complementary medicine and integrative approaches.',
    coverAssetKey: 'course.phd_ticm',
    carouselCoverPath: '/assets/course-covers/carousel/phd-ticm.jpg',
    courseMaterialPath: null,
    featuredInCarousel: true,
  },
  {
    id: 'dms-vitalogy',
    slug: 'dms-vitalogy',
    code: 'DMS-Vitalogy',
    title: 'DMS-Vitalogy',
    subtitle: 'Doctor of Metaphysical Science in Vitalogy',
    feePhp: 18000,
    description: 'DMS-Vitalogy, vitality concepts and holistic lifestyle education.',
    coverAssetKey: 'course.dms_vitalogy',
    carouselCoverPath: '/assets/course-covers/dms-vitalogy.jpg',
    courseMaterialPath: null,
    featuredInCarousel: true,
  },
  {
    id: 'dms-llvt',
    slug: 'dms-luminarian-light-vitality-therapy',
    code: 'DMS-LLVT',
    title: 'DMS-LLVT',
    subtitle: 'Luminarian Light and Vitality Therapy',
    feePhp: 7500,
    description:
      'Luminarian Light and Vitality Therapy, consciousness and contemplative practices.',
    coverAssetKey: 'course.dms_llvt',
    carouselCoverPath: '/assets/course-covers/dms-llvt.jpg',
    courseMaterialPath: null,
    featuredInCarousel: true,
  },
  {
    id: 'tph-cert',
    slug: 'certificate-philosophy-transcendentalism-ph',
    code: 'TPH-CERT',
    title: 'Transcendentalism-PH Certificate',
    subtitle: 'Certificate in the Philosophy of Transcendentalism-PH',
    feePhp: 3500,
    description: 'Foundations and philosophy of Transcendentalism-PH.',
    coverAssetKey: 'course.tph_cert',
    carouselCoverPath: null,
    featuredInCarousel: true,
    courseMaterialPath: null,
    footerStrip: true,
  },
  {
    id: 'luminarian-order',
    slug: 'luminarian-order',
    code: 'LUM-ORDER',
    title: 'The Luminarian Order',
    subtitle: 'Levels I, II and III',
    feePhp: 3750,
    description:
      'A three-level pathway in Luminarian philosophical learning and recognition.',
    coverAssetKey: 'course.luminarian_order',
    carouselCoverPath: null,
    courseMaterialPath: null,
    featuredInCarousel: true,
    footerStrip: true,
  },
  {
    id: 'lecs-dip',
    slug: 'lecs-diplomate-metaphysical-healing-art',
    code: 'LECS-DIP',
    title: 'LECS — Diplomate',
    subtitle: 'Diplomate in Metaphysical Healing Art',
    feePhp: 6500,
    description:
      'Evaluation of documented experiential learning in metaphysical healing arts.',
    coverAssetKey: 'course.lecs_dip',
    carouselCoverPath: null,
    featuredInCarousel: true,
    courseMaterialPath: null,
    footerStrip: true,
  },
  {
    id: 'lecs-fel',
    slug: 'lecs-fellow-metaphysical-healing-arts',
    code: 'LECS-FEL',
    title: 'LECS — Fellow',
    subtitle: 'Fellow in Metaphysical Healing Arts',
    feePhp: 8750,
    description:
      'Advanced institutional evaluation of experience and contributions in metaphysical healing arts.',
    coverAssetKey: 'course.lecs_fel',
    carouselCoverPath: null,
    featuredInCarousel: true,
    courseMaterialPath: null,
    footerStrip: true,
  },
]

export function getProgramBySlug(slug: string) {
  return leapPrograms.find((p) => p.slug === slug)
}

export const institutionalDisclosure =
  'Programs and awards are institutional in character. They do not by themselves confer government-recognized academic degrees, professional licensure, or authority to practice regulated healthcare professions.'