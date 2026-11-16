import { getSupabaseClient, supabaseConfigured } from '@/lib/supabase/client'
import { mapDbProgram } from '@/lib/supabase/mappers'
import type {
  AdminDashboardStats,
  DbMediaAssetRow,
  DbPageSectionRow,
  DbProgramRow,
  MediaOverrides,
} from '@/lib/supabase/types'
import type { VisualAssetKey } from '@/data/visual-assets'

export async function fetchPublishedPrograms() {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, code, slug, title, subtitle, description, fee_php, cover_asset_key, cover_path, carousel_cover_path, featured_in_carousel, footer_strip, sort_order, active, publication_status',
    )
    .eq('publication_status', 'published')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) return null
  return ((data ?? []) as DbProgramRow[]).map(mapDbProgram)
}

export async function fetchMediaOverrides(): Promise<MediaOverrides | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('media_assets')
    .select('asset_key, public_path, approval_status')
    .eq('approval_status', 'published')

  if (error || !data?.length) return null

  const overrides: MediaOverrides = {}
  for (const row of data as DbMediaAssetRow[]) {
    overrides[row.asset_key as VisualAssetKey] = row.public_path
  }
  return overrides
}

export async function fetchAllMediaAssets() {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('media_assets')
    .select('asset_key, category, public_path, cms_label, approval_status')
    .order('asset_key')

  if (error) return null
  return data as DbMediaAssetRow[]
}

export async function fetchHomeSections(): Promise<DbPageSectionRow[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: page, error: pageError } = await supabase
    .from('site_pages')
    .select('id')
    .eq('slug', 'home')
    .eq('publication_status', 'published')
    .maybeSingle()

  if (pageError || !page?.id) return null

  const { data, error } = await supabase
    .from('page_sections')
    .select('section_key, body')
    .eq('page_id', page.id)
    .eq('publication_status', 'published')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) return null
  return data as DbPageSectionRow[]
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('admin_dashboard_stats')
  if (error || !data) return null
  return data as AdminDashboardStats
}

export function contentApiReady() {
  return supabaseConfigured
}

export type DbPublishedEbook = {
  id: string
  legacy_slug: string | null
  title: string
  author: string | null
  description: string | null
  cover_path: string | null
  pdf_path: string | null
  publication_status: string
  rights_confirmed: boolean
}

export async function fetchPublishedEbooks(): Promise<DbPublishedEbook[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('ebooks')
    .select(
      'id, legacy_slug, title, author, description, cover_path, pdf_path, publication_status, rights_confirmed',
    )
    .eq('publication_status', 'published')
    .eq('rights_confirmed', true)
    .order('sort_order', { ascending: true })

  if (error) return null
  return (data ?? []) as DbPublishedEbook[]
}

export async function fetchAllEbooksForCatalog(): Promise<DbPublishedEbook[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('ebooks')
    .select(
      'id, legacy_slug, title, author, description, cover_path, pdf_path, publication_status, rights_confirmed',
    )
    .order('title')

  if (error) return null
  return (data ?? []) as DbPublishedEbook[]
}