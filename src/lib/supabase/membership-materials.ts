import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'
import { isAllowedCourseMaterial } from '@/lib/supabase/program-materials'

export const TMVS_ENTITY_TYPE = 'tmvs_membership'

export type MembershipMaterialRow = {
  id: string
  label: string
  file_path: string | null
  status: string
  created_at: string
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]/g, '_').replace(/\s+/g, '_')
}

export async function fetchMembershipMaterials(): Promise<MembershipMaterialRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('content_items')
    .select('id, label, file_path, status, created_at')
    .eq('entity_type', TMVS_ENTITY_TYPE)
    .in('status', ['published', 'uploaded'])
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as MembershipMaterialRow[]
}

export async function uploadMembershipMaterials(files: File[]): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  let uploaded = 0
  for (const file of files) {
    if (!isAllowedCourseMaterial(file)) continue
    const safeName = safeFileName(file.name)
    const storagePath = `membership-materials/${safeName}`
    await uploadPrivateDocument(storagePath, file)
    const { error } = await supabase.from('content_items').insert({
      entity_type: TMVS_ENTITY_TYPE,
      entity_id: null,
      label: file.name,
      file_path: storagePath,
      status: 'published',
    })
    if (error) throw error
    uploaded += 1
  }
  return uploaded
}

export async function deleteMembershipMaterial(materialId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', materialId)
    .eq('entity_type', TMVS_ENTITY_TYPE)
  if (error) throw error
}

export type MyMembershipStatus = {
  application_id: string
  status: string
  membership_access_granted: boolean
  reference_code: string | null
  has_payment_receipt: boolean
}

export async function fetchMyMembershipStatus(): Promise<MyMembershipStatus | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('my_membership_status')
  if (error || !data || data === null) return null
  const row = data as {
    application_id?: string
    status?: string
    membership_access_granted?: boolean
    reference_code?: string | null
    has_payment_receipt?: boolean
  }
  if (!row.status || !row.application_id) return null
  return {
    application_id: row.application_id,
    status: row.status,
    membership_access_granted: Boolean(row.membership_access_granted),
    reference_code: row.reference_code ?? null,
    has_payment_receipt: Boolean(row.has_payment_receipt),
  }
}

export async function ensureMembershipPaymentReminder(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.rpc('ensure_membership_payment_reminder')
}

export async function checkTmvsMembershipAccess(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { data, error } = await supabase.rpc('current_user_is_tmvs_member')
  return Boolean(data) && !error
}