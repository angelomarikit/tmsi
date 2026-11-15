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

  const coverSrc = resolvePublicImageUrl(program.coverAssetKey, mediaOverrides)

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-gold/35 bg-white shadow-lg">
        <ProgramCoverFrame
          src={coverSrc}
          alt={visualAssets[program.coverAssetKey].alt}
          zoom={Boolean(coverSrc)}
          className="h-56 w-full sm:h-80 lg:h-96"
          roundedTop={false}
          fallback={
            <CourseCoverPlaceholder
              assetKey={program.coverAssetKey}
              className="h-full w-full min-h-56 sm:min-h-80"
            />
          }
        />
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-gold">{program.code}</p>
          <h1 className="font-display text-3xl font-semibold text-forest">{program.subtitle}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/85">{program.description}</p>
          <p className="mt-6 text-lg font-semibold text-ink">
            Program fee: {formatPhp(program.feePhp)}
          </p>
          <p className="mt-2 text-xs text-ink/60">
            Live fee will reflect admin-published pricing after database connection.
          </p>
          {program.courseMaterialPath ? (
            <p className="mt-2 text-xs text-ink/50">
              Learning materials on file (private PDF — not shown on public site).
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-800/80">Course materials: pending upload.</p>
          )}
          <Link
            to={
              session
                ? `/dashboard?purchase=${encodeURIComponent(program.slug)}`
                : `/register?next=${encodeURIComponent(`/dashboard?purchase=${program.slug}`)}`
            }
            className="btn-gloss-green mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Enroll Now
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}