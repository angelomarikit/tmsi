import { getSupabaseClient } from '@/lib/supabase/client'

export type DbEbookRow = {
  id: string
  legacy_slug: string | null
  title: string
  author: string | null
  description: string | null
  publication_status: string
  rights_confirmed: boolean
  pdf_path: string | null
  cover_path: string | null
}

export type DbEnrollmentRow = {
  id: string
  applicant_id: string | null
  program_id: string
  reference_code: string | null
  status: string
  submitted_at: string | null
  created_at: string
  programs: { title: string; code: string } | null
  payload: { fullName?: string } | null
}

export type DbPaymentRow = {
  id: string
  reference_number: string
  declared_amount: number
  status: string
  payment_date: string | null
  created_at: string
}

export type DbProfileRow = {
  id: string
  email: string
  full_name: string | null
  student_number?: string | null
  created_at: string
  has_student_role?: boolean
  enrollment_count?: number
  latest_enrollment_status?: string | null
}

export async function fetchAdminProgramsTable() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, code, slug, title, subtitle, fee_php, publication_status, active, featured_in_carousel, sort_order, cover_asset_key',
    )
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchAdminEbooks() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ebooks')
    .select(
      'id, legacy_slug, title, author, description, publication_status, rights_confirmed, pdf_path, cover_path',
    )
    .order('title')
  if (error) return []
  return (data ?? []) as DbEbookRow[]
}

export async function fetchAdminEnrollments() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('enrollment_applications')
    .select(
      'id, applicant_id, program_id, reference_code, status, submitted_at, created_at, payload, programs(title, code)',
    )
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []).map((row) => {
    const programs = row.programs as
      | { title: string; code: string }
      | { title: string; code: string }[]
      | null
    return {
      ...row,
      programs: Array.isArray(programs) ? programs[0] ?? null : programs,
    } as DbEnrollmentRow
  })
}

export async function fetchAdminPayments() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('payment_submissions')
    .select('id, reference_number, declared_amount, status, payment_date, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as DbPaymentRow[]
}

/** All learner accounts for Admin → Students (RPC). */
export async function fetchAdminStudentProfiles() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_list_students')
  if (error) throw new Error(error.message)
  return (data ?? []) as DbProfileRow[]
}

/** Removes a learner login, enrollments, and related payment rows (staff only). */
export async function deleteAdminStudentAccount(userId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('SERVICE_UNAVAILABLE')
  const { error } = await supabase.rpc('staff_delete_student_account', {
    p_user_id: userId,
  })
  if (error) throw new Error(error.message)
}

export async function fetchInstitutionSettings() {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('institution_settings')
    .select('key, value, approved, updated_at')
    .order('key')
  if (error) return []
  return data ?? []
}