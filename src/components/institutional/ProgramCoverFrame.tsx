import { cn } from '@/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

type ProgramCoverFrameProps = {
  src?: string | null
  alt?: string
  fallback: ReactNode
  className?: string
  roundedTop?: boolean
  /** Zoom slightly to strip poster letterboxing (catalogue posters) */
  zoom?: boolean
}

/**
 * Cover fills 100% of frame — width, height, object-fit: cover (reference layout).
 */
export function ProgramCoverFrame({
  src,
  alt = '',
  fallback,
  className,
  roundedTop = true,
  zoom = false,
}: ProgramCoverFrameProps) {
  const imgStyle: CSSProperties | undefined = zoom
    ? { transform: 'scale(1.12)', transformOrigin: 'center center' }
    : undefined

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-cream',
        roundedTop && 'rounded-t-[12px]',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          className={cn(
            'block size-full min-h-full min-w-full object-cover object-center',
            zoom && 'will-change-transform',
          )}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="size-full min-h-[inherit] [&>*]:!aspect-auto [&>*]:h-full [&>*]:w-full">
          {fallback}
        </div>
      )}
    </div>
  )
}