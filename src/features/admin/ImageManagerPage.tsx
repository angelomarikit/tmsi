import { AdminPageHeader } from '@/components/admin/AdminLayout'
import { AdminUploadButton } from '@/components/admin/AdminUploadButton'
import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import { useContent } from '@/contexts/ContentContext'
import {
  cmsImageSlots,
  getVisualAsset,
  type VisualAssetKey,
} from '@/data/visual-assets'
import { uploadPublicAssetFile, updateMediaAssetPath } from '@/lib/supabase/cms-upload'
import { fetchAllMediaAssets } from '@/lib/supabase/queries'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export function ImageManagerPage() {
  const { apiReady } = useContent()
  const queryClient = useQueryClient()
  const { data: dbAssets } = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: fetchAllMediaAssets,
    enabled: apiReady,
  })

  const dbByKey = new Map(dbAssets?.map((row) => [row.asset_key, row]))

  return (
    <div>
      <AdminPageHeader title="CMS · Visual Assets">
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Promotional images only — never course PDFs, diplomas, or credentials. Uploads go to{' '}
          <code className="text-xs">public-assets</code> and update{' '}
          <code className="text-xs">media_assets</code>.
        </p>
      </AdminPageHeader>
      <StaffUploadBanner />
      <div className="overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gold/30 bg-cream text-left text-ink">
              <th className="px-4 py-3 font-medium">CMS slot</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Preview</th>
              <th className="px-4 py-3 font-medium">DB status</th>
              <th className="px-4 py-3 font-medium">Upload</th>
            </tr>
          </thead>
          <tbody>
            {cmsImageSlots.map((slot) => (
              <ImageSlotRow
                key={slot.key}
                assetKey={slot.key}
                dbRow={dbByKey.get(slot.key)}
                onUploaded={() => {
                  void queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] })
                  void queryClient.invalidateQueries({ queryKey: ['content', 'media'] })
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/" className="mt-6 inline-block text-sm text-forest underline">
        View public site
      </Link>
    </div>
  )
}

function ImageSlotRow({
  assetKey,
  dbRow,
  onUploaded,
}: {
  assetKey: VisualAssetKey
  dbRow?: {
    public_path: string | null
    approval_status: string
  }
  onUploaded: () => void
}) {
  const slot = getVisualAsset(assetKey)
  const previewPath = dbRow?.public_path ?? slot.publicPath

  return (
    <tr className="border-b border-gold/15">
      <td className="px-4 py-3 font-medium text-forest">{slot.cmsLabel}</td>
      <td className="px-4 py-3 text-ink/70">{slot.category}</td>
      <td className="px-4 py-3">
        {previewPath ? (
          <img
            src={previewPath}
            alt={slot.alt}
            className="h-14 w-20 rounded border border-gold/30 object-cover"
          />
        ) : (
          <span className="text-xs text-amber-800">Missing on site</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-ink/70">
        {dbRow ? dbRow.approval_status : 'Not in DB yet'}
      </td>
      <td className="px-4 py-3">
        <AdminUploadButton
          label="Replace"
          accept="image/jpeg,image/png,image/webp"
          onFile={async (file) => {
            const ext = file.name.split('.').pop() ?? 'jpg'
            const storagePath = `cms/${assetKey.replaceAll('.', '-')}.${ext}`
            try {
              const publicUrl = await uploadPublicAssetFile(storagePath, file)
              await updateMediaAssetPath(
                assetKey,
                publicUrl,
                slot.category,
                slot.cmsLabel,
              )
              toast.success(`Updated ${slot.cmsLabel}`)
              onUploaded()
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Upload failed')
            }
          }}
        />
      </td>
    </tr>
  )
}