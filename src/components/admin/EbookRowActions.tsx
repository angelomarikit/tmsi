import { publishEbook, deleteEbookByLegacySlug } from '@/lib/supabase/ebook-admin'
import { toast } from 'sonner'

type Props = {
  legacySlug: string
  publicationStatus: string
  onChanged: () => void
  onEdit: () => void
}

export function EbookRowActions({
  legacySlug,
  publicationStatus,
  onChanged,
  onEdit,
}: Props) {
  const isLive = publicationStatus === 'published'

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={isLive}
        className="rounded-md border border-forest/30 bg-forest/10 px-2 py-1 text-[10px] font-medium text-forest disabled:cursor-not-allowed disabled:opacity-40"
        onClick={async () => {
          try {
            await publishEbook(legacySlug)
            toast.success('Published on public site')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Publish failed')
          }
        }}
      >
        Publish
      </button>
      <button
        type="button"
        className="rounded-md border border-gold/40 bg-ivory px-2 py-1 text-[10px] font-medium text-forest"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-900"
        onClick={async () => {
          if (!window.confirm(`Delete eBook record “${legacySlug}”? Files in storage are not removed.`)) {
            return
          }
          try {
            await deleteEbookByLegacySlug(legacySlug)
            toast.success('Removed from catalog')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed')
          }
        }}
      >
        Delete
      </button>
    </div>
  )
}