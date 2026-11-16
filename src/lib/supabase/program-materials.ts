import { assertStaffCanUploadMaterials } from '@/lib/supabase/course-materials-audit'
import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'

const ENTITY_TYPE = 'leap_program'

export type ProgramMaterialRow = {
  id: string
  label: string
  file_path: string | null
  status: string
  created_at: string
}

export async function fetchProgramBySlug(slug: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, code, title, subtitle')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return data
}

export async function fetchProgramMaterials(programId: string, options?: { throwOnError?: boolean }) {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('content_items')
    .select('id, label, file_path, status, created_at')
    .eq('entity_type', ENTITY_TYPE)
    .eq('entity_id', programId)
    .order('created_at', { ascending: true })
  if (error) {
    if (options?.throwOnError) throw new Error(error.message)
    return []
  }
  return (data ?? []) as ProgramMaterialRow[]
}

/** Staff UI: slug-aware list (RPC 034) with table fallback */
export async function fetchProgramMaterialsAdmin(programId: string, slug: string): Promise<ProgramMaterialRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('admin_list_program_materials', {
    p_program_id: programId,
  })

  if (!error) {
    const rows = (data ?? []) as ProgramMaterialRow[]
    if (rows.length > 0) return rows
    const bySlug = await fetchProgramMaterialsBySlug(slug)
    if (bySlug.length > 0) return bySlug
    return rows
  }

  const rpcMissing =
    error.code === 'PGRST202' ||
    /admin_list_program_materials/i.test(error.message ?? '')

  let rows = await fetchProgramMaterials(programId)
  if (rows.length === 0) {
    rows = await fetchProgramMaterialsBySlug(slug)
  }
  if (rows.length > 0) return rows

  const rpcHint = rpcMissing ? ' Run migration 034 in Supabase SQL Editor.' : ''
  throw new Error(`${error.message}${rpcHint}`)
}

/** Admin/student: all materials for any DB row sharing this catalog slug */
export async function fetchProgramMaterialsBySlug(
  slug: string,
  options?: { throwOnError?: boolean },
): Promise<ProgramMaterialRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data: programs, error: progErr } = await supabase.from('programs').select('id').eq('slug', slug)
  if (progErr) {
    if (options?.throwOnError) throw new Error(progErr.message)
    return []
  }
  if (!programs?.length) return []
  const ids = programs.map((p) => p.id)
  const { data, error } = await supabase
    .from('content_items')
    .select('id, label, file_path, status, created_at')
    .eq('entity_type', ENTITY_TYPE)
    .in('entity_id', ids)
    .order('created_at', { ascending: true })
  if (error) {
    if (options?.throwOnError) throw new Error(error.message)
    return []
  }
  const seen = new Set<string>()
  const rows: ProgramMaterialRow[] = []
  for (const row of (data ?? []) as ProgramMaterialRow[]) {
    const key = row.file_path ?? row.id
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
  return rows
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]/g, '_').replace(/\s+/g, '_')
}

export function isVideoMaterial(file: File | string): boolean {
  if (typeof file === 'string') {
    const lower = file.toLowerCase()
    return /\.(mp4|webm|mov|m4v)(\?|$)/.test(lower)
  }
  const name = file.name.toLowerCase()
  if (/\.(mp4|webm|mov|m4v)$/.test(name)) return true
  return file.type.startsWith('video/')
}

export function isPdfMaterial(file: File | string): boolean {
  if (typeof file === 'string') {
    return file.toLowerCase().endsWith('.pdf')
  }
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return true
  const t = (file.type || '').toLowerCase()
  if (!t) return name.endsWith('.pdf')
  return (
    t === 'application/pdf' ||
    t === 'application/x-pdf' ||
    t === 'application/vnd.adobe.pdf' ||
    t.includes('pdf')
  )
}

export function isAllowedCourseMaterial(file: File): boolean {
  return isPdfMaterial(file) || isVideoMaterial(file)
}

async function fileHasPdfMagic(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, 5).arrayBuffer()
    const bytes = new Uint8Array(buf)
    if (bytes.length < 4) return false
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  )
  } catch {
    return false
  }
}

/** Accept extensionless PDFs (common on Windows — e.g. "DMS-V COURSE NEW") */
export async function normalizeCourseMaterialFile(file: File): Promise<File | null> {
  if (isAllowedCourseMaterial(file)) return file
  if (await fileHasPdfMagic(file)) {
    const base = file.name.replace(/\.pdf$/i, '')
    const name = `${base}.pdf`
    return new File([file], name, { type: file.type || 'application/pdf', lastModified: file.lastModified })
  }
  return null
}

