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
        <strong>Upload allowed.</strong> You are signed in with admin upload access.
      </div>
    )
  }

  const hasSuperAdminSlug = adminUploadRolesRecognized(diag.roleSlugs)

  return (
    <div className="mt-3 rounded-lg border border-red-300/70 bg-red-50 px-4 py-3 text-xs text-red-950">
      <p className="font-semibold">Upload is blocked for this login</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {!diag.isAdminDb ? (
          <li>This account is not authorized to upload course files on the server.</li>
        ) : null}
        {!diag.hasRegisterRpc ? (
          <li>Server course-upload setup is incomplete — contact your technical administrator.</li>
        ) : null}
        {diag.probeError ? <li>Server check failed. Try signing out and back in.</li> : null}
        {hasSuperAdminSlug && !diag.isAdminDb ? (
          <li>Roles were found for this user but upload permission was not granted.</li>
        ) : null}
        {diag.email ? (
          <li>
            Login email: <strong>{diag.email}</strong>
          </li>
        ) : null}
      </ul>
      <p className="mt-3 text-[11px] text-red-900/90">
        Contact your technical administrator if you need upload access.
      </p>
    </div>
  )
}