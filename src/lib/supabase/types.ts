import type { VisualAssetKey } from '@/data/visual-assets'

export type DbProgramRow = {
  id: string
  legacy_id: string | null
  code: string
  slug: string
  title: string
  subtitle: string
  description: string | null
  fee_php: number
  cover_asset_key: string | null
  carousel_cover_path: string | null
  course_material_storage_path: string | null
  featured_in_carousel: boolean
  footer_strip: boolean
  sort_order: number
  active: boolean
  publication_status: string
}

export type DbMediaAssetRow = {
  asset_key: string
  category: string
  public_path: string | null
  cms_label: string
  approval_status: string
}

export type DbPageSectionRow = {
  section_key: string
  body: { text?: string; title?: string }
}

export type AdminDashboardStats = {
  students: number
  members: number
  pending_applications: number
  pending_payments: number
  missing_materials: number
  published_ebooks: number
  published_programs: number
}

export type MediaOverrides = Partial<Record<VisualAssetKey, string | null>>