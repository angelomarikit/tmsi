import { getSupabaseClient } from '@/lib/supabase/client'

const PUBLIC_BUCKET = 'public-assets'
const PRIVATE_BUCKET = 'private-documents'

export function publicStorageUrl(storagePath: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadPublicAssetFile(
  storagePath: string,
  file: File,
): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) throw error
  const url = publicStorageUrl(storagePath)
  if (!url) throw new Error('Could not resolve public URL')
  return url
}

export async function uploadPrivateDocument(
  storagePath: string,
  file: File,
): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || 'application/pdf',
  })
  if (error) throw error
  return storagePath
}

export async function updateMediaAssetPath(
  assetKey: string,
  publicUrl: string,
  category: string,
  cmsLabel: string,
) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase.from('media_assets').upsert(
    {
      asset_key: assetKey,
      category,
      public_path: publicUrl,
      cms_label: cmsLabel,
      approval_status: 'published',
    },
    { onConflict: 'asset_key' },
  )
  if (error) throw error
}

export async function updateEbookAfterUpload(
  legacySlug: string,
  fields: {
    pdf_storage_path?: string
    cover_public_url?: string
    publication_status?: string
    rights_confirmed?: boolean
  },
) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const patch: Record<string, unknown> = {}
  if (fields.pdf_storage_path) patch.pdf_path = fields.pdf_storage_path
  if (fields.cover_public_url) patch.cover_path = fields.cover_public_url
  if (fields.publication_status) patch.publication_status = fields.publication_status
  if (fields.rights_confirmed !== undefined) patch.rights_confirmed = fields.rights_confirmed

  const { error } = await supabase
    .from('ebooks')
    .update(patch)
    .eq('legacy_slug', legacySlug)
  if (error) throw error
}

export async function updateProgramCourseMaterial(slug: string, storagePath: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase
    .from('programs')
    .update({ course_material_storage_path: storagePath })
    .eq('slug', slug)
  if (error) throw error
}

export async function updateProgramCoverAsset(assetKey: string, publicUrl: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  await updateMediaAssetPath(assetKey, publicUrl, 'course_cover', assetKey)

  const { error } = await supabase
    .from('programs')
    .update({ cover_asset_key: assetKey })
    .eq('cover_asset_key', assetKey)
  if (error) throw error
}