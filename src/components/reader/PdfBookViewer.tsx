import { cn } from '@/lib/utils'
import * as pdfjsLib from 'pdfjs-dist'
import { BookOpen, ChevronLeft, ChevronRight, LayoutPanelLeft, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export type PdfViewMode = 'book' | 'classic'

type Props = {
  url: string
  title?: string
  className?: string
  defaultMode?: PdfViewMode
  showModeToggle?: boolean
  /** CSS height for the reading stage — use `100%` when parent is flex-sized */
  maxHeight?: string
}

export function PdfBookViewer({
  url,
  title,
  className,
  defaultMode = 'book',
  showModeToggle = true,
  maxHeight = 'min(82dvh, 880px)',
}: Props) {
  const [mode, setMode] = useState<PdfViewMode>(defaultMode)
  const [spread, setSpread] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [spreadStart, setSpreadStart] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [stageSize, setStageSize] = useState({ w: 900, h: 700 })

  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLCanvasElement>(null)
  const rightRef = useRef<HTMLCanvasElement>(null)
  const activeRenders = useRef<Map<HTMLCanvasElement, pdfjsLib.RenderTask>>(new Map())
  const renderGenRef = useRef(0)

  const cancelCanvasRender = useCallback((canvas: HTMLCanvasElement | null | undefined) => {
    if (!canvas) return
    const task = activeRenders.current.get(canvas)
    if (task) {
      try {
        void task.cancel()
      } catch {
        /* already finished */
      }
      activeRenders.current.delete(canvas)
    }
  }, [])

  useEffect(() => {
    setMode(defaultMode)
    setZoom(1)
    setSpread(false)
    setSpreadStart(1)
  }, [defaultMode, url])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let debounceId: ReturnType<typeof setTimeout> | undefined
    const measure = () => {
      clearTimeout(debounceId)
      debounceId = setTimeout(() => {
        setStageSize({ w: el.clientWidth, h: el.clientHeight })
      }, 100)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode, loadingDoc])

  useEffect(() => {
    let cancelled = false
    pdfRef.current = null
    setLoadingDoc(true)
    setLoadError(null)
    setNumPages(0)
    setSpreadStart(1)

    void (async () => {
      try {
        const task = pdfjsLib.getDocument({ url, withCredentials: false })
        const pdf = await task.promise
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load PDF')
        }
      } finally {
        if (!cancelled) setLoadingDoc(false)
      }
    })()

    return () => {
      cancelled = true
      pdfRef.current = null
    }
  }, [url])

  const renderPageFit = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement, maxWidth: number, maxHeightPx: number) => {
      cancelCanvasRender(canvas)
      const pdf = pdfRef.current
      if (!pdf) return
      const page = await pdf.getPage(pageNumber)
      const baseViewport = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const fitScale = Math.min(maxWidth / baseViewport.width, maxHeightPx / baseViewport.height)
      const scale = fitScale * zoom * dpr
      const viewport = page.getViewport({ scale })
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
      const task = page.render({ canvasContext: ctx, viewport, canvas })
      activeRenders.current.set(canvas, task)
      try {
        await task.promise
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (/cancel/i.test(msg) || (err instanceof Error && err.name === 'RenderingCancelledException')) {
          return
        }
        throw err
      } finally {
        if (activeRenders.current.get(canvas) === task) {
          activeRenders.current.delete(canvas)
        }
      }
    },
    [zoom, cancelCanvasRender],
  )

  const spreadBreakpoint = 1024
  const showingSpread = spread && spreadStart + 1 <= numPages && stageSize.w >= spreadBreakpoint

  useEffect(() => {
    if (mode !== 'book' || loadingDoc || !pdfRef.current) return
    const leftCanvas = leftRef.current
    const rightCanvas = rightRef.current
    if (!leftCanvas) return

    const gen = ++renderGenRef.current
    let cancelled = false
    setRendering(true)
    setLoadError(null)

    void (async () => {
      try {
        const pad = 8
        const availW = Math.max(320, stageSize.w - pad * 2)
        const availH = Math.max(400, stageSize.h - pad * 2)
        const gap = showingSpread ? 16 : 0
        const pageW = showingSpread ? (availW - gap) / 2 : availW
        const pageH = availH

        await renderPageFit(spreadStart, leftCanvas, pageW, pageH)
        if (cancelled || gen !== renderGenRef.current) return

        if (showingSpread && rightCanvas) {
          await renderPageFit(spreadStart + 1, rightCanvas, pageW, pageH)
          rightCanvas.style.display = 'block'
        } else if (rightCanvas) {
          rightCanvas.style.display = 'none'
        }
      } catch (err) {
        if (cancelled || gen !== renderGenRef.current) return
        const msg = err instanceof Error ? err.message : 'Could not render page'
        if (!/cancel/i.test(msg)) setLoadError(msg)
      } finally {
        if (!cancelled && gen === renderGenRef.current) setRendering(false)
      }
    })()

    return () => {
      cancelled = true
      cancelCanvasRender(leftCanvas)
      cancelCanvasRender(rightCanvas)
    }
  }, [
    mode,
    spread,
    spreadStart,
    numPages,
    loadingDoc,
    renderPageFit,
    url,
    stageSize,
    showingSpread,
    zoom,
    cancelCanvasRender,
  ])

  const step = showingSpread ? 2 : 1
  const canPrev = spreadStart > 1
  const canNext = spreadStart + step <= numPages

  const turnPage = useCallback(
    (delta: number) => {
      setSpreadStart((p) => {
        const next = p + delta * step
        return Math.min(Math.max(1, next), Math.max(1, numPages))
      })
    },
    [step, numPages],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (mode !== 'book') return
      if (e.key === 'ArrowLeft') turnPage(-1)
      if (e.key === 'ArrowRight') turnPage(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, turnPage])

  const pageLabel = showingSpread
    ? `Pages ${spreadStart}–${spreadStart + 1} of ${numPages}`
    : `Page ${spreadStart} of ${numPages}`

  if (mode === 'classic') {
    return (
      <div className={cn('flex min-h-0 flex-col gap-2', className)}>
        {showModeToggle ? (
          <ModeToolbar
            mode={mode}
            spread={spread}
            zoom={zoom}
            onMode={setMode}
            onSpread={setSpread}
            onZoom={setZoom}
            pageLabel={numPages ? pageLabel : ''}
          />
        ) : null}
        <iframe
          title={title ?? 'PDF'}
          src={url}
          className="min-h-0 w-full flex-1 rounded-lg border border-gold/35 bg-white"
          style={{ height: maxHeight, minHeight: maxHeight }}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col gap-2', className)} style={{ height: maxHeight, maxHeight }}>
      {showModeToggle ? (
        <ModeToolbar
          mode={mode}
          spread={spread}
          zoom={zoom}
          onMode={setMode}
          onSpread={setSpread}
          onZoom={setZoom}
          pageLabel={numPages ? pageLabel : ''}
        />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-b from-forest/90 to-ink shadow-inner">
        {loadingDoc ? (
          <p className="flex flex-1 items-center justify-center gap-2 text-sm text-cream/90">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Opening book…
          </p>
        ) : loadError ? (
          <p className="px-4 py-12 text-center text-sm text-red-200">{loadError}</p>
        ) : (
          <>
            <div
              ref={stageRef}
              className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2 md:p-3"
            >
              <div
                className={cn(
                  'flex w-full max-w-full items-center justify-center gap-3',
                  showingSpread ? 'flex-row' : 'flex-col',
                )}
              >
                <div className="book-page-shadow max-w-full shrink-0 rounded-sm bg-[#f8f4ea] p-0.5 shadow-2xl">
                  <canvas ref={leftRef} className="block max-w-full" />
                </div>
                {showingSpread ? (
                  <div className="book-page-shadow max-w-full shrink-0 rounded-sm bg-[#f8f4ea] p-0.5 shadow-2xl">
                    <canvas ref={rightRef} className="block max-w-full" />
                  </div>
                ) : (
                  <canvas ref={rightRef} className="hidden" aria-hidden />
                )}
              </div>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/25 px-3 py-3 sm:px-4">
              <p className="flex items-center gap-2 text-xs text-cream/85">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {pageLabel}
                {rendering ? <Loader2 className="h-3 w-3 animate-spin text-gold" aria-hidden /> : null}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canPrev}
                  className="min-h-[44px] rounded-full border border-cream/30 bg-cream/10 px-4 py-2 text-xs font-semibold text-cream disabled:opacity-35"
                  onClick={() => turnPage(-1)}
                >
                  <span className="inline-flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  className="min-h-[44px] rounded-full border border-gold/50 bg-gold/20 px-4 py-2 text-xs font-semibold text-cream disabled:opacity-35"
                  onClick={() => turnPage(1)}
                >
                  <span className="inline-flex items-center gap-1">
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

function ModeToolbar({
  mode,
  spread,
  zoom,
  onMode,
  onSpread,
  onZoom,
  pageLabel,
}: {
  mode: PdfViewMode
  spread: boolean
  zoom: number
  onMode: (m: PdfViewMode) => void
  onSpread: (v: boolean) => void
  onZoom: (z: number) => void
  pageLabel: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:gap-3">
      <div className="flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-ink/55">View:</span>
        <button
          type="button"
          className={cn(
            'rounded-full border px-3 py-1 font-semibold',
            mode === 'book'
              ? 'border-forest bg-forest/10 text-forest'
              : 'border-gold/35 text-ink/70',
          )}
          onClick={() => onMode('book')}
        >
          Book
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-3 py-1 font-semibold',
            mode === 'classic'
              ? 'border-forest bg-forest/10 text-forest'
              : 'border-gold/35 text-ink/70',
          )}
          onClick={() => onMode('classic')}
        >
          <LayoutPanelLeft className="h-3 w-3" aria-hidden />
          Browser
        </button>
        {mode === 'book' ? (
          <>
            <button
              type="button"
              className={cn(
                'hidden rounded-full border px-3 py-1 font-semibold lg:inline-flex',
                spread
                  ? 'border-gold/50 bg-gold/15 text-forest'
                  : 'border-gold/35 text-ink/70',
              )}
              onClick={() => onSpread(!spread)}
            >
              {spread ? 'Two-page spread' : 'Single page'}
            </button>
            <span className="text-ink/40">|</span>
            <button
              type="button"
              className="rounded-full border border-gold/35 p-1 text-forest"
              aria-label="Zoom out"
              onClick={() => onZoom(Math.max(0.75, zoom - 0.15))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[3rem] text-center font-mono text-[11px] text-ink/60">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="rounded-full border border-gold/35 p-1 text-forest"
              aria-label="Zoom in"
              onClick={() => onZoom(Math.min(2, zoom + 0.15))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>
      {pageLabel ? <span className="text-ink/50">{pageLabel}</span> : null}
    </div>
  )
}