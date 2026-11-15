import { getSupabaseClient } from '@/lib/supabase/client'

const BUCKET = 'private-documents'
const SIGNED_SECONDS = 3600

export type EnrolledProgram = {
  program_id: string
  slug: string
  title: string
  subtitle: string | null
  reference_code: string | null
}

export type LearningMaterial = {
  id: string
  label: string
  file_path: string | null
  status: string
}

export async function fetchMyEnrolledPrograms(): Promise<EnrolledProgram[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_my_enrolled_programs')
  if (error) return []
  return (data ?? []) as EnrolledProgram[]
}

export async function fetchLearningMaterials(programId: string): Promise<LearningMaterial[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('content_items')
    .select('id, label, file_path, status')
    .eq('entity_type', 'leap_program')
    .eq('entity_id', programId)
    .in('status', ['published', 'uploaded'])
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as LearningMaterial[]
}

export async function createMaterialSignedUrl(filePath: string): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_SECONDS)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not open material')
  return data.signedUrl
}