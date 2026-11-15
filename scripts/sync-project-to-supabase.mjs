/**
 * One-time / repeat sync: public UI assets + client bundle → Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY (never expose in Vite — server/script only).
 *
 * Usage (from web/):
 *   node scripts/sync-project-to-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, statSync } from 'fs'
import { basename, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const WEB_ROOT = resolve(__dirname, '..')
const TMSI_ROOT = resolve(WEB_ROOT, '..')
const PUBLIC_ASSETS = join(WEB_ROOT, 'public', 'assets')
const CLIENT_ROOT = join(TMSI_ROOT, 'TMSI-LUMINARIAN ACADEMY OF PHILOSOPHICAL STUDIES')

const SKIP_DIR_PATTERNS = [
  /sample diploma/i,
  /pictures-etc.*sample/i,
  /extracted-zip/i,
  /node_modules/i,
]

function loadEnvFile(path) {
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

const env = {
  ...loadEnvFile(join(WEB_ROOT, '.env.local')),
  ...process.env,
}

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function shouldSkip(relPath) {
  return SKIP_DIR_PATTERNS.some((re) => re.test(relPath))
}

async function walkFiles(dir, prefix = '') {
  const entries = await import('fs').then((fs) =>
    fs.promises.readdir(dir, { withFileTypes: true }),
  )
  const files = []
  for (const ent of entries) {
    const full = join(dir, ent.name)
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name
    if (shouldSkip(rel)) continue
    if (ent.isDirectory()) {
      files.push(...(await walkFiles(full, rel)))
    } else if (ent.isFile()) {
      files.push({ full, rel })
    }
  }
  return files
}

function mimeFor(name) {
  const ext = name.toLowerCase().split('.').pop()
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    pdf: 'application/pdf',
    webp: 'image/webp',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function uploadFile(bucket, storagePath, localPath) {
  const body = readFileSync(localPath)
  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
    upsert: true,
    contentType: mimeFor(basename(localPath)),
  })
  if (error) throw new Error(`${storagePath}: ${error.message}`)
}

async function runSeedScript() {
  console.log('→ Upserting programs + media_assets (seed-database.mjs)')
  const { spawn } = await import('child_process')
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/seed-database.mjs'], {
      cwd: WEB_ROOT,
      stdio: 'inherit',
    })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exit ${code}`))))
  })
}

async function syncPublicAssets() {
  if (!existsSync(PUBLIC_ASSETS)) {
    console.warn('No public/assets folder — skip')
    return
  }
  const files = await walkFiles(PUBLIC_ASSETS)
  console.log(`Uploading ${files.length} public UI files → bucket public-assets`)
  for (const { full, rel } of files) {
    const storagePath = rel.replace(/\\/g, '/')
    await uploadFile('public-assets', storagePath, full)
    process.stdout.write('.')
  }
  console.log('\nPublic assets done.')
}

async function syncClientPrivateFiles() {
  if (!existsSync(CLIENT_ROOT)) {
    console.warn('Client folder not found — skip private upload')
    return
  }
  const files = await walkFiles(CLIENT_ROOT)
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.full))
  console.log(`Uploading ${pdfs.length} client PDFs → bucket private-documents`)
  for (const { full, rel } of pdfs) {
    const storagePath = `client-bundle/${rel.replace(/\\/g, '/')}`
    const size = statSync(full).size
    if (size > 80 * 1024 * 1024) {
      console.warn(`Skip large file: ${rel}`)
      continue
    }
    await uploadFile('private-documents', storagePath, full)
    process.stdout.write('.')
  }
  console.log('\nPrivate PDFs done.')
}

async function main() {
  console.log('TMSI–LAPS Supabase sync')
  console.log('Repo root:', TMSI_ROOT)
  await runSeedScript()
  await syncPublicAssets()
  await syncClientPrivateFiles()

  const { count: mc } = await supabase
    .from('media_assets')
    .select('*', { count: 'exact', head: true })
  const { count: pc } = await supabase.from('programs').select('*', { count: 'exact', head: true })
  console.log(`DB check — media_assets: ${mc ?? 0}, programs: ${pc ?? 0}`)
  console.log('Finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})