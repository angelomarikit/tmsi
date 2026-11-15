import { getSupabaseClient } from '@/lib/supabase/client'
import { updateEbookAfterUpload, uploadPrivateDocument, uploadPublicAssetFile } from '@/lib/supabase/cms-upload'

export function slugifyEbookTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/** Admin UI labels aligned to `public.content_status` on `ebooks.publication_status` */
export type EbookUiStatus = 'review' | 'live' | 'hold'

const UI_TO_DB: Record<EbookUiStatus, string> = {
  review: 'under_review',
  live: 'published',
  hold: 'archived',
}

export function ebookUiStatusFromDb(dbStatus: string): EbookUiStatus {
  if (dbStatus === 'published') return 'live'
  if (dbStatus === 'archived' || dbStatus === 'rejected') return 'hold'
  return 'review'
}

export function ebookDbStatusFromUi(ui: EbookUiStatus): string {
  return UI_TO_DB[ui]
}

/** Create a Supabase row for indexed titles (migration 010 optional). */
export async function ensureEbookCatalogRow(legacySlug: string, title?: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: existing, error: readErr } = await supabase
    .from('ebooks')
    .select('id')
    .eq('legacy_slug', legacySlug)
    .maybeSingle()
  if (readErr) throw readErr
  if (existing) return

  const { data: maxRow } = await supabase
    .from('ebooks')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('ebooks').insert({
    legacy_slug: legacySlug,
    title: title?.trim() || legacySlug.replace(/-/g, ' '),
    pdf_path: null,
    publication_status: 'under_review',
    rights_confirmed: false,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  })
  if (error) throw error
}

export async function updateEbookUiStatus(legacySlug: string, ui: EbookUiStatus) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  await ensureEbookCatalogRow(legacySlug)

  if (ui === 'live') {
    const { data: row, error } = await supabase
      .from('ebooks')
      .select('pdf_path, publication_status')
      .eq('legacy_slug', legacySlug)
      .maybeSingle()
    if (error) throw error
    const pdfPath = (row?.pdf_path as string | null)?.trim() ?? ''
    if (!pdfPath.startsWith('ebooks/')) {
      throw new Error(
        'Upload the PDF first (Admin → eBooks → PDF). Files must be stored under ebooks/… in Storage before going Live.',
      )
    }
  }

  const publication_status = ebookDbStatusFromUi(ui)
  await updateEbookAfterUpload(legacySlug, {
    publication_status,
    rights_confirmed: ui === 'live',
  })
}

export async function publishEbook(legacySlug: string) {
  if (!window.confirm('Publish this eBook on the public site? Confirm distribution rights.')) {
    return
  }
  await updateEbookUiStatus(legacySlug, 'live')
}

export type EbookDocumentInput = {
  title: string
  description: string
  uiStatus: EbookUiStatus
  legacySlug?: string
  pdfFile?: File | null
  coverFile?: File | null
}

export async function createEbookDocument(input: EbookDocumentInput) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  if (!input.pdfFile) throw new Error('PDF file is required for a new eBook')

  const legacy_slug = input.legacySlug?.trim() || slugifyEbookTitle(input.title)
  if (!legacy_slug) throw new Error('Could not generate URL slug from title')

  const publication_status = ebookDbStatusFromUi(input.uiStatus)
  const rights_confirmed = input.uiStatus === 'live'
  const pdf_path = `ebooks/${legacy_slug}.pdf`

  await uploadPrivateDocument(pdf_path, input.pdfFile)

  let cover_path: string | null = null
  if (input.coverFile) {
    const coverStorage = `ebooks/covers/${legacy_slug}.jpg`
    cover_path = await uploadPublicAssetFile(coverStorage, input.coverFile)
  }

  const { data: maxRow } = await supabase
    .from('ebooks')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (maxRow?.sort_order ?? 0) + 1

  const { error } = await supabase.from('ebooks').insert({
    legacy_slug,
    title: input.title.trim(),
    description: input.description.trim() || null,
    publication_status,
    rights_confirmed,
    pdf_path,
    cover_path,
    sort_order,
  })
  if (error) throw error
  return { legacy_slug, pdf_path, cover_path }
}

export async function updateEbookDocument(legacySlug: string, input: EbookDocumentInput) {
  const publication_status = ebookDbStatusFromUi(input.uiStatus)
  const rights_confirmed = input.uiStatus === 'live'

  const patch: Parameters<typeof updateEbookAfterUpload>[1] = {
    publication_status,
    rights_confirmed,
  }

  if (input.pdfFile) {
    const pdf_path = `ebooks/${legacySlug}.pdf`
    await uploadPrivateDocument(pdf_path, input.pdfFile)
    patch.pdf_storage_path = pdf_path
  }

  if (input.coverFile) {
    const coverStorage = `ebooks/covers/${legacySlug}.jpg`
    const url = await uploadPublicAssetFile(coverStorage, input.coverFile)
    patch.cover_public_url = url
  }

  await updateEbookAfterUpload(legacySlug, patch)

  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('ebooks')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
    })
    .eq('legacy_slug', legacySlug)
  if (error) throw error
}

export async function deleteEbookByLegacySlug(legacySlug: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('ebooks').delete().eq('legacy_slug', legacySlug)
  if (error) throw error
}