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
    problems.push('This site build is not connected to the online database.')
    hints.push('Update hosting settings and redeploy, or contact your technical administrator.')
  }

  if (!session) {
    problems.push('You are not signed in — course PDFs will not save.')
    hints.push('Sign in with an admin account from the header.')
  }

  if (session && !isStaff) {
    problems.push('Signed in, but this account does not have admin upload access.')
    hints.push('Use an account with registrar or content manager access.')
  }

  if (audit.data?.table.programFetchError) {
    problems.push('Could not load the course list from the server.')
  }

  if (audit.data?.probe.staffDb === false) {
    problems.push('The server rejected upload permissions for this login.')
  }

  if (audit.data?.probe.staffDbError && audit.data.probe.staffDb !== false) {
    problems.push('Could not verify admin permissions.')
  }

  if (audit.data?.probe.probeError) {
    problems.push('Course materials upload check failed.')
  }

  if (problems.length === 0) return null

  hints.push('If this persists, contact your technical administrator.')

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