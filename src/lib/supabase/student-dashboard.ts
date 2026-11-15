import { getSupabaseClient } from '@/lib/supabase/client'

export type StudentEnrollmentCard = {
  application_id: string
  program_id: string
  slug: string
  code: string
  title: string
  subtitle: string | null
  cover_asset_key: string | null
  reference_code: string | null
  enrollment_status: string
  payment_status: string
  has_payment_receipt: boolean
  course_access_granted: boolean
  submitted_at: string | null
  approved_at: string | null
}

export async function fetchStudentDashboardEnrollments(): Promise<StudentEnrollmentCard[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_student_dashboard_enrollments')
  if (error) return []
  return ((data ?? []) as StudentEnrollmentCard[]).map((row) => ({
    ...row,
    has_payment_receipt: Boolean(row.has_payment_receipt),
  }))
}

export async function ensureEnrollmentPaymentReminder(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.rpc('ensure_enrollment_payment_reminder')
}

export async function checkProgramAccess(programId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false
  const { data, error } = await supabase.rpc('user_has_program_access', {
    p_user_id: user.user.id,
    p_program_id: programId,
  })
  return Boolean(data) && !error
}

export async function fetchMyNotifications() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('id, title, body, link_path, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data ?? []
}