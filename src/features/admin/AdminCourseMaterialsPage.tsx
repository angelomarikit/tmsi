import { CourseMaterialsAuditBanner } from '@/components/admin/CourseMaterialsAuditBanner'
import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import { useStaff } from '@/contexts/StaffContext'
import { fetchCourseUploadDiagnostics } from '@/lib/supabase/course-upload-diagnostics'
import {
  courseMaterialRejectionReason,
  deleteProgramMaterial,
  fetchProgramBySlug,
  fetchProgramMaterials,
  isAllowedCourseMaterial,
  normalizeCourseMaterialFile,
  uploadSingleProgramMaterial,
} from '@/lib/supabase/program-materials'
import { FileStack, Loader2, Trash2, Upload } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type UploadStep =
  | { phase: 'idle' }
  | { phase: 'picked'; name: string; sizeKb: number }
  | { phase: 'uploading'; name: string }
  | { phase: 'done'; name: string; materialId: string }
  | { phase: 'error'; message: string }

export function AdminCourseMaterialsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isStaff } = useStaff()
  const fileInputId = useId()
  const [step, setStep] = useState<UploadStep>({ phase: 'idle' })
  const queryClient = useQueryClient()

  const { data: program } = useQuery({
    queryKey: ['admin', 'program', slug],
    queryFn: () => (slug ? fetchProgramBySlug(slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
  })

  const { data: diag } = useQuery({
    queryKey: ['admin', 'course-upload-diagnostics'],
    queryFn: fetchCourseUploadDiagnostics,
    staleTime: 15_000,
  })

  const programId = program?.id ?? null
  const programTitle = program?.title ?? slug
  const canUpload = Boolean(isStaff || diag?.ok)

  const { data: materials = [], isLoading, error: listError, refetch } = useQuery({
    queryKey: ['admin', 'program-materials', programId],
    queryFn: () => fetchProgramMaterials(programId!, { throwOnError: true }),
    enabled: Boolean(programId),
  })

  async function onInputChange(list: FileList | null) {
    if (!programId || !slug) {
      const msg = 'Course not loaded — go back to Courses and open Manage again.'
      setStep({ phase: 'error', message: msg })
      toast.error(msg)
      return
    }
    if (!canUpload) {
      toast.error('Super admin required — see red diagnostics box above.')
      return
    }

    const raw = list?.[0]
    if (!raw) {
      const msg =
        'No file received from the picker (often caused by file type filter). Try again — all file types are allowed now.'
      setStep({ phase: 'error', message: msg })
      toast.error(msg)
      return
    }

    setStep({
      phase: 'picked',
      name: raw.name,
      sizeKb: Math.round(raw.size / 1024),
    })
    toast.message(`Selected: ${raw.name} — uploading…`)

    const normalized = await normalizeCourseMaterialFile(raw)
    const file = normalized ?? raw
    if (!isAllowedCourseMaterial(file)) {
      const reason = courseMaterialRejectionReason(raw) ?? 'Not a PDF or video'
      setStep({ phase: 'error', message: reason })
      toast.error(reason)
      return
    }
    if (normalized && raw.name !== file.name) {
      toast.message(`Renamed for storage: ${file.name}`)
    }

    setStep({ phase: 'uploading', name: file.name })
    try {
      const row = await uploadSingleProgramMaterial(programId, slug, file)
      setStep({ phase: 'done', name: row.label, materialId: row.id })
      toast.success(`Uploaded “${row.label}”`)
      await refetch()
      void queryClient.invalidateQueries({ queryKey: ['admin', 'program-material-counts'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'course-materials-audit'] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setStep({ phase: 'error', message: msg })
      toast.error(msg, { duration: 12_000 })
    }
  }

  const busy = step.phase === 'uploading'

  return (
    <div>
      <Link to="/admin/courses" className="text-sm text-forest underline">
        ← Back to courses
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-forest">
        Step 2 — Upload PDFs · {programTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/75">
        Pick <strong>one PDF (or video) at a time</strong>. After you choose a file, status appears below the
        button.
      </p>
      {programId && slug ? (
        <p className="mt-2 font-mono text-[11px] text-ink/55">
          Program id: {programId} · slug: {slug}
        </p>
      ) : null}

      <div className="mt-4">
        <CourseMaterialsAuditBanner />
      </div>
      <StaffUploadBanner />

      {!programId ? (
        <p className="mt-6 rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This slug is not in the database. Go back and use <strong>Create course</strong> first.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              id={fileInputId}
              type="file"
              className="sr-only"
              disabled={!canUpload || busy}
              onChange={(e) => {
                void onInputChange(e.target.files)
                e.target.value = ''
              }}
            />
            <label
              htmlFor={fileInputId}
              className={`btn-gloss-green inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white no-underline ${
                !canUpload || busy ? 'pointer-events-none opacity-45' : ''
              }`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {busy ? 'Uploading…' : 'Choose one PDF / video'}
            </label>
            <span className="text-xs text-ink/60">
              Storage: <code>private-documents/course-materials/{slug}/</code>
            </span>
          </div>

          <UploadStatusPanel step={step} />

          {listError ? (
            <p className="mt-4 text-sm text-red-800">
              {(listError as Error).message} — confirm migration 012.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2">
            {isLoading ? (
              <li className="text-sm text-ink/60">Loading saved files…</li>
            ) : materials.length === 0 ? (
              <li className="rounded-lg border border-dashed border-gold/40 bg-white px-4 py-8 text-center text-sm text-ink/60">
                <FileStack className="mx-auto h-8 w-8 text-gold" aria-hidden />
                <p className="mt-2">No files in database yet — choose a file above.</p>
              </li>
            ) : (
              materials.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gold/25 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <p className="font-medium text-forest">{m.label}</p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {m.file_path} · {m.status}
                    </p>
                  </div>
                  {canUpload ? (
                    <button
                      type="button"
                      className="rounded-md border border-red-200 p-2 text-red-800"
                      aria-label={`Remove ${m.label}`}
                      onClick={async () => {
                        if (!window.confirm(`Remove record for ${m.label}?`)) return
                        try {
                          await deleteProgramMaterial(m.id)
                          toast.success('Removed')
                          await refetch()
                          void queryClient.invalidateQueries({ queryKey: ['admin', 'program-material-counts'] })
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Delete failed')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  )
}

function UploadStatusPanel({ step }: { step: UploadStep }) {
  if (step.phase === 'idle') {
    return (
      <p className="mt-3 text-xs text-ink/55">
        Status: waiting for you to pick a file — any file type is accepted; PDFs are detected automatically.
      </p>
    )
  }
  if (step.phase === 'picked') {
    return (
      <p className="mt-3 rounded-lg border border-gold/30 bg-cream px-3 py-2 text-xs text-ink/80">
        Selected <strong>{step.name}</strong> ({step.sizeKb} KB)…
      </p>
    )
  }
  if (step.phase === 'uploading') {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg border border-forest/25 bg-forest/5 px-3 py-2 text-xs text-forest">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Uploading <strong>{step.name}</strong> to Supabase…
      </p>
    )
  }
  if (step.phase === 'done') {
    return (
      <p className="mt-3 rounded-lg border border-forest/30 bg-forest/10 px-3 py-2 text-xs text-forest">
        Saved <strong>{step.name}</strong> — id <code>{step.materialId}</code>
      </p>
    )
  }
  return (
    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-950 whitespace-pre-wrap">
      {step.message}
    </p>
  )
}