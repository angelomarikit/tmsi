import { useMediaOverrides } from '@/contexts/ContentContext'
import {
  type VisualAssetKey,
  resolvePublicImageUrl,
  visualAssets,
} from '@/data/visual-assets'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type VisualAssetImageProps = {
  assetKey: VisualAssetKey
  className?: string
  imgClassName?: string
  fallback: ReactNode
}

/**
 * Renders an image only when explicitly mapped in the visual asset manifest.
 * Never reads arbitrary paths from program records without a manifest key.
 */
export function VisualAssetImage({
  assetKey,
  className,
  imgClassName,
  fallback,
}: VisualAssetImageProps) {
  const record = visualAssets[assetKey]
  const mediaOverrides = useMediaOverrides()
  const src = resolvePublicImageUrl(assetKey, mediaOverrides)

  if (!src) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={src}
        alt={record.alt}
        className={cn('block h-full w-full object-cover object-center', imgClassName)}
      />
    </div>
  )
}