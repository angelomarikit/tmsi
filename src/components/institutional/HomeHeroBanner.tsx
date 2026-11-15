import { useHomeSectionBody } from '@/contexts/ContentContext'
import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { BookOpen, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Full-width hero matching reference: panoramic art with centered headline and CTAs.
 */
const defaultTitle = 'Illuminating Minds.\nAdvancing Lifelong Learning.'
const defaultSubtitle =
  'TMSI–Luminarian Academy of Philosophical Studies offers independent, transformative, and holistic education through lifelong learning in metaphysical science, philosophy, vitalogy, and integrative well-being.'

export function HomeHeroBanner() {
  const heroTitle = useHomeSectionBody('hero_title')?.text ?? defaultTitle
  const heroSubtitle = useHomeSectionBody('hero_subtitle')?.text ?? defaultSubtitle
  const titleLines = heroTitle.split(/\.\s+/).filter(Boolean)

  return (
    <section className="relative min-h-[320px] overflow-hidden border-b border-gold/30 sm:min-h-[380px] lg:min-h-[420px]">
      <VisualAssetImage
        assetKey="homepage.hero.banner"
        className="absolute inset-0"
        imgClassName="object-cover object-center"
        fallback={
          <div className="h-full w-full bg-gradient-to-r from-forest/20 via-cream to-gold/20" />
        }
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/15"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[320px] max-w-[1440px] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[380px] sm:px-8 sm:py-14 lg:min-h-[420px] lg:py-16">
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink drop-shadow-[0_1px_2px_rgba(250,248,241,0.9)] sm:text-4xl lg:text-[2.35rem]">
          {titleLines.map((line, i) => (
            <span key={line}>
              {line.endsWith('.') ? line : `${line}.`}
              {i < titleLines.length - 1 ? (
                <>
                  <br className="hidden sm:block" />
                  <span className="sm:inline"> </span>
                </>
              ) : null}
            </span>
          ))}
        </h1>
        <p className="font-serif-body mx-auto mt-4 max-w-xl text-base italic leading-relaxed text-ink/90 drop-shadow-[0_1px_1px_rgba(250,248,241,0.85)] sm:text-lg">
          {heroSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <Link
            to="/enroll"
            className="btn-gloss-green inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-lg sm:min-h-[56px] sm:px-10 sm:py-4 sm:text-lg"
          >
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            Enroll Now
          </Link>
          <Link
            to="/ebooks"
            className="btn-gloss-gold inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-semibold text-ink shadow-md sm:min-h-[56px] sm:px-10 sm:py-4 sm:text-lg"
          >
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            Free eBooks
          </Link>
        </div>
      </div>
    </section>
  )
}