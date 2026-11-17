import { hasAdminUploadRole } from '@/lib/admin-roles'
import { getSupabaseClient } from '@/lib/supabase/client'

export type CourseUploadDiagnostics = {
  ok: boolean
  uid: string | null
  email: string | null
  isAdminDb: boolean
  roleSlugs: string[]
  leapMaterialRows: number | null
  hasRegisterRpc: boolean
  hasResetRpc: boolean
  probeError: string | null
  fixSteps: string[]
}

function grantSuperAdminSql(email: string, uid: string): string {
  const safeEmail = email.replace(/'/g, "''")
  return (
    `-- Grant super_admin for uploads (use your real email — not placeholders)\n` +
    `insert into public.profiles (id, email)\n` +
    `select id, email from auth.users where id = '${uid}'::uuid\n` +
    `on conflict (id) do update set email = excluded.email;\n\n` +
    `insert into public.user_roles (user_id, role_id)\n` +
    `select u.id, r.id from auth.users u\n` +
    `join public.roles r on r.slug = 'super_admin'\n` +
    `where u.id = '${uid}'::uuid\n` +
    `on conflict (user_id, role_id) do nothing;\n\n` +
    `-- Or by email:\n` +
    `insert into public.user_roles (user_id, role_id)\n` +
    `select u.id, r.id from auth.users u\n` +
    `join public.roles r on r.slug = 'super_admin'\n` +
    `where lower(u.email) = lower('${safeEmail}')\n` +
    `on conflict (user_id, role_id) do nothing;`
  )
}

export async function fetchCourseUploadDiagnostics(): Promise<CourseUploadDiagnostics> {
  const supabase = getSupabaseClient()
  const fixSteps: string[] = []

  if (!supabase) {
    return {
      ok: false,
      uid: null,
      email: null,
      isAdminDb: false,
      roleSlugs: [],
      leapMaterialRows: null,
      hasRegisterRpc: false,
      hasResetRpc: false,
      probeError: 'Supabase env not configured on this build',
      fixSteps: ['Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.'],
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      ok: false,
      uid: null,
      email: null,
      isAdminDb: false,
      roleSlugs: [],
      leapMaterialRows: null,
      hasRegisterRpc: false,
      hasResetRpc: false,
      probeError: 'Not signed in',
      fixSteps: ['Sign in at /login?next=/admin/courses'],
    }
  }

  const email = session.user.email ?? null

  const { data: probe, error: probeErr } = await supabase.rpc('admin_probe_course_materials_access')

  if (probeErr) {
    const missing =
      probeErr.code === 'PGRST202' || /admin_probe_course_materials_access/i.test(probeErr.message)
    fixSteps.push(
      missing
        ? 'Run migrations 035, 040, and 041 in Supabase SQL Editor.'
        : probeErr.message,
    )
    return {
      ok: false,
      uid: session.user.id,
      email,
      isAdminDb: false,
      roleSlugs: [],
      leapMaterialRows: null,
      hasRegisterRpc: false,
      hasResetRpc: false,
      probeError: probeErr.message,
      fixSteps,
    }
  }

  const p = probe as {
    is_admin?: boolean
    is_staff?: boolean
    email?: string
    uid?: string
    role_slugs?: string[]
    leap_material_rows?: number
    has_staff_register_program_material?: boolean
    has_staff_reset_leap_catalog?: boolean
  }

  const roleSlugs = Array.isArray(p.role_slugs) ? p.role_slugs : []
  const isAdminDb = Boolean(p.is_admin ?? p.is_staff)
  const hasRegisterRpc = Boolean(p.has_staff_register_program_material)
  const hasResetRpc = Boolean(p.has_staff_reset_leap_catalog)

  if (!isAdminDb) {
    fixSteps.push(
      'Supabase does not see super_admin on this login — uploads use super_admin (not a separate “staff” role).',
    )
    fixSteps.push(grantSuperAdminSql(email ?? 'your@email.com', session.user.id))
  } else if (!hasAdminUploadRole(roleSlugs) && roleSlugs.length > 0) {
    fixSteps.push(`Roles on file: ${roleSlugs.join(', ')} — upload needs super_admin, registrar, or content_manager.`)
  }

  if (!hasRegisterRpc) {
    fixSteps.push('Run 035_staff_upload_program_material.sql and 038_register_material_path_relaxed.sql')
  }

  const ok = isAdminDb && hasRegisterRpc

  return {
    ok,
    uid: (p.uid as string) ?? session.user.id,
    email: p.email ?? email,
    isAdminDb,
    roleSlugs,
    leapMaterialRows: typeof p.leap_material_rows === 'number' ? p.leap_material_rows : null,
    hasRegisterRpc,
    hasResetRpc,
    probeError: null,
    fixSteps,
  }
}

export { hasAdminUploadRole as adminUploadRolesRecognized }