import { CourseCoverPlaceholder } from '@/components/institutional/CourseCoverPlaceholder'
import { ProgramCoverFrame } from '@/components/institutional/ProgramCoverFrame'
import { useLeapPrograms, useMediaOverrides } from '@/contexts/ContentContext'
import { useStaff } from '@/contexts/StaffContext'
import { resolvePublicImageUrl, visualAssets } from '@/data/visual-assets'
import { formatPhp } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function CourseDetailPage() {
  const { slug } = useParams()
  const { session } = useStaff()
  const programs = useLeapPrograms()
  const mediaOverrides = useMediaOverrides()
  const program = slug ? programs.find((p) => p.slug === slug) : undefined

  if (!program) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-forest">Course not found</h1>
        <Link to="/courses" className="mt-4 inline-block text-sm text-forest underline">
          Back to catalogue
        </Link>
      </div>
    )
  }

  const coverSrc =
    program.coverPublicUrl?.trim() ||
    resolvePublicImageUrl(program.coverAssetKey, mediaOverrides)
  const coverAlt =
    visualAssets[program.coverAssetKey]?.alt ?? `${program.title} — course cover`

  return (
    <>
      <div className="w-full border-b border-gold/30 bg-forest/5">
        <ProgramCoverFrame
          src={coverSrc}
          alt={coverAlt}
          zoom={Boolean(coverSrc)}
          zoomScale={1.18}
          className="h-[min(52vh,480px)] min-h-[240px] w-full sm:min-h-[320px]"
          roundedTop={false}
          fallback={
            <CourseCoverPlaceholder
              assetKey={program.coverAssetKey}
              className="h-full min-h-[inherit] w-full !aspect-auto"
            />
          }
        />
      </div>
      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-gold/35 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-sm font-semibold text-gold">{program.code}</p>
          <h1 className="font-display text-3xl font-semibold text-forest">{program.subtitle}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/85">{program.description}</p>
          <p className="mt-6 text-lg font-semibold text-ink">
            Program fee: {formatPhp(program.feePhp)}
          </p>
          <p className="mt-2 text-xs text-ink/65">
            Course modules are published by TMSI–LAPS after your enrollment is approved. Files are not
            listed on this public page.
          </p>
          <div className="mt-6 flex flex-col items-start gap-2">
            <Link
              to={
                session
                  ? `/dashboard?purchase=${encodeURIComponent(program.slug)}`
                  : `/login?next=${encodeURIComponent(`/dashboard?purchase=${program.slug}`)}`
              }
              className="btn-gloss-green inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              {session ? 'Enroll now' : 'Sign in to enroll'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {!session ? (
              <p className="text-xs text-ink/70">
                New learner?{' '}
                <Link
                  to={`/register?next=${encodeURIComponent(`/dashboard?purchase=${program.slug}`)}`}
                  className="font-medium text-forest underline"
                >
                  Create one account
                </Link>{' '}
                (only once — then always sign in).
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </>
  )
}