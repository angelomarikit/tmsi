import { getVisualAsset, type VisualAssetKey } from '@/data/visual-assets'
import { useStaff } from '@/contexts/StaffContext'
import { updateCourseMeta, uploadCourseCover } from '@/lib/supabase/course-admin'
import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

export type CourseEditInitial = {
  id: string
  slug: string
  code: string
  title: string
  subtitle: string
  feePhp: number
  publicationStatus: string
  coverAssetKey: string | null
}

const STATUS_OPTIONS = [
  'draft',
  'under_review',
  'published',
  'archived',
] as const

type Props = {
  open: boolean
  initial: CourseEditInitial | null
  onClose: () => void
  onSaved: () => void
}

export function CourseEditModal({ open, initial, onClose, onSaved }: Props) {
  const { isStaff } = useStaff()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [feePhp, setFeePhp] = useState(0)
  const [publicationStatus, setPublicationStatus] = useState('under_review')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !initial) return
    setTitle(initial.title)
    setSubtitle(initial.subtitle)
    setFeePhp(initial.feePhp)
    setPublicationStatus(initial.publicationStatus)
    setCoverFile(null)
  }, [open, initial])

  if (!open || !initial) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isStaff) {
      toast.error('Admin sign-in required')
      return
    }
    setBusy(true)
    try {
      await updateCourseMeta(initial!.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        feePhp,
        publicationStatus,
      })
      if (coverFile && initial!.coverAssetKey) {
        const asset = getVisualAsset(initial!.coverAssetKey as VisualAssetKey)
        await uploadCourseCover(initial!.slug, initial!.coverAssetKey as VisualAssetKey, asset.cmsLabel, coverFile)
      }
      toast.success('Course updated')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-gold/35 bg-ivory p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-forest">Edit course</h2>
          <button type="button" className="rounded-md p-1" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/65">{initial.code}</p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs font-medium">
            Title
            <input
              required
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium">
            Subtitle
            <input
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium">
            Fee (PHP)
            <input
              type="number"
              min={0}
              step={0.01}
              required
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={feePhp}
              onChange={(e) => setFeePhp(Number(e.target.value))}
            />
          </label>
          <label className="block text-xs font-medium">
            Publication status
            <select
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={publicationStatus}
              onChange={(e) => setPublicationStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          {initial.coverAssetKey ? (
            <label className="block text-xs font-medium">
              Cover image (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block w-full text-sm"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}