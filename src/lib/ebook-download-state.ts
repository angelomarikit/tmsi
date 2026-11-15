import type { EbookRecord } from '@/data/ebooks'

export type EbookDownloadUi = {
  disabled: boolean
  buttonLabel: string
  blockedReason?: string
}

/** Public catalog: downloads only when rights are confirmed in CMS and PDF is on the canonical storage path. */
export function getEbookDownloadUi(ebook: EbookRecord): EbookDownloadUi {
  if (ebook.publishStatus !== 'published') {
    return {
      disabled: true,
      buttonLabel: 'Download unavailable (rights review)',
      blockedReason:
        'This title is still in review. In Admin → eBooks, upload the PDF, then set status to Live.',
    }
  }

  const path = ebook.pdfStoragePath.trim()
  if (!path) {
    return {
      disabled: true,
      buttonLabel: 'Download unavailable (PDF pending)',
      blockedReason: 'No PDF path on record. Upload the file in Admin → eBooks → PDF.',
    }
  }

  if (!path.startsWith('ebooks/')) {
    return {
      disabled: true,
      buttonLabel: 'Download unavailable (upload PDF)',
      blockedReason:
        'Status is Live but the PDF is not in Supabase Storage yet. In Admin → eBooks, use PDF upload (stores under ebooks/…), then keep status Live.',
    }
  }

  return {
    disabled: false,
    buttonLabel: 'Download Free PDF',
  }
}