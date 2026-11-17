import { CourseCoverPlaceholder } from '@/components/institutional/CourseCoverPlaceholder'
import { ProgramCoverFrame } from '@/components/institutional/ProgramCoverFrame'
import { useMediaOverrides } from '@/contexts/ContentContext'
import { resolvePublicImageUrl } from '@/data/visual-assets'
import type { LeapProgram } from '@/data/programs'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

type CarouselProgramCardProps = {
  program: LeapProgram
  className?: string
}

export function CarouselProgramCard({ program, className }: CarouselProgramCardProps) {
  const mediaOverrides = useMediaOverrides()
  const posterSrc =
    program.coverPublicUrl?.trim() ||
    resolvePublicImageUrl(program.coverAssetKey, mediaOverrides)
  const src = program.carouselCoverPath?.trim() || posterSrc

  return (
    <article
      className={cn(
        'flex w-[152px] shrink-0 flex-col overflow-hidden rounded-[14px] border-2 border-gold/70 bg-ivory shadow-[0_4px_14px_rgba(6,63,50,0.18)] sm:w-[162px] lg:w-[172px]',
        className,
      )}
    >
      <Link to={`/courses/${program.slug}`} className="flex flex-col">
        <ProgramCoverFrame
          src={src}
          zoom={Boolean(posterSrc && src === posterSrc)}
          zoomScale={1.15}
          className="h-[128px] w-full shrink-0 sm:h-[136px] lg:h-[144px]"
          roundedTop={false}
          fallback={
            <CourseCoverPlaceholder
              assetKey={program.coverAssetKey}
              className="h-full min-h-[118px] w-full"
            />
          }
        />
        <div className="border-t border-gold/20 bg-gradient-to-b from-ivory to-cream px-2 py-2.5 text-center">
          <p className="font-display text-[15px] font-bold leading-tight text-forest">
            {program.title}
          </p>
          <p className="mt-1 text-[9px] font-medium leading-snug text-ink/90 sm:text-[10px]">
            {program.subtitle}
          </p>
        </div>
      </Link>
    </article>
  )
}