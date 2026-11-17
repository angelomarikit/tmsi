import { AdminFormFilePicker } from '@/components/admin/AdminFormFilePicker'
import { useStaff } from '@/contexts/StaffContext'
import { createNewCourse, slugifyCourseTitle } from '@/lib/supabase/course-admin'
import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

export function CourseMaterialsUploadModal({ open, onClose, onUploaded }: Props) {
  const navigate = useNavigate()
  const { isStaff } = useStaff()
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [feePhp, setFeePhp] = useState(0)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setTitle('')
    setSubtitle('')
    setSlug('')
    setSlugTouched(false)
    setFeePhp(0)
    setCoverFile(null)
  }, [open])

  useEffect(() => {
    if (!open || slugTouched) return
    if (title.trim()) setSlug(slugifyCourseTitle(title))
  }, [open, title, slugTouched])

  if (!open) return null

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
      onUploaded()
      onClose()
      toast.success('Course created — upload PDFs one at a time on the next screen')
      navigate(`/admin/courses/${created.slug}/materials`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create course')
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
            <h2 className="font-display text-xl font-semibold text-forest">Create course</h2>
            <p className="mt-1 text-xs text-ink/70">
              Step 1 of 2: course details only. PDFs are uploaded on the Manage screen — one file at a time.
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

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-forest">
              Course code
              <input
                required
                className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DMS"
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

          <AdminFormFilePicker
            label="Cover image (optional, public)"
            accept="image/jpeg,image/png,image/webp"
            chooseLabel="Choose image"
            value={coverFile}
            onChange={setCoverFile}
            disabled={busy}
            hint="Shown on the public catalog and student My Courses."
          />

          <div className="rounded-lg border border-forest/20 bg-forest/5 px-3 py-3 text-xs text-forest">
            <strong>No PDFs here.</strong> Legacy single-file paths and bulk upload were removed. After you create
            this course you will land on <strong>Manage</strong> to attach each module PDF separately.
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
              {busy ? 'Saving…' : 'Create & upload PDFs'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
