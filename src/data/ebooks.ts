export type EbookCategory =
  | 'all'
  | 'philosophical'
  | 'metaphysical'
  | 'transcendental'
  | 'holistic'

export type EbookRecord = {
  id: string
  title: string
  description?: string
  author?: string
  category: Exclude<EbookCategory, 'all'>
  coverImagePath: string | null
  pdfStoragePath: string
  publishStatus: 'draft' | 'needs-rights-review' | 'published'
}

/** Reserved for category filters; catalog rows come from Supabase only. */
export const ebookRecords: EbookRecord[] = []

export const ebookCategoryLabels: Record<EbookCategory, string> = {
  all: 'All eBooks',
  philosophical: 'Philosophical Studies',
  metaphysical: 'Metaphysical Science',
  transcendental: 'Transcendentalism',
  holistic: 'Holistic Learning',
}