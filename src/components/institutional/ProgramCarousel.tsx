import { CarouselProgramCard } from '@/components/institutional/CarouselProgramCard'
import { LeapProgramsSectionHeader } from '@/components/institutional/LeapProgramsSectionHeader'
import type { LeapProgram } from '@/data/programs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type ProgramCarouselProps = {
  programs: LeapProgram[]
}

function useCarouselVisibleCount() {
  const [visible, setVisible] = useState(5)

  useEffect(() => {
    const pick = (width: number) => {
      if (width >= 1280) return 5
      if (width >= 1024) return 4
      if (width >= 640) return 2
      return 1
    }
    const update = () => setVisible(pick(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return visible
}

export function ProgramCarousel({ programs }: ProgramCarouselProps) {
  const featured = useMemo(
    () => programs.filter((p) => p.featuredInCarousel),
    [programs],
  )
  /** New admin courses default to not featured — show all published courses when none are flagged. */
  const carouselPrograms = featured.length > 0 ? featured : programs
  const visibleCount = useCarouselVisibleCount()
  const maxIndex = Math.max(0, carouselPrograms.length - visibleCount)
  const pageCount = maxIndex + 1

  const [index, setIndex] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [stepPx, setStepPx] = useState(0)

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const measureStep = useCallback(() => {
    const track = trackRef.current
    const card = track?.querySelector('[data-carousel-card]') as HTMLElement | null
    if (!card) return
    const gap = 14
    setStepPx(card.offsetWidth + gap)
  }, [])

  useLayoutEffect(() => {
    measureStep()
  }, [measureStep, carouselPrograms.length, visibleCount])

  useEffect(() => {
    window.addEventListener('resize', measureStep)
    return () => window.removeEventListener('resize', measureStep)
  }, [measureStep])

  const goPrev = () => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1))
  }

  const goNext = () => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1))
  }

  const translateX = stepPx > 0 ? index * stepPx : 0

  return (
    <section
      className="border-b border-gold/20 bg-gradient-to-b from-white to-cream/80 py-10"
      aria-labelledby="leap-programs-heading"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <LeapProgramsSectionHeader id="leap-programs-heading" />

        {carouselPrograms.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/70">
            LEAP courses will appear here when they are published.{' '}
            <Link to="/courses" className="font-medium text-forest underline">
              Browse the catalogue
            </Link>
          </p>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-5">
            <button
              type="button"
              className="btn-gloss-green flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold/80 text-white shadow-md transition-opacity hover:brightness-110 sm:h-12 sm:w-12"
              aria-label="Previous programs"
              onClick={goPrev}
              disabled={carouselPrograms.length <= visibleCount}
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>

            <div
              ref={viewportRef}
              className="min-h-[200px] w-full min-w-0 flex-1 overflow-hidden"
            >
              <div
                ref={trackRef}
                className="flex gap-3.5 transition-transform duration-300 ease-out will-change-transform"
                style={{ transform: `translateX(-${translateX}px)` }}
              >
                {carouselPrograms.map((program) => (
                  <div key={program.id} data-carousel-card className="shrink-0">
                    <CarouselProgramCard program={program} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-gloss-green flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold/80 text-white shadow-md transition-opacity hover:brightness-110 sm:h-12 sm:w-12"
              aria-label="Next programs"
              onClick={goNext}
              disabled={carouselPrograms.length <= visibleCount}
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {carouselPrograms.length > 0 ? (
        <div
          className="mt-6 flex justify-center gap-2.5"
          role="tablist"
          aria-label="Carousel pages"
        >
          {Array.from({ length: pageCount }).map((_, i) => {
            const active = index === i
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? 'h-2.5 w-2.5 rounded-full bg-forest shadow-sm ring-2 ring-forest/30'
                    : 'h-2.5 w-2.5 rounded-full bg-neutral-300 transition-colors hover:bg-neutral-400'
                }
                onClick={() => setIndex(i)}
                aria-label={`Show programs page ${i + 1} of ${pageCount}`}
              />
            )
          })}
        </div>
        ) : null}
      </div>
    </section>
  )
}