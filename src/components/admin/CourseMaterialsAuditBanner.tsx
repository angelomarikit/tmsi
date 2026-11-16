import { useStaff } from '@/contexts/StaffContext'
import {
  auditAdminCoursesTable,
  probeCourseMaterialsBackend,
  supabaseConfigured,
} from '@/lib/supabase/course-materials-audit'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

export function CourseMaterialsAuditBanner() {
  const { session, isStaff, loading, rolesLoading } = useStaff()

  const audit = useQuery({
    queryKey: ['admin', 'course-materials-audit', session?.user.id, isStaff],
    queryFn: async () => {
      const table = await auditAdminCoursesTable()
      const probe = await probeCourseMaterialsBackend(isStaff)
      return { table, probe }
    },
    enabled: !loading && !rolesLoading,
    staleTime: 60_000,
  })

  if (loading || rolesLoading) return null

  const problems: string[] = []
  const hints: string[] = []

  if (!supabaseConfigured) {
    problems.push('Supabase env vars are missing on this build — uploads cannot reach the database.')
    hints.push('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel/hosting, then redeploy.')
  }

  if (!session) {
    problems.push('You are not signed in — course PDFs will not save.')
    hints.push('Use Sign in as admin in the header (staff account with user_roles).')
  }

  if (session && !isStaff) {
    problems.push('Signed in, but this account has no staff role in the app.')
    hints.push('Add your auth user to user_roles in Supabase (super_admin, registrar, or content_manager).')
  }

  if (audit.data?.table.programFetchError) {
    problems.push(`Programs query failed: ${audit.data.table.programFetchError}`)
  }

  if (audit.data?.probe.staffDb === false) {
    problems.push('Database says this user is not staff — Storage and content_items writes are blocked (RLS).')
  }

  if (audit.data?.probe.staffDbError && audit.data.probe.staffDb !== false) {
    problems.push(`Staff check: ${audit.data.probe.staffDbError}`)
  }

  if (audit.data?.probe.probeError) {
    problems.push(`Materials probe: ${audit.data.probe.probeError}`)
  }

  for (const h of audit.data?.probe.migrationsHint ?? []) {
    if (!hints.includes(h)) hints.push(h)
  }

  hints.push('Run SQL migrations 011, 012, 033, 034, and 035 in Supabase if uploads still fail.')

  if (problems.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-forest/25 bg-forest/5 px-4 py-3 text-xs text-forest">
        <strong>Course materials pipeline OK.</strong>{' '}
        {audit.data?.table.programRowCount != null ? (
          <span>
            {audit.data.table.programRowCount} program(s) in database
            {audit.data.probe.leapMaterialRows != null
              ? ` · ${audit.data.probe.leapMaterialRows} LEAP file row(s) in content_items`
              : ''}
            .
          </span>
        ) : (
          <span>PDFs save to Storage, then content_items (students see them after enrollment approval).</span>
        )}
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-950">
      <p className="font-semibold">Course upload blocked — fix before adding PDFs</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        {problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <ul className="mt-2 list-inside list-decimal space-y-0.5 text-[11px] text-red-900/90">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {!session ? (
        <Link to="/login?next=/admin/courses" className="mt-2 inline-block text-xs font-semibold text-forest underline">
          Sign in as admin
        </Link>
      ) : null}
    </div>
  )
}