import { getSupabaseClient } from '@/lib/supabase/client'

export type LeapCatalogResetResult = {
  programs_deleted: number
  content_items_deleted: number
  enrollments_deleted: number
  payment_submissions_deleted: number
  payment_verifications_deleted: number
  storage_note: string
}

/** Wipes programs, LEAP materials rows, and enrollment data — staff RPC migration 036. */
export async function resetLeapCourseCatalog(): Promise<LeapCatalogResetResult> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('staff_reset_leap_catalog', { p_confirm: 'RESET' })
  if (error) {
    const missing =
      error.code === 'PGRST202' || /staff_reset_leap_catalog/i.test(error.message ?? '')
    throw new Error(
      missing
        ? `${error.message} — run migration 036_reset_leap_courses.sql in Supabase SQL Editor, then retry.`
        : error.message,
    )
  }
  return (data ?? {}) as LeapCatalogResetResult
}