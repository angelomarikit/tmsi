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
      blockedReason: 'This title is still in review. Please check back soon.',
    }
  }

  const path = ebook.pdfStoragePath.trim()
  if (!path) {
    return {
      disabled: true,
      buttonLabel: 'Download unavailable (PDF pending)',
      blockedReason: 'This download is not ready yet. Please check back soon.',
    }
  }

  if (!path.startsWith('ebooks/')) {
    return {
      disabled: true,
      buttonLabel: 'Download unavailable (upload PDF)',
      blockedReason:
        'This title is being prepared. Please check back soon or contact TMSI–LAPS for assistance.',
    }
  }

  return {
    disabled: false,
    buttonLabel: 'Download Free PDF',
  }
}