export function courseMaterialRejectionReason(file: File): string | null {
  if (isAllowedCourseMaterial(file)) return null
  const type = file.type || 'unknown'
  return `${file.name} — not recognized as PDF/video (add a .pdf extension or pick MP4). Browser type: ${type}`
}

async function resolveProgramForUpload(programId: string, programSlug: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, code')
    .eq('id', programId)
    .maybeSingle()
  if (error) throw new Error(`Could not load program: ${error.message}`)
  if (!data) {
    throw new Error(
      `Program id ${programId} is not in Supabase — the courses table may be showing static seed data. Sign in as staff and refresh.`,
    )
  }
  const slug = data.slug as string
  if (slug !== programSlug) {
    console.warn(`Course slug mismatch: row had ${programSlug}, database has ${slug} — using database slug for storage.`)
  }
  return { id: data.id as string, slug, code: data.code as string }
}

async function registerProgramMaterialRow(
  programId: string,
  label: string,
  storagePath: string,
): Promise<ProgramMaterialRow> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: rpcRows, error: rpcError } = await supabase.rpc('staff_register_program_material', {
    p_program_id: programId,
    p_label: label,
    p_file_path: storagePath,
  })

  if (!rpcError && rpcRows?.length) {
    return rpcRows[0] as ProgramMaterialRow
  }

  const rpcMissing =
    rpcError &&
    (rpcError.code === 'PGRST202' || /staff_register_program_material/i.test(rpcError.message ?? ''))

  if (rpcError && !rpcMissing) {
    throw new Error(
      `${label}: ${rpcError.message}${/staff only/i.test(rpcError.message) ? ' (user_roles staff)' : ''}`,
    )
  }

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      entity_type: ENTITY_TYPE,
      entity_id: programId,
      label,
      file_path: storagePath,
      status: 'published',
    })
    .select('id, label, file_path, status, created_at')
    .single()

  if (error) {
    const hint = /row-level security|policy/i.test(error.message)
      ? ' Staff role required — run migrations 011, 012, 035 and assign user_roles.'
      : rpcMissing
        ? ' Run migration 035_staff_upload_program_material.sql in Supabase.'
        : ''
    throw new Error(`${label}: ${error.message}${hint}`)
  }
  return data as ProgramMaterialRow
}

export async function uploadProgramMaterials(
  programId: string,
  programSlug: string,
  files: File[],
): Promise<{ count: number; rows: ProgramMaterialRow[] }> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  if (files.length === 0) return { count: 0, rows: [] }

  await assertStaffCanUploadMaterials()
  const program = await resolveProgramForUpload(programId, programSlug)

  const rejected: string[] = []
  const rows: ProgramMaterialRow[] = []

  for (const raw of files) {
    const file = (await normalizeCourseMaterialFile(raw)) ?? raw
    if (!isAllowedCourseMaterial(file)) {
      const reason = courseMaterialRejectionReason(raw)
      rejected.push(reason ?? `${raw.name} (use PDF or video)`)
      continue
    }
    const safeName = safeFileName(file.name)
    const storagePath = `course-materials/${program.slug}/${safeName}`
    try {
      await uploadPrivateDocument(storagePath, file)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Storage upload failed'
      if (/row-level security|policy|JWT|not authorized/i.test(msg)) {
        throw new Error(
          `${msg} — sign in as admin with a staff role (migration 011 / user_roles).`,
        )
      }
      throw new Error(`${file.name}: ${msg}`)
    }
    const row = await registerProgramMaterialRow(program.id, file.name, storagePath)
    rows.push(row)
  }

  if (rows.length === 0) {
    throw new Error(
      rejected.length > 0
        ? `Nothing uploaded: ${rejected.join('; ')}`
        : 'No files to upload',
    )
  }
  return { count: rows.length, rows }
}

export async function fetchProgramMaterialCounts(): Promise<Record<string, number>> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}
  const { data: programs, error: progErr } = await supabase.from('programs').select('id, slug')
  if (progErr || !programs) return {}
  const slugById = Object.fromEntries(programs.map((p) => [p.id, p.slug as string]))
  const { data, error } = await supabase
    .from('content_items')
    .select('entity_id')
    .eq('entity_type', ENTITY_TYPE)
  if (error || !data) return {}
  const bySlug: Record<string, number> = {}
  const byId: Record<string, number> = {}
  for (const row of data) {
    const id = row.entity_id as string
    byId[id] = (byId[id] ?? 0) + 1
    const slug = slugById[id]
    if (slug) bySlug[slug] = (bySlug[slug] ?? 0) + 1
  }
  return { ...byId, ...bySlug }
}

export async function deleteProgramMaterial(materialId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('content_items').delete().eq('id', materialId)
  if (error) throw error
}