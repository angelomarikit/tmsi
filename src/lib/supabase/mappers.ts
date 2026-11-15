import type { LeapProgram } from '@/data/programs'
import type { VisualAssetKey } from '@/data/visual-assets'
import type { DbProgramRow } from '@/lib/supabase/types'

function asCoverKey(value: string | null): VisualAssetKey {
  const keys: VisualAssetKey[] = [
    'course.dms',
    'course.dms_tin',
    'course.phd_ticm',
    'course.dms_vitalogy',
    'course.dms_llvt',
    'course.tph_cert',
    'course.luminarian_order',
    'course.lecs_dip',
    'course.lecs_fel',
  ]
  if (value && keys.includes(value as VisualAssetKey)) {
    return value as VisualAssetKey
  }
  return 'course.dms'
}

export function mapDbProgram(row: DbProgramRow): LeapProgram {
  return {
    id: row.legacy_id ?? row.id,
    slug: row.slug,
    code: row.code,
    title: row.title,
    subtitle: row.subtitle,
    feePhp: Number(row.fee_php),
    description: row.description ?? '',
    coverAssetKey: asCoverKey(row.cover_asset_key),
    carouselCoverPath: row.carousel_cover_path,
    courseMaterialPath: row.course_material_storage_path,
    featuredInCarousel: row.featured_in_carousel,
    footerStrip: row.footer_strip,
  }
}