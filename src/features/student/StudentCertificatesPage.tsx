import { useStaff } from '@/contexts/StaffContext'
import { createMaterialSignedUrl, fetchLearningMaterials } from '@/lib/supabase/learning-access'
import {
  checkTmvsMembershipAccess,
  fetchMembershipMaterials,
} from '@/lib/supabase/membership-materials'
import { fetchStudentDashboardEnrollments } from '@/lib/supabase/student-dashboard'
import { Award, Download, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

function isCertificateLabel(label: string, filePath: string | null) {
  const text = `${label} ${filePath ?? ''}`.toLowerCase()
  return /certificate|credential|diploma/.test(text)
}

export function StudentCertificatesPage() {
  const { session } = useStaff()

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['student', 'dashboard-enrollments'],
    queryFn: fetchStudentDashboardEnrollments,
    enabled: Boolean(session),
  })

  const { data: tmvsAccess } = useQuery({
    queryKey: ['tmvs', 'access'],
    queryFn: checkTmvsMembershipAccess,
    enabled: Boolean(session),
  })

  const { data: memberMaterials = [] } = useQuery({
    queryKey: ['tmvs', 'member-materials'],
    queryFn: fetchMembershipMaterials,
    enabled: Boolean(tmvsAccess),
  })

  const approvedEnrollments = enrollments.filter((e) => e.enrollment_status === 'approved')
  const hasAnyEnrollment = enrollments.length > 0

  async function openMaterial(path: string, label: string) {
    try {
      const url = await createMaterialSignedUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error(`Could not open ${label}`)
    }
  }

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-forest">Certificates</h1>
      <p className="mt-1 text-sm text-ink/70">
        Course certificates appear here after you enroll. TMVS membership certificate is separate.
      </p>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading…</p>
      ) : !hasAnyEnrollment ? (
        <div className="mt-6 rounded-xl border border-dashed border-gold/40 bg-white px-6 py-10 text-center">
          <p className="text-sm text-ink/75">You have no course enrollments yet.</p>
          <Link to="/courses" className="mt-3 inline-block text-sm font-semibold text-forest underline">
            Browse courses
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {enrollments.map((row) => (
            <CourseCertificateRow
              key={row.application_id}
              programId={row.program_id}
              title={row.title}
              code={row.code}
              status={row.enrollment_status}
              canAccess={row.enrollment_status === 'approved' && row.course_access_granted}
              onOpen={openMaterial}
            />
          ))}
        </ul>
      )}

      {tmvsAccess ? (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-lg text-forest">
            <Award className="h-5 w-5 text-gold" aria-hidden />
            TMVS membership
          </h2>
          <ul className="mt-3 space-y-2">
            {memberMaterials
              .filter((m) => m.file_path && isCertificateLabel(m.label, m.file_path))
              .map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/25 bg-white px-4 py-3 text-sm"
                >
                  <span className="font-medium text-forest">{m.label}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-forest/30 px-3 py-1 text-xs font-semibold text-forest"
                    onClick={() => void openMaterial(m.file_path!, m.label)}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Open
                  </button>
                </li>
              ))}
          </ul>
          {memberMaterials.filter((m) => isCertificateLabel(m.label, m.file_path)).length === 0 ? (
            <p className="mt-2 text-xs text-ink/60">
              Staff will publish your digital membership certificate under Member downloads when ready.
            </p>
          ) : null}
        </div>
      ) : null}

      {approvedEnrollments.length === 0 && hasAnyEnrollment ? (
        <p className="mt-6 text-xs text-ink/55">
          Certificates for courses unlock when enrollment is approved and payment is verified.
        </p>
      ) : null}
    </section>
  )
}

function CourseCertificateRow({
  programId,
  title,
  code,
  status,
  canAccess,
  onOpen,
}: {
  programId: string
  title: string
  code: string
  status: string
  canAccess: boolean
  onOpen: (path: string, label: string) => void
}) {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['learning', 'certificates', programId],
    queryFn: () => fetchLearningMaterials(programId),
    enabled: canAccess,
  })

  const certs = materials.filter((m) => m.file_path && isCertificateLabel(m.label, m.file_path))

  return (
    <li className="rounded-xl border border-gold/25 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg text-forest">{title}</p>
          <p className="text-xs text-ink/55">
            {code} · Enrollment: {status.replaceAll('_', ' ')}
          </p>
        </div>
        {canAccess && certs.length > 0 ? (
          <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-forest">
            Available
          </span>
        ) : null}
      </div>

      {isLoading && canAccess ? (
        <p className="mt-2 text-xs text-ink/50">Checking for certificate files…</p>
      ) : null}

      {!canAccess ? (
        <p className="mt-2 text-xs text-ink/60">
          Certificate available after approval — you can still see this course while pending.
        </p>
      ) : certs.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-ink/60">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          No certificate PDF uploaded yet for this course. Check back after TMSI publishes it in course
          materials (label may include “certificate”).
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {certs.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-forest underline"
                onClick={() => onOpen(c.file_path!, c.label)}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}