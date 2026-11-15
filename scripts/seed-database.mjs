/**
 * Upsert baseline CMS rows (service role). Run before or after storage upload.
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { ebookSeedRows } from './ebooks-seed-data.mjs'

const WEB = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

function loadEnv() {
  const path = join(WEB, '.env.local')
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 1) continue
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const env = { ...loadEnv(), ...process.env }
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in web/.env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const mediaRows = [
  ['brand.logo', 'brand', '/assets/brand/logo.jpg', 'Institutional logo'],
  ['homepage.hero.banner', 'website_visual', '/assets/website-visual/homepage-hero-banner.jpg', 'Homepage hero banner'],
  ['masthead.background', 'website_visual', '/assets/website-visual/masthead-background.png', 'Masthead background'],
  ['course.dms', 'course_cover', '/assets/course-covers/dms.jpg', 'Course cover — DMS'],
  ['course.dms_tin', 'course_cover', '/assets/course-covers/dms-tin.jpg', 'Course cover — DMS-TIN'],
  ['course.phd_ticm', 'course_cover', '/assets/course-covers/phd-ticm.jpg', 'Course cover — PhD-TICM'],
  ['course.dms_vitalogy', 'course_cover', '/assets/course-covers/dms-vitalogy.jpg', 'Course cover — DMS-Vitalogy'],
  ['course.dms_llvt', 'course_cover', '/assets/course-covers/dms-llvt.jpg', 'Course cover — DMS-LLVT'],
  ['course.tph_cert', 'course_cover', '/assets/course-covers/tph-cert.jpg', 'Course cover — TPH-CERT'],
  ['course.luminarian_order', 'course_cover', '/assets/website-visual/luminarian-symbol.jpg', 'Luminarian Order'],
  ['course.lecs_dip', 'course_cover', '/assets/course-covers/lecs-dip.jpg', 'LECS Diplomate'],
  ['course.lecs_fel', 'course_cover', '/assets/course-covers/lecs-fel.jpg', 'LECS Fellow'],
  ['payment.metrobank_qr', 'payment', '/assets/payment/metrobank-instaPay-qr.png', 'Metrobank QR'],
].map(([asset_key, category, public_path, cms_label]) => ({
  asset_key,
  category,
  public_path,
  cms_label,
  approval_status: 'published',
}))

const programRows = [
  ['dms', 'DMS', 'doctor-of-metaphysical-science', 'DMS', 'Doctor of Metaphysical Science', 14000, 'course.dms', '/assets/course-covers/carousel/dms.jpg', null, true, false, 1],
  ['dms-tin', 'DMS-TIN', 'dms-transpersonal-integrative-naturopathy', 'DMS-TIN', 'DMS in Transpersonal Integrative Naturopathy', 14000, 'course.dms_tin', '/assets/course-covers/dms-tin.jpg', null, true, false, 2],
  ['phd-ticm', 'PhD-TICM', 'phd-transpersonal-integrative-complementary-medicine', 'PhD-TICM', 'PhD in Transpersonal Integrative Complementary Medicine', 14000, 'course.phd_ticm', '/assets/course-covers/carousel/phd-ticm.jpg', null, true, false, 3],
  ['dms-vitalogy', 'DMS-Vitalogy', 'dms-vitalogy', 'DMS-Vitalogy', 'Doctor of Metaphysical Science in Vitalogy', 18000, 'course.dms_vitalogy', '/assets/course-covers/dms-vitalogy.jpg', null, true, false, 4],
  ['dms-llvt', 'DMS-LLVT', 'dms-luminarian-light-vitality-therapy', 'DMS-LLVT', 'Luminarian Light and Vitality Therapy', 7500, 'course.dms_llvt', '/assets/course-covers/dms-llvt.jpg', null, true, false, 5],
  ['tph-cert', 'TPH-CERT', 'certificate-philosophy-transcendentalism-ph', 'Transcendentalism-PH Certificate', 'Certificate in the Philosophy of Transcendentalism-PH', 3500, 'course.tph_cert', null, null, true, true, 6],
  ['luminarian-order', 'LUM-ORDER', 'luminarian-order', 'The Luminarian Order', 'Levels I, II and III', 3750, 'course.luminarian_order', null, null, true, true, 7],
  ['lecs-dip', 'LECS-DIP', 'lecs-diplomate-metaphysical-healing-art', 'LECS — Diplomate', 'Diplomate in Metaphysical Healing Art', 6500, 'course.lecs_dip', null, null, true, true, 8],
  ['lecs-fel', 'LECS-FEL', 'lecs-fellow-metaphysical-healing-arts', 'LECS — Fellow', 'Fellow in Metaphysical Healing Arts', 8750, 'course.lecs_fel', null, null, true, true, 9],
].map(
  ([
    legacy_id,
    code,
    slug,
    title,
    subtitle,
    fee_php,
    cover_asset_key,
    carousel_cover_path,
    course_material_storage_path,
    featured_in_carousel,
    footer_strip,
    sort_order,
  ]) => ({
    legacy_id,
    code,
    slug,
    title,
    subtitle,
    fee_php,
    cover_asset_key,
    carousel_cover_path,
    course_material_storage_path,
    featured_in_carousel,
    footer_strip,
    sort_order,
    active: true,
    publication_status: 'published',
  }),
)

async function main() {
  const { error: mErr } = await supabase.from('media_assets').upsert(mediaRows, {
    onConflict: 'asset_key',
  })
  if (mErr) throw mErr
  console.log('media_assets:', mediaRows.length)

  const { error: pErr } = await supabase.from('programs').upsert(programRows, {
    onConflict: 'slug',
  })
  if (pErr) throw pErr
  console.log('programs:', programRows.length)

  const { error: eErr } = await supabase.from('ebooks').upsert(ebookSeedRows, {
    onConflict: 'legacy_slug',
  })
  if (eErr) {
    console.warn('ebooks upsert:', eErr.message, '(run 010_ebooks_seed.sql if legacy_slug column missing)')
  } else {
    console.log('ebooks:', ebookSeedRows.length)
  }

  const { data: page } = await supabase.from('site_pages').upsert(
    { slug: 'home', title: 'Homepage', publication_status: 'published' },
    { onConflict: 'slug' },
  )
  void page
  console.log('site_pages: home')
  console.log('Done. Run 009 SQL for page_sections if hero copy is missing.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})