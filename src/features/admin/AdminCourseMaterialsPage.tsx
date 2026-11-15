import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import { useStaff } from '@/contexts/StaffContext'
import { getProgramBySlug } from '@/data/programs'
import {
  deleteProgramMaterial,
  fetchProgramBySlug,
  fetchProgramMaterials,
  uploadProgramMaterials,
} from '@/lib/supabase/program-materials'
import { FileStack, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function AdminCourseMaterialsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isStaff } = useStaff()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const staticFallback = slug ? getProgramBySlug(slug) : undefined

  const { data: program } = useQuery({
    queryKey: ['admin', 'program', slug],
    queryFn: () => (slug ? fetchProgramBySlug(slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
  })

  const programId = program?.id ?? null
  const programTitle = program?.title ?? staticFallback?.title ?? slug

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['admin', 'program-materials', programId],
    queryFn: () => (programId ? fetchProgramMaterials(programId) : Promise.resolve([])),
    enabled: Boolean(programId),
  })

  async function onFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    e.target.value = ''
    if (!fileList?.length || !programId || !slug) return
    if (!isStaff) {
      toast.error('Admin sign-in required')
      return
    }
    setBusy(true)
    try {
      const count = await uploadProgramMaterials(programId, slug, Array.from(fileList))
      if (count === 0) {
        toast.message('No supported files selected')
      } else {
        toast.success(`Uploaded ${count} file${count === 1 ? '' : 's'}`)
      }
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'program-materials', programId],
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'program-material-counts'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/admin/courses" className="text-sm text-forest underline">
        ← Back to courses
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-forest">
        Course materials — {programTitle}
        {materials.length > 0 ? (
          <span className="ml-2 rounded-full bg-forest/10 px-2.5 py-0.5 text-sm font-medium text-forest">
            {materials.length} PDF{materials.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/75">
        Upload <strong>PDF modules</strong> or <strong>video</strong> per program. Files stay in the private
        bucket and are listed here — they are never shown as images on the public site.
      </p>
      <StaffUploadBanner />

      {!programId ? (
        <p className="mt-6 rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This program is not in Supabase yet. Run migrations <code className="text-xs">009</code>{' '}
          or <code className="text-xs">npm run db:seed</code> so the course has a database{' '}
          <code className="text-xs">id</code> before attaching PDFs.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              multiple
              className="hidden"
              onChange={onFilesSelected}
            />
            <button
              type="button"
              disabled={!isStaff || busy}
              className="btn-gloss-green inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-45"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {busy ? 'Uploading…' : 'Upload files (PDF / video)'}
            </button>
            <span className="text-xs text-ink/60">
              Stored under <code>private-documents/course-materials/{slug}/</code>
            </span>
          </div>

          <ul className="mt-6 space-y-2">
            {isLoading ? (
              <li className="text-sm text-ink/60">Loading…</li>
            ) : materials.length === 0 ? (
              <li className="rounded-lg border border-dashed border-gold/40 bg-white px-4 py-8 text-center text-sm text-ink/60">
                <FileStack className="mx-auto h-8 w-8 text-gold" aria-hidden />
                <p className="mt-2">No PDFs attached yet.</p>
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
                  {isStaff ? (
                    <button
                      type="button"
                      className="rounded-md border border-red-200 p-2 text-red-800"
                      aria-label={`Remove ${m.label}`}
                      onClick={async () => {
                        if (!window.confirm(`Remove record for ${m.label}?`)) return
                        try {
                          await deleteProgramMaterial(m.id)
                          toast.success('Removed from catalogue')
                          void queryClient.invalidateQueries({
                            queryKey: ['admin', 'program-materials', programId],
                          })
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
