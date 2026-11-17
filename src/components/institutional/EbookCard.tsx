import { EbookCover } from '@/components/institutional/EbookCover'
import type { EbookRecord } from '@/data/ebooks'
import { getEbookDownloadUi } from '@/lib/ebook-download-state'
import { userFacingError, userFacingToastDescription } from '@/lib/user-facing-message'
import { downloadEbookByPath } from '@/lib/supabase/ebook-download'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

type EbookCardProps = {
  ebook: EbookRecord
}

export function EbookCard({ ebook }: EbookCardProps) {
  const { disabled, buttonLabel, blockedReason } = getEbookDownloadUi(ebook)

  async function onDownload() {
    if (disabled) {
      toast.message('Download unavailable', {
        description:
          userFacingToastDescription(blockedReason) ??
          'This title is not available for download yet.',
      })
      return
    }
    try {
      await downloadEbookByPath(ebook.pdfStoragePath, ebook.title)
    } catch (err) {
      toast.error('Download failed', {
        description: userFacingError(err, 'Please try again later or contact TMSI–LAPS support.'),
      })
    }
  }

  return (
    <article className="flex gap-3 rounded-xl border border-gold/30 bg-white p-3 shadow-sm">
      <EbookCover ebook={ebook} />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold text-forest">{ebook.title}</h3>
        {ebook.author ? (
          <p className="text-[11px] text-ink/60">{ebook.author}</p>
        ) : null}
        <p className="mt-1 line-clamp-3 text-xs text-ink/75">
          {ebook.description ??
            'Description pending client review. Source PDF on record — not used as cover art.'}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onDownload()}
          className="btn-gloss-green mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {buttonLabel}
        </button>
      </div>
    </article>
  )
}