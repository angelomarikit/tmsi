import { AdminUploadButton } from '@/components/admin/AdminUploadButton'
import {
  ensureEbookCatalogRow,
  ebookUiStatusFromDb,
  publishEbook,
  updateEbookUiStatus,
} from '@/lib/supabase/ebook-admin'
import {
  updateEbookAfterUpload,
  uploadPrivateDocument,
  uploadPublicAssetFile,
} from '@/lib/supabase/cms-upload'
import { toast } from 'sonner'

type EbookAdminActionsProps = {
  legacySlug: string
  onChanged: () => void
  variant?: 'compact' | 'large'
}

export function EbookAdminActions({
  legacySlug,
  onChanged,
  variant = 'compact',
}: EbookAdminActionsProps) {
  const wrap =
    variant === 'large'
      ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'
      : 'flex flex-wrap gap-1'
  const publishClass =
    variant === 'large'
      ? 'btn-gloss-green rounded-full px-5 py-2 text-sm font-semibold text-white'
      : 'rounded-md border border-forest/30 bg-forest/10 px-2 py-1 text-[10px] font-medium text-forest'

  return (
    <div className={wrap}>
      <AdminUploadButton
        label="PDF"
        accept="application/pdf"
        onFile={async (file) => {
          const path = `ebooks/${legacySlug}.pdf`
          try {
            await ensureEbookCatalogRow(legacySlug)
            await uploadPrivateDocument(path, file)
            await updateEbookAfterUpload(legacySlug, {
              pdf_storage_path: path,
            })
            toast.success('PDF saved', {
              description: legacySlug,
              action: {
                label: 'Set Live',
                onClick: () => {
                  void (async () => {
                    try {
                      await updateEbookUiStatus(legacySlug, 'live')
                      toast.success('Now Live on /ebooks')
                      onChanged()
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Could not set Live')
                    }
                  })()
                },
              },
            })
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'PDF upload failed')
          }
        }}
      />
      <AdminUploadButton
        label="Cover"
        accept="image/jpeg,image/png,image/webp"
        onFile={async (file) => {
          const path = `ebooks/covers/${legacySlug}.jpg`
          try {
            await ensureEbookCatalogRow(legacySlug)
            const url = await uploadPublicAssetFile(path, file)
            await updateEbookAfterUpload(legacySlug, { cover_public_url: url })
            toast.success('Cover updated')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Cover upload failed')
          }
        }}
      />
      <button
        type="button"
        className={publishClass}
        title="Confirm client distribution rights, then publish"
        onClick={async () => {
          if (
            !window.confirm(
              'Confirm TMSI–LAPS has rights to distribute this PDF publicly?',
            )
          ) {
            return
          }
          try {
            await publishEbook(legacySlug)
            toast.success('Published (rights confirmed)')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Publish failed')
          }
        }}
      >
        Publish
      </button>
    </div>
  )
}

const UI_LABELS = { review: 'Review', live: 'Live', hold: 'Hold' } as const

export function formatEbookStatus(status: string) {
  const ui = ebookUiStatusFromDb(status)
  return UI_LABELS[ui]
}