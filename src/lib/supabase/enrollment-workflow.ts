import { getSupabaseClient } from '@/lib/supabase/client'

export type EnrollmentApprovalStats = {
  pending_approval: number
  pending_payment_verification: number
  approved: number
  corrections_requested: number
  rejected: number
}

export type AdminEnrollmentRow = {
  id: string
  reference_code: string | null
  status: string
  course_access_granted: boolean
  submitted_at: string | null
  admin_notes: string | null
  payload: Record<string, unknown> | null
  applicant_id: string | null
  program_id: string
  programs: {
    title: string
    code: string
    fee_php: number
    slug: string
  } | null
  profiles: { email: string; full_name: string | null } | null
  payment: {
    id: string
    reference_number: string
    declared_amount: number
    status: string
    payment_date: string | null
    receipt_path: string
    verified_at: string | null
  } | null
}

export async function fetchEnrollmentApprovalStats(): Promise<EnrollmentApprovalStats | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('admin_enrollment_approval_stats')
  if (error || !data) return null
  return data as EnrollmentApprovalStats
}

export async function fetchAdminEnrollmentQueue(): Promise<AdminEnrollmentRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: apps, error } = await supabase
    .from('enrollment_applications')
    .select(
      'id, reference_code, status, course_access_granted, submitted_at, admin_notes, payload, applicant_id, program_id, programs(title, code, fee_php, slug), profiles!enrollment_applications_applicant_id_fkey(email, full_name)',
    )
    .order('submitted_at', { ascending: false })
    .limit(100)

  if (error || !apps) return []

  const rows: AdminEnrollmentRow[] = []
  for (const app of apps) {
    const { data: pay } = await supabase
      .from('payment_submissions')
      .select('id, reference_number, declared_amount, status, payment_date, receipt_path, verified_at')
      .eq('application_id', app.id)
      .eq('application_type', 'leap_enrollment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    type ProgramRel = NonNullable<AdminEnrollmentRow['programs']>
    type ProfileRel = NonNullable<AdminEnrollmentRow['profiles']>
    const rawPrograms = app.programs as unknown as ProgramRel | ProgramRel[] | null
    const rawProfiles = app.profiles as unknown as ProfileRel | ProfileRel[] | null
    const programs = Array.isArray(rawPrograms) ? rawPrograms[0] ?? null : rawPrograms
    const profiles = Array.isArray(rawProfiles) ? rawProfiles[0] ?? null : rawProfiles

    rows.push({
      id: app.id,
      reference_code: app.reference_code,
      status: app.status,
      course_access_granted: app.course_access_granted,
      submitted_at: app.submitted_at,
      admin_notes: app.admin_notes,
      payload: app.payload as Record<string, unknown>,
      applicant_id: app.applicant_id,
      program_id: app.program_id,
      programs,
      profiles,
      payment: pay ?? null,
    })
  }
  return rows
}

export async function staffVerifyPayment(applicationId: string, notes?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_verify_payment', {
    p_application_id: applicationId,
    p_notes: notes ?? null,
  })
  if (error) throw error
}

export async function staffApproveEnrollment(applicationId: string, notes?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_approve_enrollment', {
    p_application_id: applicationId,
    p_notes: notes ?? null,
  })
  if (error) throw error
}

export async function staffRejectEnrollment(applicationId: string, reason: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_reject_enrollment', {
    p_application_id: applicationId,
    p_reason: reason,
  })
  if (error) throw error
}

export async function staffRequestCorrection(applicationId: string, message: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_request_enrollment_correction', {
    p_application_id: applicationId,
    p_message: message,
  })
  if (error) throw error
}

export async function getReceiptSignedUrl(receiptPath: string): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.storage
    .from('private-documents')
    .createSignedUrl(receiptPath, 300)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not open receipt')
  return data.signedUrl
}