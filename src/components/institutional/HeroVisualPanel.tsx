import type { VisualAssetKey } from '@/data/visual-assets'
import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { Building2, Sun } from 'lucide-react'

type HeroVisualPanelProps = {
  assetKey: VisualAssetKey
  variant: 'building' | 'contemplative'
}

export function HeroVisualPanel({ assetKey, variant }: HeroVisualPanelProps) {
  const Fallback =
    variant === 'building' ? (
      <div
        className="flex h-full min-h-[280px] w-full flex-col items-center justify-center bg-gradient-to-br from-forest/20 via-emerald-institutional/10 to-cream px-6 text-center"
        role="img"
        aria-label="Placeholder for TMSI–LAPS academic building photography"
      >
        <Building2 className="h-14 w-14 text-forest/50" strokeWidth={1.25} aria-hidden />
        <p className="mt-3 font-display text-sm text-forest/70">Campus imagery pending approval</p>
      </div>
    ) : (
      <div
        className="flex h-full min-h-[280px] w-full flex-col items-center justify-center bg-gradient-to-bl from-gold/25 via-amber-100/40 to-cream px-6 text-center"
        role="img"
        aria-label="Placeholder for contemplative landscape photography"
      >
        <Sun className="h-14 w-14 text-gold" strokeWidth={1.25} aria-hidden />
        <p className="mt-3 font-display text-sm text-ink/60">Landscape imagery pending approval</p>
      </div>
    )

  return (
    <VisualAssetImage
      assetKey={assetKey}
      className="h-full min-h-[280px] w-full"
      fallback={Fallback}
    />
  )
}