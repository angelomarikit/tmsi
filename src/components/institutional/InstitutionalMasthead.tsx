import { MastheadDecoration } from '@/components/institutional/MastheadDecoration'
import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { useMediaOverrides } from '@/contexts/ContentContext'
import { resolvePublicImageUrl } from '@/data/visual-assets'
import type { CSSProperties, ReactNode } from 'react'

type MastheadVariant = 'default' | 'leap' | 'ebooks' | 'tmvs' | 'enroll'

type InstitutionalMastheadProps = {
  variant?: MastheadVariant
}

const variantCopy: Record<
  MastheadVariant,
  { right?: ReactNode; centerSub?: string }
> = {
  default: {},
  leap: {
    centerSub: 'Lifelong Education Advancement Program',
    right: (
      <div className="hidden max-w-[220px] text-right text-sm text-white/90 lg:block">
        <p className="font-display text-2xl italic text-gold">LEAP</p>
        <p className="text-xs italic">Lifelong Education Advancement Program</p>
      </div>
    ),
  },
  ebooks: {
    right: (
      <div className="hidden text-right lg:block">
        <p className="font-display text-lg text-gold">LEAP</p>
        <p className="text-xs italic text-white/85">
          Lifelong Education Advancement Program
        </p>
      </div>
    ),
  },
  tmvs: {},
  enroll: {
    right: (
      <p className="hidden max-w-xs text-right text-xs italic leading-relaxed text-white/90 lg:block">
        Philosophy · Metaphysics · Consciousness · Holistic Living · Lifelong
        Learning
      </p>
    ),
  },
}

export function InstitutionalMasthead({
  variant = 'default',
}: InstitutionalMastheadProps) {
  const extra = variantCopy[variant]
  const mediaOverrides = useMediaOverrides()
  const mastheadBg = resolvePublicImageUrl('masthead.background', mediaOverrides)

  const rightSlot =
    extra.right ?? (variant === 'default' && mastheadBg ? null : <MastheadDecoration />)

  const bgStyle: CSSProperties | undefined = mastheadBg
    ? { backgroundImage: `url(${mastheadBg})` }
    : undefined

  return (
    <header className="relative overflow-hidden border-b border-gold/40 text-white">
      {mastheadBg ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-[center_right] bg-no-repeat"
            style={bgStyle}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-emerald-institutional/96 via-forest/88 to-forest/50"
            aria-hidden
          />
        </>
      ) : (
        <div className="masthead-texture absolute inset-0" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:min-h-[108px] lg:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <VisualAssetImage
            assetKey="brand.logo"
            className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-md sm:h-20 sm:w-20"
            imgClassName="object-cover"
            fallback={
              <span className="flex h-full w-full items-center justify-center bg-forest text-xs text-gold">
                TMSI
              </span>
            }
          />
          <div className="min-w-0 text-left">
            <p className="font-display text-2xl font-semibold tracking-wide text-gold sm:text-3xl lg:text-4xl">
              TMSI–LAPS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gold-light/95 sm:text-xs">
              Transcendental Metaphysical Science Institute
            </p>
            <p className="mt-1 hidden text-[10px] text-white/90 sm:block sm:text-xs">
              Luminarian Academy of Philosophical Studies
            </p>
            {extra.centerSub ? (
              <p className="mt-1 text-xs italic text-white/80 lg:hidden">
                {extra.centerSub}
              </p>
            ) : null}
          </div>
        </div>

        {rightSlot ? (
          <div className="hidden items-center gap-4 lg:flex">
            <div className="hidden h-14 w-px bg-gold/50 xl:block" aria-hidden />
            {rightSlot}
          </div>
        ) : (
          <div className="hidden min-h-[88px] w-[min(42%,320px)] shrink-0 lg:block" aria-hidden />
        )}
      </div>
    </header>
  )
}