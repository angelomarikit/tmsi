import { getSupabaseClient, supabaseConfigured } from '@/lib/supabase/client'

export type CourseMaterialsAudit = {
  supabaseConfigured: boolean
  signedIn: boolean
  email: string | null
  staffClient: boolean
  staffDb: boolean | null
  staffDbError: string | null
  programRowCount: number | null
  programFetchError: string | null
  usingStaticFallback: boolean
  leapMaterialRows: number | null
  probeError: string | null
  migrationsHint: string[]
}

export async function probeCourseMaterialsBackend(
  staffClient: boolean,
): Promise<Pick<CourseMaterialsAudit, 'staffDb' | 'staffDbError' | 'leapMaterialRows' | 'probeError' | 'migrationsHint'>> {
  const supabase = getSupabaseClient()
  const migrationsHint: string[] = []

  if (!supabase) {
    return {
      staffDb: null,
      staffDbError: 'Supabase client missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)',
      leapMaterialRows: null,
      probeError: null,
      migrationsHint: [],
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      staffDb: false,
      staffDbError: 'Not signed in',
      leapMaterialRows: null,
      probeError: null,
      migrationsHint: ['Sign in at /login?next=/admin/courses'],
    }
  }

  const { data: staffRpc, error: staffErr } = await supabase.rpc('current_user_is_staff')
  const staffDb = staffErr ? null : Boolean(staffRpc)

  const { data: probe, error: probeErr } = await supabase.rpc('admin_probe_course_materials_access')
  let leapMaterialRows: number | null = null
  let probeError: string | null = null

  if (probeErr) {
    probeError = probeErr.message
    if (probeErr.code === 'PGRST202' || /admin_probe_course_materials_access/i.test(probeErr.message)) {
      migrationsHint.push('035_staff_upload_program_material.sql (admin_probe_course_materials_access)')
    }
  } else if (probe && typeof probe === 'object') {
    const p = probe as { leap_material_rows?: number; is_staff?: boolean }
    leapMaterialRows = typeof p.leap_material_rows === 'number' ? p.leap_material_rows : null
    if (p.is_staff === false && staffDb !== true) {
      migrationsHint.push('Assign staff role in Supabase user_roles (super_admin, registrar, content_manager)')
    }
  }

  if (!staffClient && staffDb) {
    migrationsHint.push('Refresh the page — staff role detected in DB but UI cache was stale')
  }

  return {
    staffDb: staffDb ?? (probe && typeof probe === 'object' ? Boolean((probe as { is_staff?: boolean }).is_staff) : null),
    staffDbError: staffErr?.message ?? (staffDb === false ? 'No staff role in database (RLS blocks uploads)' : null),
    leapMaterialRows,
    probeError,
    migrationsHint,
  }
}

export async function assertStaffCanUploadMaterials(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured on this site build')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Sign in as admin before uploading course PDFs')
  }
  const { data, error } = await supabase.rpc('current_user_is_staff')
  if (error) {
    const { data: probe, error: probeErr } = await supabase.rpc('admin_probe_course_materials_access')
    if (probeErr?.code === 'PGRST202') {
      throw new Error(
        `${error.message} — run migration 035 in Supabase SQL Editor, then confirm user_roles staff assignment.`,
      )
    }
    if (probe && typeof probe === 'object' && (probe as { is_staff?: boolean }).is_staff === false) {
      throw new Error(
        'Your account is signed in but has no staff role in Supabase — uploads are blocked by RLS (migrations 011 & 012).',
      )
    }
    throw new Error(error.message)
  }
  if (!data) {
    throw new Error(
      'No staff role in Supabase for this account — add user_roles (super_admin, registrar, or content_manager).',
    )
  }
}

export async function auditAdminCoursesTable(): Promise<
  Pick<CourseMaterialsAudit, 'programRowCount' | 'programFetchError' | 'usingStaticFallback'>
> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      programRowCount: null,
      programFetchError: 'Supabase not configured',
      usingStaticFallback: true,
    }
  }
  const { count, error, status } = await supabase
    .from('programs')
    .select('id', { count: 'exact', head: true })

  if (error) {
    return {
      programRowCount: 0,
      programFetchError: `${error.message} (HTTP ${status}) — staff RLS or session may block programs read`,
      usingStaticFallback: true,
    }
  }
  return {
    programRowCount: count ?? 0,
    programFetchError: null,
    usingStaticFallback: false,
  }
}

export { supabaseConfigured }