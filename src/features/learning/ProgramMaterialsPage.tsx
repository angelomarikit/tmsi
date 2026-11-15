import {
  createMaterialSignedUrl,
  fetchLearningMaterials,
  fetchMyEnrolledPrograms,
} from '@/lib/supabase/learning-access'
import { useStaff } from '@/contexts/StaffContext'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProgramMaterialsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { session } = useStaff()
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewTitle, setViewTitle] = useState<string | null>(null)

  const { data: enrolled = [] } = useQuery({
    queryKey: ['learning', 'programs'],
    queryFn: fetchMyEnrolledPrograms,
    enabled: Boolean(session),
  })

  const program = enrolled.find((p) => p.slug === slug)

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['learning', 'materials', program?.program_id],
    queryFn: () =>
      program?.program_id ? fetchLearningMaterials(program.program_id) : Promise.resolve([]),
    enabled: Boolean(program?.program_id),
  })

  async function openMaterial(filePath: string, label: string, mode: 'view' | 'download') {
    try {
      const url = await createMaterialSignedUrl(filePath)
      if (mode === 'view') {
        setViewUrl(url)
        setViewTitle(label)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = label.endsWith('.pdf') ? label : `${label}.pdf`
        a.rel = 'noopener'
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not access file')
    }
  }

  if (!session) {
    return (
      <p className="px-4 py-16 text-center text-sm">
        <Link to="/login?next=/learning" className="text-forest underline">
          Sign in
        </Link>{' '}
        to view materials.
      </p>
    )
  }

  if (!program) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-ink/75">
          You do not have access to this course yet, or it is not approved.
        </p>
        <Link to="/learning" className="mt-4 inline-block text-sm text-forest underline">
          Back to My Learning
        </Link>
      </div>
    )
  }

  return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link to="/learning" className="text-sm text-forest underline">
          ← My Learning
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold text-forest">{program.title}</h1>
        <p className="text-sm text-ink/70">{program.subtitle}</p>

        <ul className="mt-8 space-y-3">
          {isLoading ? (
            <li className="text-sm text-ink/60">Loading modules…</li>
          ) : materials.length === 0 ? (
            <li className="rounded-lg border border-dashed border-gold/40 px-4 py-8 text-center text-sm text-ink/60">
              No PDF modules uploaded for this course yet.
            </li>
          ) : (
            materials.map((m) =>
              m.file_path ? (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/25 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-5 w-5 text-forest" aria-hidden />
                    <span className="text-sm font-medium text-forest">{m.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-forest"
                      onClick={() => void openMaterial(m.file_path!, m.label, 'view')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View
                    </button>
                    <button
                      type="button"
                      className="btn-gloss-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => void openMaterial(m.file_path!, m.label, 'download')}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download
                    </button>
                  </div>
                </li>
              ) : null,
            )
          )}
        </ul>

        {viewUrl ? (
          <section className="mt-10" aria-labelledby="pdf-viewer">
            <h2 id="pdf-viewer" className="text-sm font-semibold text-forest">
              {viewTitle}
            </h2>
            <iframe
              title={viewTitle ?? 'Course PDF'}
              src={viewUrl}
              className="mt-3 h-[min(70vh,720px)] w-full rounded-lg border border-gold/35 bg-ivory"
            />
          </section>
        ) : null}
      </div>
  )
}