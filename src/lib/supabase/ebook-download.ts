import { getSupabaseClient } from '@/lib/supabase/client'

const BUCKET = 'private-documents'
const SIGNED_SECONDS = 3600

export async function createEbookSignedUrl(pdfPath: string): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pdfPath, SIGNED_SECONDS)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not create download link')
  return data.signedUrl
}

export async function downloadEbookByPath(pdfPath: string, filename: string) {
  const url = await createEbookSignedUrl(pdfPath)
  window.open(url, '_blank', 'noopener,noreferrer')
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}