import { getSupabaseClient } from '@/lib/supabase/client'
import { updateMediaAssetPath, uploadPublicAssetFile } from '@/lib/supabase/cms-upload'
import type { VisualAssetKey } from '@/data/visual-assets'

export function slugifyCourseTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type CreateCoursePayload = {
  code: string
  title: string
  subtitle: string
  slug: string
  feePhp: number
  coverFile?: File | null
}

export async function createNewCourse(payload: CreateCoursePayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const code = payload.code.trim().toUpperCase()
  const slug = payload.slug.trim().toLowerCase()

  const { data, error } = await supabase
    .from('programs')
    .insert({
      code,
      slug,
      title: payload.title.trim(),
      subtitle: payload.subtitle.trim(),
      fee_php: payload.feePhp,
      publication_status: 'under_review',
      active: true,
    })
    .select('id, slug')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Could not create course')

  if (payload.coverFile) {
    const storagePath = `course-covers/${slug}.jpg`
    const publicUrl = await uploadPublicAssetFile(storagePath, payload.coverFile)
    await supabase
      .from('programs')
      .update({ cover_path: publicUrl })
      .eq('id', data.id)
  }

  return data
}

export async function publishCourse(programId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('programs')
    .update({ publication_status: 'published', active: true })
    .eq('id', programId)
  if (error) throw error
}

export async function archiveCourse(programId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('programs')
    .update({ publication_status: 'archived', active: false })
    .eq('id', programId)
  if (error) throw error
}

export type CourseEditPayload = {
  title: string
  subtitle: string
  feePhp: number
  publicationStatus: string
}

export async function updateCourseMeta(programId: string, payload: CourseEditPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('programs')
    .update({
      title: payload.title,
      subtitle: payload.subtitle,
      fee_php: payload.feePhp,
      publication_status: payload.publicationStatus,
    })
    .eq('id', programId)
  if (error) throw error
}

export async function uploadCourseCover(
  slug: string,
  coverAssetKey: VisualAssetKey,
  cmsLabel: string,
  file: File,
) {
  const path = `course-covers/${slug}.jpg`
  const url = await uploadPublicAssetFile(path, file)
  await updateMediaAssetPath(coverAssetKey, url, 'course_cover', cmsLabel)
}