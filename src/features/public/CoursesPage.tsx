import { ProgramCard } from '@/components/institutional/ProgramCard'
import { useLeapPrograms } from '@/contexts/ContentContext'
import { BookOpen, GraduationCap, Infinity, Laptop } from 'lucide-react'

const features = [
  { icon: Laptop, label: 'Home Study Program (Self-Paced)' },
  { icon: BookOpen, label: 'Digital Correspondence Learning' },
  { icon: GraduationCap, label: 'Institutional Recognition and Credentials' },
  { icon: Infinity, label: 'Lifelong Learning and Professional Development' },
]

export function CoursesPage() {
  const programs = useLeapPrograms()

  return (
    <>
      <section className="border-b border-gold/30 bg-gradient-to-b from-cream to-ivory px-4 py-10 text-center sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
          <BookOpen className="hidden h-10 w-10 text-gold sm:block" aria-hidden />
          <div>
            <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              LEAP COURSES CATALOGUE
            </h1>
            <p className="font-serif-body mx-auto mt-3 max-w-2xl text-base italic text-ink/80">
              Explore our Lifelong Education Advancement Program (LEAP) courses in
              Metaphysical Science, Integrative Health, Vitalogy, Transcendentalism,
              and the Healing Arts.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] bg-cream/40 px-4 py-10 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} layout="catalog" />
          ))}
        </div>
      </section>

      <section className="border-y border-gold/25 bg-white py-6">
        <div className="mx-auto grid max-w-[1440px] gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg border border-gold/20 bg-ivory px-3 py-3 text-sm text-ink"
            >
              <Icon className="h-5 w-5 text-gold" aria-hidden />
              {label}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}