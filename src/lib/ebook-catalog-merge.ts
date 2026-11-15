import type { EbookRecord } from '@/data/ebooks'
import type { DbEbookRow } from '@/lib/supabase/admin-queries'
import type { DbPublishedEbook } from '@/lib/supabase/queries'

function mapStaticPublishStatus(status: EbookRecord['publishStatus']): string {
  if (status === 'needs-rights-review') return 'under_review'
  if (status === 'published') return 'published'
  return status
}

/** Merge seeded index (17 titles) with Supabase rows — same slugs as `ebookRecords[].id`. */
export function mergeEbookAdminRows(dbRows: DbEbookRow[], staticRecords: EbookRecord[]): DbEbookRow[] {
  const bySlug = new Map<string, DbEbookRow>()
  for (const row of dbRows) {
    const slug = row.legacy_slug ?? row.id
    bySlug.set(slug, row)
  }

  const merged: DbEbookRow[] = []

  for (const book of staticRecords) {
    const db = bySlug.get(book.id)
    if (db) {
      merged.push(db)
      bySlug.delete(book.id)
    } else {
      merged.push({
        id: book.id,
        legacy_slug: book.id,
        title: book.title,
        author: book.author ?? null,
        description: book.description ?? null,
        publication_status: mapStaticPublishStatus(book.publishStatus),
        rights_confirmed: book.publishStatus === 'published',
        pdf_path: null,
        cover_path: null,
      })
    }
  }

  for (const extra of bySlug.values()) {
    merged.push(extra)
  }

  return merged
}

export function mergeEbookPublicCatalog(
  dbRows: DbPublishedEbook[] | null | undefined,
  staticRecords: EbookRecord[],
): EbookRecord[] {
  const merged = new Map(staticRecords.map((b) => [b.id, { ...b }]))
  for (const row of dbRows ?? []) {
    const slug = row.legacy_slug ?? row.id
    const prev = merged.get(slug)
    const fromDb: EbookRecord = {
      id: slug,
      title: row.title,
      description: row.description ?? prev?.description,
      author: row.author ?? prev?.author,
      category: prev?.category ?? 'philosophical',
      coverImagePath: row.cover_path ?? prev?.coverImagePath ?? null,
      pdfStoragePath: row.pdf_path ?? prev?.pdfStoragePath ?? '',
      publishStatus:
        row.publication_status === 'published' && row.rights_confirmed
          ? 'published'
          : 'needs-rights-review',
    }
    merged.set(slug, {
      ...(prev ?? fromDb),
      ...fromDb,
      category: prev?.category ?? fromDb.category,
      description: fromDb.description ?? prev?.description,
    })
  }
  return [...merged.values()]
}

export function ebookPdfStorageReady(pdfPath: string | null | undefined): boolean {
  const path = pdfPath?.trim() ?? ''
  return path.startsWith('ebooks/') && path.length > 'ebooks/'.length
}