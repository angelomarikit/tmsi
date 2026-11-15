import { getSupabaseClient } from '@/lib/supabase/client'

export type MembershipApprovalStats = {
  pending: number
  approved: number
  corrections: number
  rejected: number
}

export type AdminMembershipRow = {
  id: string
  applicant_id: string | null
  reference_code: string | null
  status: string
  membership_access_granted: boolean
  package_code: string
  submitted_at: string | null
  approved_at: string | null
  admin_notes: string | null
  payload: Record<string, unknown> | null
  email: string | null
  full_name: string | null
  username: string | null
  payment_reference_number: string | null
  payment_status: string | null
  payment_date: string | null
  payment_declared_amount: number | null
  payment_receipt_path: string | null
  payment_verified_at: string | null
}

export type TmvsMemberRow = {
  profile_id: string
  email: string
  full_name: string | null
  username: string | null
  reference_code: string | null
  approved_at: string | null
}

export async function fetchMembershipApprovalStats(): Promise<MembershipApprovalStats | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('admin_membership_approval_stats')
  if (error || !data) return null
  return data as MembershipApprovalStats
}

export async function fetchAdminMembershipQueue(): Promise<AdminMembershipRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_list_membership_applications')
  if (error || !data) return []
  return (data ?? []) as AdminMembershipRow[]
}

export async function fetchAdminTmvsMembers(): Promise<TmvsMemberRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_list_tmvs_members')
  if (error || !data) return []
  return (data ?? []) as TmvsMemberRow[]
}

export async function staffApproveMembership(applicationId: string, notes?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_approve_membership', {
    p_application_id: applicationId,
    p_notes: notes ?? null,
  })
  if (error) throw error
}

export async function staffRejectMembership(applicationId: string, reason: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_reject_membership', {
    p_application_id: applicationId,
    p_reason: reason,
  })
  if (error) throw error
}

export async function staffRequestMembershipCorrection(applicationId: string, message: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_request_membership_correction', {
    p_application_id: applicationId,
    p_message: message,
  })
  if (error) throw error
}