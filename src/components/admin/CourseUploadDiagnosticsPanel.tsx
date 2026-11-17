import {
  adminUploadRolesRecognized,
  fetchCourseUploadDiagnostics,
  type CourseUploadDiagnostics,
} from '@/lib/supabase/course-upload-diagnostics'
import { useQuery } from '@tanstack/react-query'

export function CourseUploadDiagnosticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'course-upload-diagnostics'],
    queryFn: fetchCourseUploadDiagnostics,
    staleTime: 30_000,
  })

  if (isLoading || !data) return null

  return <Panel diag={data} />
}

function Panel({ diag }: { diag: CourseUploadDiagnostics }) {
  if (diag.ok) {
    return (
      <div className="mt-3 rounded-lg border border-forest/25 bg-forest/5 px-4 py-3 text-xs text-forest">
        <strong>Upload allowed.</strong> Logged in as admin
        {diag.roleSlugs.length > 0 ? ` (${diag.roleSlugs.join(', ')})` : ' (super_admin)'}.
        {diag.leapMaterialRows != null ? ` ${diag.leapMaterialRows} material row(s) in DB.` : null}
      </div>
    )
  }

  const hasSuperAdminSlug = adminUploadRolesRecognized(diag.roleSlugs)

  return (
    <div className="mt-3 rounded-lg border border-red-300/70 bg-red-50 px-4 py-3 text-xs text-red-950">
      <p className="font-semibold">Why PDF upload is blocked</p>
      <p className="mt-1 text-[11px]">
        There is <strong>no separate “staff” role</strong>. Course PDFs require{' '}
        <strong>super_admin</strong> (or registrar / content_manager) in Supabase{' '}
        <code>user_roles</code>.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {!diag.isAdminDb ? (
          <li>
            This login is not linked to <strong>super_admin</strong> in the database (RLS blocks Storage +
            PDF rows).
          </li>
        ) : null}
        {!diag.hasRegisterRpc ? (
          <li>
            <code>staff_register_program_material</code> RPC missing — run migrations 035, 038, 041.
          </li>
        ) : null}
        {diag.probeError ? <li>Probe: {diag.probeError}</li> : null}
        {hasSuperAdminSlug && !diag.isAdminDb ? (
          <li>Roles listed ({diag.roleSlugs.join(', ')}) but admin check failed — run migration 041.</li>
        ) : null}
        {diag.email ? (
          <li>
            Login email: <strong>{diag.email}</strong>
          </li>
        ) : null}
        {diag.uid ? (
          <li>
            User id: <code className="select-all">{diag.uid}</code>
          </li>
        ) : null}
      </ul>
      {diag.fixSteps.length > 0 ? (
        <ol className="mt-3 max-h-48 list-inside list-decimal space-y-2 overflow-y-auto whitespace-pre-wrap font-mono text-[10px]">
          {diag.fixSteps.map((step, i) => (
            <li key={`${i}-${step.slice(0, 40)}`}>{step}</li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}