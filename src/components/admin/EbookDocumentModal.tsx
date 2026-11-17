import {
  createEbookDocument,
  ebookUiStatusFromDb,
  slugifyEbookTitle,
  type EbookUiStatus,
  updateEbookDocument,
} from '@/lib/supabase/ebook-admin'
import { useStaff } from '@/contexts/StaffContext'
import { supabaseConfigured } from '@/lib/supabase/client'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AdminFormFilePicker } from '@/components/admin/AdminFormFilePicker'
import { X } from 'lucide-react'
import { toast } from 'sonner'

export type EbookModalInitial = {
  legacySlug: string
  title: string
  description: string | null
  publicationStatus: string
  hasPdf: boolean
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: EbookModalInitial
  onClose: () => void
  onSaved: () => void
}

export function EbookDocumentModal({ open, mode, initial, onClose, onSaved }: Props) {
  const { isStaff, session } = useStaff()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uiStatus, setUiStatus] = useState<EbookUiStatus>('review')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setTitle(initial.title)
      setDescription(initial.description ?? '')
      setUiStatus(ebookUiStatusFromDb(initial.publicationStatus))
      setPdfFile(null)
      setCoverFile(null)
    } else {
      setTitle('')
      setDescription('')
      setUiStatus('review')
      setPdfFile(null)
      setCoverFile(null)
    }
  }, [open, mode, initial])

  if (!open) return null

  const slugPreview =
    mode === 'edit' && initial
      ? initial.legacySlug
      : slugifyEbookTitle(title || 'new-ebook')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured in .env.local')
      return
    }
    if (!session || !isStaff) {
      toast.error('Admin sign-in required to upload to Supabase')
      return
    }

    setBusy(true)
    try {
      if (mode === 'create') {
        if (!pdfFile) {
          toast.error('Choose a PDF file')
          setBusy(false)
          return
        }
        const saved = await createEbookDocument({
          title,
          description,
          uiStatus,
          pdfFile,
          coverFile,
        })
        toast.success(
          saved.updatedExisting ? 'Updated existing eBook in Supabase' : 'Saved to Supabase',
          {
            description: saved.updatedExisting
              ? `${saved.legacy_slug} already existed — PDF, cover, and metadata were refreshed.`
              : `${saved.legacy_slug} · ${saved.pdf_path}`,
          },
        )
      } else if (initial) {
        await updateEbookDocument(initial.legacySlug, {
          title,
          description,
          uiStatus,
          pdfFile,
          coverFile,
        })
        toast.success('Updated in Supabase', {
          description: `ebooks · ${initial.legacySlug}`,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ebook-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gold/40 bg-cream shadow-2xl">
        <div className="flex items-start justify-between border-b border-gold/25 px-5 py-4">
          <div>
            <h2 id="ebook-modal-title" className="font-display text-xl font-semibold text-forest">
              {mode === 'create' ? 'Upload new eBook' : 'Edit eBook'}
            </h2>
            <p className="mt-1 text-xs text-ink/65">
              Slug: <code className="text-[10px]">{slugPreview}</code>
              {mode === 'create' ? (
                <span className="mt-0.5 block text-[10px] text-ink/50">
                  If this slug already exists in the table, upload will update that row instead of
                  creating a duplicate.
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-ink/70 hover:bg-white"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
          {!supabaseConfigured ? (
            <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code>web/.env.local</code>. Without Supabase, nothing is stored in the cloud.
            </p>
          ) : !session || !isStaff ? (
            <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Sign in as admin before uploading. Files go to your Supabase project (Storage +{' '}
              <code>ebooks</code> table).
            </p>
          ) : (
            <p className="rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
              Saves to <strong>Supabase Storage</strong>: PDF in{' '}
              <code className="text-[10px]">private-documents/ebooks/…</code>, cover in{' '}
              <code className="text-[10px]">public-assets/ebooks/covers/…</code>. Row inserted or
              updated in <code className="text-[10px]">public.ebooks</code>.
            </p>
          )}

          <label className="block text-xs font-medium text-ink">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
              placeholder="Short blurb for the public catalog"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Status
            <select
              value={uiStatus}
              onChange={(e) => setUiStatus(e.target.value as EbookUiStatus)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
            >
              <option value="review">Review</option>
              <option value="live">Live</option>
              <option value="hold">Hold</option>
            </select>
          </label>

          <AdminFormFilePicker
            label={`PDF document ${mode === 'create' ? '(required)' : '(optional replace)'}`}
            accept="application/pdf,.pdf"
            chooseLabel="Choose PDF"
            value={pdfFile}
            onChange={setPdfFile}
            disabled={busy}
            hint={
              mode === 'edit' && initial?.hasPdf && !pdfFile
                ? 'Current PDF on file — choose a file only to replace it'
                : undefined
            }
          />

          <AdminFormFilePicker
            label="Cover image (optional)"
            accept="image/jpeg,image/png,image/webp"
            chooseLabel="Choose image"
            value={coverFile}
            onChange={setCoverFile}
            disabled={busy}
          />

          <div className="flex flex-wrap justify-end gap-2 border-t border-gold/20 pt-4">
            <button
              type="button"
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-medium text-ink"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : mode === 'create' ? 'Upload & save' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}