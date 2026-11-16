import type { VisualAssetKey } from '@/data/visual-assets'

export type LeapProgram = {
  /** Supabase programs.id (UUID) when loaded from database */
  id: string
  slug: string
  code: string
  title: string
  subtitle: string
  feePhp: number
  description: string
  /** Promotional cover slot key — optional for admin-created courses */
  coverAssetKey: VisualAssetKey
  /** Public URL from programs.cover_path when set in Admin */
  coverPublicUrl?: string | null
  carouselCoverPath: string | null
  featuredInCarousel?: boolean
  footerStrip?: boolean
}

/** No bundled catalogue — courses come only from Supabase (Admin → Create course). */
export const leapPrograms: LeapProgram[] = []

export const institutionalDisclosure =
  'Programs and awards are institutional in character. They do not by themselves confer government-recognized academic degrees, professional licensure, or authority to practice regulated healthcare professions.'