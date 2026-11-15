import { AdminPageHeader } from '@/components/admin/AdminLayout'
import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { useContent, useMediaOverrides } from '@/contexts/ContentContext'
import { resolvePublicImageUrl } from '@/data/visual-assets'
import { fetchInstitutionSettings } from '@/lib/supabase/admin-queries'
import { fetchAllMediaAssets } from '@/lib/supabase/queries'
import {
  setPaymentMetrobankApproved,
  uploadMetrobankQrFile,
} from '@/lib/supabase/payment-settings'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, QrCode, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export function AdminPaymentQrPanel() {
  const { apiReady } = useContent()
  const queryClient = useQueryClient()
  const mediaOverrides = useMediaOverrides()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const { data: qrRow } = useQuery({
    queryKey: ['admin', 'media', 'payment.metrobank_qr'],
    queryFn: async () => {
      const rows = await fetchAllMediaAssets()
      return rows?.find((r) => r.asset_key === 'payment.metrobank_qr')
    },
    enabled: apiReady,
  })

  const { data: paymentApproved = false } = useQuery({
    queryKey: ['admin', 'setting', 'payment_metrobank'],
    queryFn: async () => {
      const rows = await fetchInstitutionSettings()
      return rows.find((r) => r.key === 'payment_metrobank')?.approved === true
    },
    enabled: apiReady,
  })

  const previewUrl =
    qrRow?.public_path ??
    resolvePublicImageUrl('payment.metrobank_qr', mediaOverrides) ??
    null

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a PNG or JPG image of the QR code.')
      return
    }
    setBusy(true)
    try {
      await uploadMetrobankQrFile(file)
      toast.success('Metrobank QR updated — it now appears on Enroll & Membership.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'payment.metrobank_qr'] })
      await queryClient.invalidateQueries({ queryKey: ['content', 'media'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await handleFile(file)
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  async function toggleApproved() {
    setBusy(true)
    try {
      await setPaymentMetrobankApproved(!paymentApproved)
      toast.success(
        paymentApproved
          ? 'Payment panel marked pending — public warning is shown again.'
          : 'Payment panel approved — enroll page warning is hidden.',
      )
      await queryClient.invalidateQueries({ queryKey: ['admin', 'setting', 'payment_metrobank'] })
      await queryClient.invalidateQueries({ queryKey: ['public', 'payment_metrobank_approved'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update approval')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-8">
      <AdminPageHeader title="Payments">
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Upload the official Metrobank InstaPay QR and verify student receipts below.
        </p>
      </AdminPageHeader>
      <StaffUploadBanner />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <section className="rounded-xl border-2 border-gold/40 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
            <QrCode className="h-5 w-5 text-gold" aria-hidden />
            Metrobank QR code
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Use a square PNG or JPG (at least 400×400 px) so scanners read it clearly on the
            enrollment payment panel.
          </p>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0">
              <VisualAssetImage
                assetKey="payment.metrobank_qr"
                className="aspect-square w-full overflow-hidden rounded-lg border-2 border-forest/20 bg-white p-2 shadow-inner"
                imgClassName="!object-contain"
                fallback={
                  <div className="flex aspect-square w-full flex-col items-center justify-center bg-ivory text-ink/50">
                    <QrCode className="h-10 w-10" aria-hidden />
                    <p className="mt-2 px-2 text-center text-xs">No QR uploaded yet</p>
                  </div>
                }
              />
              {previewUrl ? (
                <p className="mt-2 break-all text-[10px] text-ink/50">{previewUrl}</p>
              ) : null}
            </div>

            <QrUploadDropzone
              busy={busy}
              dragOver={dragOver}
              inputRef={inputRef}
              onPick={onPick}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gold/20 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleApproved()}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                paymentApproved
                  ? 'border border-emerald-700 bg-emerald-50 text-emerald-900'
                  : 'btn-gloss-green text-white disabled:opacity-50',
              )}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {paymentApproved ? 'Approved for public enroll' : 'Mark payment details approved'}
            </button>
            <span className="text-xs text-ink/60">
              DB status: {qrRow?.approval_status ?? '—'} · Setting approved:{' '}
              {paymentApproved ? 'Yes' : 'No'}
            </span>
            <Link
              to="/enroll"
              target="_blank"
              className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-forest underline"
            >
              Preview enroll page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>

        <aside className="rounded-xl border border-gold/30 bg-cream/80 p-4 text-sm text-ink/80">
          <p className="font-semibold text-forest">Checklist</p>
          <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs">
            <li>Confirm payee name matches the authorized Metrobank account.</li>
            <li>Upload the latest InstaPay QR image.</li>
            <li>Mark approved after client sign-off.</li>
            <li>Use the verification queue below when students upload receipts.</li>
          </ol>
        </aside>
      </div>
    </div>
  )
}

function QrUploadDropzone({
  busy,
  dragOver,
  inputRef,
  onPick,
  onDrop,
  onDragOver,
  onDragLeave,
}: {
  busy: boolean
  dragOver: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onPick: (e: ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
}) {
  return (
    <div className="min-w-0 flex-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'flex w-full min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-forest bg-forest/5' : 'border-gold/55 bg-ivory hover:border-forest/50',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className="h-8 w-8 text-forest" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-forest">
          {busy ? 'Uploading…' : 'Drop QR image here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-ink/60">PNG, JPG, or WebP · replaces enroll & membership QR</p>
      </button>
    </div>
  )
}