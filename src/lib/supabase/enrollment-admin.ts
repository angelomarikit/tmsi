import { getSupabaseClient } from '@/lib/supabase/client'

export async function approveEnrollmentApplication(applicationId: string, applicantId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error: payErr } = await supabase
    .from('payment_submissions')
    .update({ status: 'verified' })
    .eq('application_id', applicationId)
    .eq('application_type', 'leap_enrollment')

  if (payErr) throw payErr

  const { error: appErr } = await supabase
    .from('enrollment_applications')
    .update({ status: 'approved' })
    .eq('id', applicationId)

  if (appErr) throw appErr

  const { error: roleErr } = await supabase.rpc('grant_student_role', {
    p_user_id: applicantId,
  })
  if (roleErr) throw roleErr
}