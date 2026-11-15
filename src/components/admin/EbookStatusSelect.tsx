import {
  ebookDbStatusFromUi,
  ebookUiStatusFromDb,
  type EbookUiStatus,
  updateEbookUiStatus,
} from '@/lib/supabase/ebook-admin'
import { toast } from 'sonner'

const OPTIONS: { value: EbookUiStatus; label: string }[] = [
  { value: 'review', label: 'Review' },
  { value: 'live', label: 'Live' },
  { value: 'hold', label: 'Hold' },
]

type Props = {
  legacySlug: string
  publicationStatus: string
  storageReady: boolean
  disabled?: boolean
  onChanged: () => void
}

export function EbookStatusSelect({
  legacySlug,
  publicationStatus,
  storageReady,
  disabled,
  onChanged,
}: Props) {
  const ui = ebookUiStatusFromDb(publicationStatus)

  return (
    <select
      className="rounded-md border border-gold/35 bg-ivory px-2 py-1 text-xs font-medium text-forest"
      disabled={disabled}
      value={ui}
      title={
        storageReady
          ? `Database: ${ebookDbStatusFromUi(ui)}`
          : 'Upload PDF in Manage (gold button) before setting Live'
      }
      onChange={async (e) => {
        const next = e.target.value as EbookUiStatus
        if (next === 'live' && !storageReady) {
          toast.message('Upload PDF first', {
            description:
              'Use the gold PDF button on this row. After “PDF in Storage” shows Ready, set Status to Live.',
          })
          return
        }
        try {
          await updateEbookUiStatus(legacySlug, next)
          toast.success(`Status → ${OPTIONS.find((o) => o.value === next)?.label ?? next}`)
          onChanged()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Status update failed')
        }
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value} disabled={o.value === 'live' && !storageReady}>
          {o.label}
          {o.value === 'live' && !storageReady ? ' (upload PDF first)' : ''}
        </option>
      ))}
    </select>
  )
}