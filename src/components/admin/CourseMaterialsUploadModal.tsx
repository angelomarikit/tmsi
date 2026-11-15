import { useStaff } from '@/contexts/StaffContext'
import { createNewCourse, slugifyCourseTitle } from '@/lib/supabase/course-admin'
import { uploadProgramMaterials } from '@/lib/supabase/program-materials'
import { Info, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

export function CourseMaterialsUploadModal({ open, onClose, onUploaded }: Props) {
  const { isStaff } = useStaff()
  const inputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [feePhp, setFeePhp] = useState(0)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setTitle('')
    setSubtitle('')
    setSlug('')
    setSlugTouched(false)
    setFeePhp(0)
    setCoverFile(null)
    setFiles([])
  }, [open])

  useEffect(() => {
    if (!open || slugTouched) return
    if (title.trim()) setSlug(slugifyCourseTitle(title))
  }, [open, title, slugTouched])

  if (!open) return null

  function addFilesList(list: FileList | null) {
    if (!list?.length) return
    setFiles((prev) => [...prev, ...Array.from(list)])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFilesList(e.dataTransfer.files)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isStaff) {
      toast.error('Admin sign-in required')
      return
    }
    if (!code.trim() || !title.trim() || !slug.trim()) {
      toast.error('Code, title, and URL slug are required')
      return
    }
    if (feePhp < 0) {
      toast.error('Fee must be zero or greater')
      return
    }

    setBusy(true)
    try {
      const created = await createNewCourse({
        code,
        title,
        subtitle: subtitle.trim() || '—',
        slug,
        feePhp,
        coverFile,
      })

      if (files.length > 0) {
        const count = await uploadProgramMaterials(created.id, created.slug, files)
        if (count === 0) {
          toast.message('Course created; no supported material files were uploaded')
        } else {
          toast.success(`New course created with ${count} material file${count === 1 ? '' : 's'}`)
        }
      } else {
        toast.success('New course created — add materials anytime via Manage')
      }

      onUploaded()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gold/35 bg-ivory p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest">Upload new course</h2>
            <p className="mt-1 text-xs text-ink/70">
              Create a new LEAP course and optionally attach learning files in one step.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-ink/60 hover:bg-cream"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-3 text-xs text-emerald-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong>This is a new course.</strong> You do not need to attach materials to previous or
            legacy catalog courses anymore. Use <strong>Manage</strong> on an existing row only
            when updating that specific course.
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-forest">
              Course code
              <input
                required
                className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DMS-NEW"
              />
            </label>
            <label className="block text-xs font-medium text-forest">
              Fee (PHP)
              <input
                type="number"
                min={0}
                step={0.01}
                required
                className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
                value={feePhp}
                onChange={(e) => setFeePhp(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-forest">
            Course title
            <input
              required
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block text-xs font-medium text-forest">
            Subtitle / short description
            <input
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </label>

          <label className="block text-xs font-medium text-forest">
            URL slug
            <input
              required
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="doctor-of-metaphysical-science"
            />
          </label>

          <label className="block text-xs font-medium text-forest">
            Cover image (optional, public)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div>
            <p className="text-xs font-medium text-forest">
              Learning materials (optional — bulk PDF or video)
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => {
                addFilesList(e.target.files)
                e.target.value = ''
              }}
            />
            <div
              className={`mt-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                dragOver ? 'border-forest bg-forest/5' : 'border-gold/40 bg-white'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <Upload className="mx-auto h-7 w-7 text-gold" aria-hidden />
              <p className="mt-2 text-xs text-ink/80">Drag files here or</p>
              <button
                type="button"
                className="mt-1 text-xs font-semibold text-forest underline"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                browse multiple files
              </button>
            </div>
            {files.length > 0 ? (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gold/25 bg-white p-2 text-xs">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex justify-between gap-2 text-ink/80">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      className="shrink-0 text-red-800"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-forest"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white disabled:opacity-45"
            >
              {busy ? 'Saving…' : 'Create course'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}