import { CourseCoverPlaceholder } from '@/components/institutional/CourseCoverPlaceholder'
import { ProgramCoverFrame } from '@/components/institutional/ProgramCoverFrame'
import { useMediaOverrides } from '@/contexts/ContentContext'
import { resolvePublicImageUrl, visualAssets } from '@/data/visual-assets'
import type { LeapProgram } from '@/data/programs'
import { cn, formatPhp } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type ProgramCardProps = {
  program: LeapProgram
  layout?: 'carousel' | 'catalog'
}

export function ProgramCard({ program, layout = 'catalog' }: ProgramCardProps) {
  const mediaOverrides = useMediaOverrides()
  const coverSrc = resolvePublicImageUrl(program.coverAssetKey, mediaOverrides)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-gold/35 bg-white shadow-md',
        layout === 'carousel' && 'min-w-[200px] max-w-[220px] flex-shrink-0 sm:min-w-[210px]',
      )}
    >
      <Link to={`/courses/${program.slug}`} className="block">
        <ProgramCoverFrame
          src={coverSrc}
          alt={visualAssets[program.coverAssetKey].alt}
          zoom={Boolean(coverSrc)}
          className="aspect-[4/3] w-full"
          roundedTop={false}
          fallback={<CourseCoverPlaceholder assetKey={program.coverAssetKey} className="h-full w-full" />}
        />
        <div className="px-3 py-3 text-center">
          <p className="font-display text-lg font-semibold text-forest">{program.title}</p>
          <p className="text-[11px] leading-snug text-ink/80">{program.subtitle}</p>
        </div>
      </Link>
      {layout === 'catalog' ? (
        <div className="flex items-center justify-between gap-2 border-t border-gold/20 px-3 py-2">
          <span className="rounded bg-gold/25 px-2 py-1 text-xs font-semibold text-ink">
            {formatPhp(program.feePhp)}
          </span>
          <Link
            to={`/enroll?program=${program.slug}`}
            className="btn-gloss-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          >
            Enroll Now
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      ) : null}
    </article>
  )
}