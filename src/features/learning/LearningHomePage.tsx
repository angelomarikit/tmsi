import { useStaff } from '@/contexts/StaffContext'
import { fetchMyEnrolledPrograms } from '@/lib/supabase/learning-access'
import { GraduationCap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function LearningHomePage() {
  const { session, loading } = useStaff()

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['learning', 'programs'],
    queryFn: fetchMyEnrolledPrograms,
    enabled: Boolean(session),
  })

  if (loading) {
    return <p className="px-4 py-16 text-center text-sm text-ink/70">Loading…</p>
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-forest">My Learning</h1>
        <p className="mt-3 text-sm text-ink/75">
          Sign in to access course PDFs after your enrollment and payment are approved.
        </p>
        <Link to="/login?next=/learning" className="btn-gloss-green mt-6 inline-block rounded-full px-6 py-2 text-sm font-semibold text-white no-underline">
          Sign in
        </Link>
      </div>
    )
  }

  return (
  <>
      <section className="border-b border-gold/30 bg-gradient-to-b from-cream to-white px-4 py-10 text-center sm:px-6">
        <GraduationCap className="mx-auto h-10 w-10 text-gold" aria-hidden />
        <h1 className="font-display text-3xl font-semibold text-forest">My Learning</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink/75">
          Read and download PDF modules for approved LEAP enrollments.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {isLoading ? (
          <p className="text-sm text-ink/60">Loading courses…</p>
        ) : programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gold/40 bg-white px-6 py-10 text-center text-sm text-ink/70">
            No approved enrollments yet. Complete enrollment and wait for payment verification.
            <Link to="/enroll" className="mt-4 block text-forest underline">
              Enroll in a LEAP course
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {programs.map((p) => (
              <li key={p.program_id}>
                <Link
                  to={`/learning/${p.slug}`}
                  className="block rounded-xl border border-gold/35 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-medium text-gold">{p.reference_code ?? 'LEAP'}</p>
                  <h2 className="font-display text-xl font-semibold text-forest">{p.title}</h2>
                  {p.subtitle ? (
                    <p className="mt-1 text-sm text-ink/75">{p.subtitle}</p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold text-forest">Open course materials →</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}