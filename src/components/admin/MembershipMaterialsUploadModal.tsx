import { useStaff } from '@/contexts/StaffContext'
import { uploadMembershipMaterials } from '@/lib/supabase/membership-materials'
import { Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

export function MembershipMaterialsUploadModal({ open, onClose, onUploaded }: Props) {
  const { isStaff } = useStaff()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (open) setFiles([])
  }, [open])

  if (!open) return null

  function addFilesList(list: FileList | null) {
    if (!list?.length) return
    setFiles((prev) => [...prev, ...Array.from(list)])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isStaff) {
      toast.error('Staff sign-in required')
      return
    }
    if (files.length === 0) {
      toast.error('Add at least one file')
      return
    }
    setBusy(true)
    try {
      const count = await uploadMembershipMaterials(files)
      if (count === 0) toast.error('No supported files')
      else {
        toast.success(`Uploaded ${count} file${count === 1 ? '' : 's'}`)
        onUploaded()
        onClose()
      }
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
        className="w-full max-w-lg rounded-2xl border border-gold/35 bg-ivory p-6 shadow-xl"
      >
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest">Upload member files</h2>
            <p className="mt-1 text-xs text-ink/70">
              PDF or video for approved TMVS members on Downloads.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} disabled={busy}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
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
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center ${
              dragOver ? 'border-forest bg-forest/5' : 'border-gold/40 bg-white'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              addFilesList(e.dataTransfer.files)
            }}
          >
            <Upload className="mx-auto h-8 w-8 text-gold" aria-hidden />
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-forest underline"
              onClick={() => inputRef.current?.click()}
            >
              Browse multiple files
            </button>
          </div>
          {files.length > 0 ? (
            <ul className="max-h-32 overflow-y-auto text-xs">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>{f.name}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-full border px-4 py-2 text-xs" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || files.length === 0}
              className="btn-gloss-green rounded-full px-5 py-2 text-xs text-white"
            >
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}