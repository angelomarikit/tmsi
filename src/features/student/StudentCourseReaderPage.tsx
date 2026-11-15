import {
  checkProgramAccess,
  fetchStudentDashboardEnrollments,
} from '@/lib/supabase/student-dashboard'
import {
  createMaterialSignedUrl,
  fetchLearningMaterials,
} from '@/lib/supabase/learning-access'
import { isPdfMaterial, isVideoMaterial } from '@/lib/supabase/program-materials'
import { Download, FileText, Film } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'

export function StudentCourseReaderPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewLabel, setViewLabel] = useState<string | null>(null)
  const [viewKind, setViewKind] = useState<'pdf' | 'video' | null>(null)

  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['student', 'access', courseId],
    queryFn: () => (courseId ? checkProgramAccess(courseId) : Promise.resolve(false)),
    enabled: Boolean(courseId),
  })

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student', 'dashboard-enrollments'],
    queryFn: fetchStudentDashboardEnrollments,
  })

  const enrollment = enrollments.find((e) => e.program_id === courseId)

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['learning', 'materials', courseId],
    queryFn: () => (courseId ? fetchLearningMaterials(courseId) : Promise.resolve([])),
    enabled: Boolean(courseId) && hasAccess === true,
  })

  async function openMaterial(path: string, label: string, mode: 'view' | 'download') {
    try {
      const url = await createMaterialSignedUrl(path)
      if (mode === 'view') {
        setViewUrl(url)
        setViewLabel(label)
        setViewKind(isVideoMaterial(path) ? 'video' : 'pdf')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = label
        a.target = '_blank'
        a.rel = 'noopener'
        a.click()
      }
    } catch {
      toast.error('Unable to access this file — access may be revoked or file missing')
    }
  }

  if (accessLoading) return <p className="text-sm text-ink/60">Checking access…</p>

  if (!hasAccess) {
    return (
      <div className="max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
        <p className="font-semibold text-forest">Course locked</p>
        <p className="mt-2 text-sm text-ink/75">
          Materials are available only after payment verification and enrollment approval.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-forest underline">
          Back to My Courses
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-gold/30 bg-white p-4 shadow-sm">
        <Link to="/dashboard" className="text-xs text-forest underline">
          ← My Courses
        </Link>
        <h2 className="mt-3 font-display text-lg font-semibold text-forest">
          {enrollment?.title ?? 'Course'}
        </h2>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">
          Materials
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {materialsLoading ? (
            <li className="text-ink/60">Loading…</li>
          ) : materials.length === 0 ? (
            <li className="text-xs text-ink/65">
              No learning materials are available for this course yet.
            </li>
          ) : (
            materials.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="text-left text-forest underline"
                  onClick={() => m.file_path && void openMaterial(m.file_path, m.label, 'view')}
                >
                  {m.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <div>
        <ul className="space-y-3">
          {materials.map((m) =>
            m.file_path ? (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/25 bg-white px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-forest">
                  {m.file_path && isVideoMaterial(m.file_path) ? (
                    <Film className="h-4 w-4" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4" aria-hidden />
                  )}
                  {m.label}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-forest"
                    onClick={() => void openMaterial(m.file_path!, m.label, 'view')}
                  >
                    {m.file_path && isPdfMaterial(m.file_path) ? 'Read' : 'Play'}
                  </button>
                  <button
                    type="button"
                    className="btn-gloss-green inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    onClick={() => void openMaterial(m.file_path!, m.label, 'download')}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download
                  </button>
                </div>
              </li>
            ) : null,
          )}
        </ul>
        {viewUrl && viewKind === 'video' ? (
          <video
            key={viewUrl}
            controls
            className="mt-6 w-full max-h-[min(70vh,720px)] rounded-lg border border-gold/35 bg-black"
            src={viewUrl}
          >
            <track kind="captions" />
          </video>
        ) : null}
        {viewUrl && viewKind === 'pdf' ? (
          <iframe
            title={viewLabel ?? 'Course PDF'}
            src={viewUrl}
            className="mt-6 h-[min(70vh,720px)] w-full rounded-lg border border-gold/35 bg-ivory"
          />
        ) : null}
      </div>
    </div>
  )
}