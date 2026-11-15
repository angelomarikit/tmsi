import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'

const ENTITY_TYPE = 'leap_program'

export type ProgramMaterialRow = {
  id: string
  label: string
  file_path: string | null
  status: string
  created_at: string
}

export async function fetchProgramBySlug(slug: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, code, title, subtitle')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return data
}

export async function fetchProgramMaterials(programId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('content_items')
    .select('id, label, file_path, status, created_at')
    .eq('entity_type', ENTITY_TYPE)
    .eq('entity_id', programId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as ProgramMaterialRow[]
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]/g, '_').replace(/\s+/g, '_')
}

export function isVideoMaterial(file: File | string): boolean {
  if (typeof file === 'string') {
    const lower = file.toLowerCase()
    return /\.(mp4|webm|mov|m4v)(\?|$)/.test(lower)
  }
  const name = file.name.toLowerCase()
  if (/\.(mp4|webm|mov|m4v)$/.test(name)) return true
  return file.type.startsWith('video/')
}

export function isPdfMaterial(file: File | string): boolean {
  if (typeof file === 'string') {
    return file.toLowerCase().endsWith('.pdf')
  }
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function isAllowedCourseMaterial(file: File): boolean {
  return isPdfMaterial(file) || isVideoMaterial(file)
}

export async function uploadProgramMaterials(
  programId: string,
  programSlug: string,
  files: File[],
): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  let uploaded = 0
  for (const file of files) {
    if (!isAllowedCourseMaterial(file)) {
      continue
    }
    const safeName = safeFileName(file.name)
    const storagePath = `course-materials/${programSlug}/${safeName}`
    await uploadPrivateDocument(storagePath, file)
    const { error } = await supabase.from('content_items').insert({
      entity_type: ENTITY_TYPE,
      entity_id: programId,
      label: file.name,
      file_path: storagePath,
      status: 'published',
    })
    if (error) throw error
    uploaded += 1
  }
  return uploaded
}

export async function fetchProgramMaterialCounts(): Promise<Record<string, number>> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const { data, error } = await supabase
    .from('content_items')
    .select('entity_id')
    .eq('entity_type', ENTITY_TYPE)
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    const id = row.entity_id as string
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export async function deleteProgramMaterial(materialId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('content_items').delete().eq('id', materialId)
  if (error) throw error
}