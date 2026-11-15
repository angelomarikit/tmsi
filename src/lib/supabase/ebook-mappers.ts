import type { EbookCategory } from '@/data/ebooks'
import type { EbookRecord } from '@/data/ebooks'
import type { DbPublishedEbook } from '@/lib/supabase/queries'

const DEFAULT_CATEGORY: Exclude<EbookCategory, 'all'> = 'philosophical'

export function mapDbEbookToRecord(row: DbPublishedEbook): EbookRecord {
  return {
    id: row.legacy_slug ?? row.id,
    title: row.title,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    category: DEFAULT_CATEGORY,
    coverImagePath: row.cover_path,
    pdfStoragePath: row.pdf_path ?? '',
    publishStatus:
      row.publication_status === 'published' && row.rights_confirmed
        ? 'published'
        : 'needs-rights-review',
  }
}