import { PdfBookViewer } from '@/components/reader/PdfBookViewer'
import { createMaterialSignedUrl } from '@/lib/supabase/learning-access'
import {
  fetchProgramMaterials,
  isPdfMaterial,
  isVideoMaterial,
  type ProgramMaterialRow,
} from '@/lib/supabase/program-materials'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, FileText, Film, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  programId: string
  slug: string
  title: string
  onClose: () => void
  onMaterialsChanged?: () => void
}

export function CourseMaterialsPreviewModal({
  open,
  programId,
  slug,
  title,
  onClose,
}: Props) {
  const [materials, setMaterials] = useState<ProgramMaterialRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)

  const current = materials[index] ?? null
  const isPdf = current?.file_path ? isPdfMaterial(current.file_path) : false
  const isVideo = current?.file_path ? isVideoMaterial(current.file_path) : false

  const loadMaterials = useCallback(async () => {
    if (!open || !programId) return
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await fetchProgramMaterials(programId, { throwOnError: true })
      setMaterials(rows.filter((m) => m.file_path))
      setIndex(0)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load materials'
      setLoadError(msg)
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [open, programId])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  useEffect(() => {
    if (!open || !current?.file_path) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    setUrlLoading(true)
    void createMaterialSignedUrl(current.file_path)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null)
          toast.error('Could not open file from storage')
        }
      })
      .finally(() => {
        if (!cancelled) setUrlLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, current?.file_path, current?.id])

  function go(delta: number) {
    if (materials.length === 0) return
    setIndex((i) => (i + delta + materials.length) % materials.length)
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/55 p-2 sm:p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-materials-preview-title"
        className="flex h-[min(96dvh,920px)] w-full max-w-[min(98vw,1280px)] flex-col overflow-hidden rounded-2xl border border-gold/35 bg-ivory shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gold/25 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 id="course-materials-preview-title" className="font-display text-lg text-forest">
              Materials preview — {title}
            </h2>
            <p className="mt-0.5 text-xs text-ink/60">{slug}</p>
          </div>
          <button type="button" className="rounded-md p-1 hover:bg-cream" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>

        {loading ? (
          <p className="px-5 py-12 text-sm text-ink/60">Loading materials…</p>
        ) : materials.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink/70">
            <p>No files in the database for this course.</p>
            {loadError ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                {loadError}
              </p>
            ) : null}
            <Link
              to={`/admin/courses/${slug}/materials`}
              className="mt-4 inline-block rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white no-underline"
              onClick={onClose}
            >
              Upload PDFs
            </Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 bg-cream/40 px-5 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-forest">
                {isVideo ? (
                  <Film className="h-4 w-4" aria-hidden />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden />
                )}
                <span className="truncate">{current?.label}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/55">
                  {index + 1} of {materials.length}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-gold/40 bg-white p-1.5 text-forest disabled:opacity-40"
                  disabled={materials.length <= 1}
                  aria-label="Previous file"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gold/40 bg-white p-1.5 text-forest disabled:opacity-40"
                  disabled={materials.length <= 1}
                  aria-label="Next file"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <MaterialStrip materials={materials} index={index} onSelect={setIndex} />

            <div className="flex min-h-0 flex-1 flex-col bg-cream/50 p-3">
              {urlLoading ? (
                <p className="py-20 text-center text-sm text-ink/60">Opening file…</p>
              ) : previewUrl && isPdf ? (
                <PdfBookViewer
                  key={previewUrl}
                  url={previewUrl}
                  title={current?.label ?? 'PDF preview'}
                  defaultMode="book"
                  className="min-h-0 flex-1"
                  maxHeight="100%"
                />
              ) : previewUrl && isVideo ? (
                <video
                  key={previewUrl}
                  controls
                  className="mx-auto max-h-[min(65vh,560px)] w-full rounded-lg border border-gold/35 bg-black"
                  src={previewUrl}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <p className="py-20 text-center text-sm text-ink/60">Preview unavailable for this file.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function MaterialStrip({
  materials,
  index,
  onSelect,
}: {
  materials: ProgramMaterialRow[]
  index: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-gold/15 px-5 py-3">
      {materials.map((m, i) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            'shrink-0 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors',
            i === index
              ? 'border-forest bg-forest/10 font-semibold text-forest'
              : 'border-gold/30 bg-white text-ink/75 hover:bg-cream',
          )}
        >
          {m.label.length > 28 ? `${m.label.slice(0, 26)}…` : m.label}
        </button>
      ))}
    </div>
  )
}