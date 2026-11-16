import { useStaff } from '@/contexts/StaffContext'
import { updateCourseMeta } from '@/lib/supabase/course-admin'
import {
  courseMaterialRejectionReason,
  fetchProgramMaterialsAdmin,
  fetchProgramMaterialsBySlug,
  isAllowedCourseMaterial,
  normalizeCourseMaterialFile,
  type ProgramMaterialRow,
  uploadProgramMaterials,
} from '@/lib/supabase/program-materials'
import { FileText, FileUp, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react'
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
  const [storedMaterials, setStoredMaterials] = useState<ProgramMaterialRow[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [uploadingNames, setUploadingNames] = useState<string[]>([])
  const materialInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const reloadMaterials = useCallback(async () => {
    if (!initial) return
    setMaterialsLoading(true)
    setMaterialsError(null)
    try {
      let rows = await fetchProgramMaterialsAdmin(initial.id, initial.slug)
      if (rows.length === 0) {
        rows = await fetchProgramMaterialsBySlug(initial.slug)
      }
      setStoredMaterials(rows.filter((r) => r.file_path))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load materials'
      setMaterialsError(msg)
      try {
        const fallback = await fetchProgramMaterialsBySlug(initial.slug)
        if (fallback.length > 0) {
          setStoredMaterials(fallback.filter((r) => r.file_path))
          setMaterialsError(null)
        } else {
          setStoredMaterials([])
        }
      } catch {
        setStoredMaterials([])
      }
    } finally {
      setMaterialsLoading(false)
    }
  }, [initial])

  useEffect(() => {
    if (!open || !initial) return
    setTitle(initial.title)
    setSubtitle(initial.subtitle)
    setFeePhp(initial.feePhp)
    setPublicationStatus(initial.publicationStatus)
    setUploadingNames([])
    void reloadMaterials()
  }, [open, initial, reloadMaterials])

  if (!open || !initial) return null

  async function onFilesPicked(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    e.target.value = ''
    if (!list?.length) return

    const accepted: File[] = []
    const rejected: string[] = []
    for (const raw of Array.from(list)) {
      const normalized = await normalizeCourseMaterialFile(raw)
      const file = normalized ?? raw
      if (isAllowedCourseMaterial(file)) {
        accepted.push(file)
        if (normalized && raw.name !== file.name) {
          toast.message(`Renamed “${raw.name}” → ${file.name} for storage`)
        }
      } else {
        rejected.push(courseMaterialRejectionReason(raw) ?? raw.name)
      }
    }

    if (rejected.length > 0) {
      toast.error(rejected.join('\n'))
    }
    if (accepted.length === 0) return

    setUploadingNames(accepted.map((f) => f.name))
    setBusy(true)
    try {
      const { count, rows: uploadedRows } = await uploadProgramMaterials(initial!.id, initial!.slug, accepted)
      setStoredMaterials((prev) => {
        const ids = new Set(prev.map((r) => r.id))
        return [...prev, ...uploadedRows.filter((r) => !ids.has(r.id))]
      })
      toast.success(
        `${count} file${count === 1 ? '' : 's'} stored — listed below for students after enrollment approval`,
      )
      onSaved()
      await reloadMaterials()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingNames([])
      setBusy(false)
    }
  }

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
      onSaved()
      toast.success('Course updated')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/35 bg-ivory p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-forest">Edit course</h2>
          <button type="button" className="rounded-md p-1" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/65">
          {initial.code} · <span className="font-mono text-[10px] text-ink/50">{initial.id}</span>
        </p>

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

          <MaterialsUploadField
            busy={busy}
            inputRef={materialInputRef}
            materialsError={materialsError}
            materialsLoading={materialsLoading}
            onFiles={onFilesPicked}
            slug={initial.slug}
            stored={storedMaterials}
            uploadingNames={uploadingNames}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold"
              onClick={onClose}
              disabled={busy}
            >
              Done
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white"
            >
              {busy ? 'Saving…' : 'Save course details'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

const MATERIAL_ACCEPT =
  '.pdf,application/pdf,application/x-pdf,application/vnd.adobe.pdf,video/*,.mp4,.webm,.mov,*/*'

function MaterialsUploadField({
  busy,
  inputRef,
  materialsError,
  materialsLoading,
  onFiles,
  slug,
  stored,
  uploadingNames,
}: {
  busy: boolean
  inputRef: RefObject<HTMLInputElement | null>
  materialsError: string | null
  materialsLoading: boolean
  onFiles: (e: ChangeEvent<HTMLInputElement>) => void
  slug: string
  stored: ProgramMaterialRow[]
  uploadingNames: string[]
}) {
  const uploading = uploadingNames.length > 0

  return (
    <div className="block text-xs font-medium text-ink">
      <span>Course PDF / video</span>
      <p className="mt-1 text-[10px] font-normal text-ink/55">
        Pick a file and it uploads immediately into <strong>Stored for students</strong> (Continue Learning
        after enrollment is approved).
      </p>

      <StoredMaterialsList
        error={materialsError}
        loading={materialsLoading && !uploading}
        stored={stored}
        uploadingNames={uploadingNames}
      />

      <fieldset className="mt-3 flex flex-wrap items-center gap-2 border-0 p-0">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={MATERIAL_ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={onFiles}
          tabIndex={-1}
        />
        <button
          type="button"
          disabled={busy}
          className="btn-gloss-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          {uploading ? 'Uploading…' : 'Choose PDF / video'}
        </button>
        {uploading ? (
          <span className="flex items-center gap-1 text-[11px] text-forest">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Saving {uploadingNames[0]}
            {uploadingNames.length > 1 ? ` +${uploadingNames.length - 1} more` : ''}
          </span>
        ) : null}
      </fieldset>

      <p className="mt-2 text-[10px] font-normal text-ink/55">
        Path: <code className="text-[9px]">private-documents/course-materials/{slug}/</code>
      </p>
    </div>
  )
}

function StoredMaterialsList({
  error,
  loading,
  stored,
  uploadingNames,
}: {
  error: string | null
  loading: boolean
  stored: ProgramMaterialRow[]
  uploadingNames: string[]
}) {
  return (
    <div className="mt-2 rounded-lg border border-gold/30 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold text-forest">Stored for students</p>
      {loading ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink/60">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : null}
      {error ? <p className="mt-2 text-[11px] text-red-800">{error}</p> : null}
      {uploadingNames.map((name) => (
        <p
          key={`up-${name}`}
          className="mt-2 flex items-center gap-1 text-[11px] text-forest"
        >
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Uploading {name}…
        </p>
      ))}
      {!loading && stored.length === 0 && uploadingNames.length === 0 && !error ? (
        <p className="mt-2 text-[11px] text-ink/55">No files yet — choose a PDF above.</p>
      ) : null}
      {stored.length > 0 ? (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {stored.map((m) => (
            <li
              key={m.id}
              className="flex items-start gap-2 rounded-md border border-forest/15 bg-cream/50 px-2 py-1.5 text-[11px] font-normal text-ink/85"
            >
              <FileText className="mt-0.5 h-3 w-3 shrink-0 text-forest" aria-hidden />
              <span className="min-w-0 flex-1 truncate" title={m.label}>
                {m.label}
              </span>
              <span className="shrink-0 text-[10px] text-ink/45">{m.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}