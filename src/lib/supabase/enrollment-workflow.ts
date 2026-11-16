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
  student_number: string | null
  programs: {
    title: string
    code: string
    fee_php: number
    slug: string
  } | null
  profiles: { email: string; full_name: string | null; student_number?: string | null } | null
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

type AdminEnrollmentRpcRow = {
  id: string
  applicant_id: string | null
  reference_code: string | null
  status: string
  course_access_granted: boolean
  submitted_at: string | null
  admin_notes: string | null
  payload: Record<string, unknown> | null
  program_id: string
  program_title: string | null
  program_code: string | null
  program_slug: string | null
  fee_php: number | null
  email: string | null
  full_name: string | null
  student_number: string | null
  payment_id: string | null
  payment_status: string | null
  payment_reference: string | null
  declared_amount: number | null
  payment_date: string | null
  receipt_path: string | null
  verified_at: string | null
}

function mapRpcRow(row: AdminEnrollmentRpcRow): AdminEnrollmentRow {
  const programs =
    row.program_title != null
      ? {
          title: row.program_title,
          code: row.program_code ?? '',
          fee_php: Number(row.fee_php ?? 0),
          slug: row.program_slug ?? '',
        }
      : null

  const profiles = {
    email: row.email ?? '',
    full_name: row.full_name,
    student_number: row.student_number,
  }

  const payment =
    row.payment_id != null
      ? {
          id: row.payment_id,
          reference_number: row.payment_reference ?? '',
          declared_amount: Number(row.declared_amount ?? 0),
          status: row.payment_status ?? 'unknown',
          payment_date: row.payment_date,
          receipt_path: row.receipt_path ?? '',
          verified_at: row.verified_at,
        }
      : null

  return {
    id: row.id,
    reference_code: row.reference_code,
    status: row.status,
    course_access_granted: row.course_access_granted,
    submitted_at: row.submitted_at,
    admin_notes: row.admin_notes,
    payload: row.payload,
    applicant_id: row.applicant_id,
    program_id: row.program_id,
    student_number: row.student_number,
    programs,
    profiles,
    payment,
  }
}

/** Display name when profile join is blocked by RLS (fallback to enrollment payload). */
export function enrollmentApplicantDisplay(row: AdminEnrollmentRow): {
  name: string
  email: string
  studentNumber: string | null
} {
  const payload = row.payload ?? {}
  const name =
    row.profiles?.full_name?.trim() ||
    String(payload.fullName ?? '').trim() ||
    '—'
  const email =
    row.profiles?.email?.trim() ||
    String(payload.email ?? '').trim() ||
    '—'
  const studentNumber =
    row.student_number?.trim() ||
    row.profiles?.student_number?.trim() ||
    null
  return { name, email, studentNumber }
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

  const { data, error } = await supabase.rpc('admin_list_enrollment_applications')
  if (error) {
    console.error('admin_list_enrollment_applications', error.message)
    return []
  }
  return ((data ?? []) as AdminEnrollmentRpcRow[]).map(mapRpcRow)
}

export async function staffVerifyPayment(applicationId: string, notes?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_verify_payment', {
    p_application_id: applicationId,
    p_notes: notes ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function staffApproveEnrollment(applicationId: string, notes?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_approve_enrollment', {
    p_application_id: applicationId,
    p_notes: notes ?? null,
  })
  if (error) {
    const msg = error.message
    if (msg.includes('payment must be verified')) {
      throw new Error('Verify payment first (step 1), then approve enrollment (step 2).')
    }
    if (msg.includes('function') && msg.includes('does not exist')) {
      throw new Error(
        'Database not updated — run migration 032_student_number_enrollment_admin_queue.sql in Supabase.',
      )
    }
    throw new Error(msg)
  }
}

export async function staffRejectEnrollment(applicationId: string, reason: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_reject_enrollment', {
    p_application_id: applicationId,
    p_reason: reason,
  })
  if (error) throw new Error(error.message)
}

export async function staffRequestCorrection(applicationId: string, message: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.rpc('staff_request_enrollment_correction', {
    p_application_id: applicationId,
    p_message: message,
  })
  if (error) throw new Error(error.message)
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