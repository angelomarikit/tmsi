import { HomeHeroBanner } from '@/components/institutional/HomeHeroBanner'
import { ProgramCarousel } from '@/components/institutional/ProgramCarousel'
import { ProgramFooterStrip } from '@/components/institutional/ProgramFooterStrip'
import { useHomeSectionBody, useLeapPrograms } from '@/contexts/ContentContext'
import { Landmark, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const programs = useLeapPrograms()
  const aboutTeaser = useHomeSectionBody('about_teaser')
  const leapTeaser = useHomeSectionBody('leap_teaser')

  return (
    <>
      <HomeHeroBanner />

      <section className="border-b border-gold/20 bg-white py-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 sm:grid-cols-2 sm:px-6">
          <div className="flex gap-4 rounded-xl border border-gold/25 bg-ivory p-5 shadow-sm">
            <Landmark className="h-10 w-10 shrink-0 text-gold" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-semibold text-forest">
                {aboutTeaser?.title ?? 'About TMSI–LAPS'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">
                {aboutTeaser?.text ??
                  'TMSI–Luminarian Academy of Philosophical Studies is an independent institution devoted to lifelong learning, metaphysical inquiry, philosophical development and transcendental education.'}
              </p>
              <Link to="/about" className="mt-2 inline-block text-sm font-medium text-forest underline">
                Learn more
              </Link>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border border-gold/25 bg-ivory p-5 shadow-sm">
            <Sprout className="h-10 w-10 shrink-0 text-forest" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-semibold text-forest">
                {leapTeaser?.title ?? 'LEAP'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">
                {leapTeaser?.text ??
                  "Lifelong Education Advancement Program (LEAP) is the Academy's self-paced digital-correspondence pathway for adult learners and practitioners."}
              </p>
              <Link to="/courses" className="mt-2 inline-block text-sm font-medium text-forest underline">
                View courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProgramCarousel programs={programs} />

      <ProgramFooterStrip />
    </>
  )
}