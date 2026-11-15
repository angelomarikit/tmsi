import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { useContent } from '@/contexts/ContentContext'
import { fetchPaymentMetrobankApproved } from '@/lib/supabase/payment-settings'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, QrCode, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

type PaymentInstructionsProps = {
  expectedAmountLabel: string
  className?: string
  showReceiptFields?: boolean
  /** Associates receipt inputs with an external enrollment form */
  formId?: string
  /** Footer note under the receipt upload area */
  receiptFooterNote?: string
}

export function PaymentInstructions({
  expectedAmountLabel,
  className,
  showReceiptFields = true,
  formId,
  receiptFooterNote = 'Your file is submitted with enrollment; staff verify before course access.',
}: PaymentInstructionsProps) {
  const { apiReady } = useContent()
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null)

  const { data: paymentApproved } = useQuery({
    queryKey: ['public', 'payment_metrobank_approved'],
    queryFn: fetchPaymentMetrobankApproved,
    enabled: apiReady,
    staleTime: 60_000,
  })

  return (
    <aside
      className={cn(
        'rounded-xl border-2 border-gold/50 bg-white p-4 shadow-md sm:p-5',
        className,
      )}
    >
      <h3 className="font-display text-lg font-semibold text-forest">Payment Details</h3>
      <p className="mt-1 text-xs text-ink/70">Bank Transfer / QR Payment</p>

      {!paymentApproved ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Payment details pending client authorization. Do not pay until TMSI–LAPS
            confirms the official QR and payee in production settings.
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-sm font-medium text-ink">
        Metropolitan Bank &amp; Trust Co. (Metrobank)
      </p>
      <p className="text-xs text-ink/70">Payee: Raul Cardona · InstaPay</p>
      <p className="text-xs text-ink/70">Amount to pay: {expectedAmountLabel}</p>

      <section className="mt-5 rounded-lg border border-forest/15 bg-ivory/60 p-4" aria-labelledby="pay-qr">
        <h4 id="pay-qr" className="text-center text-xs font-semibold uppercase tracking-wide text-forest">
          Scan with your bank app
        </h4>
        <div className="mt-3 flex justify-center">
          <VisualAssetImage
            assetKey="payment.metrobank_qr"
            className="aspect-square w-full max-w-[min(100%,280px)] overflow-hidden rounded-lg border-2 border-gold/60 bg-white p-3 shadow-md"
            imgClassName="!h-full !w-full !object-contain !object-center"
            fallback={
              <div className="flex aspect-square w-full max-w-[280px] flex-col items-center justify-center text-ink/60">
                <QrCode className="h-12 w-12" aria-hidden />
                <p className="mt-2 px-2 text-center text-xs">QR image not available</p>
              </div>
            }
          />
        </div>
        <p className="mt-3 text-center text-xs text-ink/70">
          Transfer the exact program fee shown above. Save your bank reference number for the form
          below.
        </p>
      </section>

      {showReceiptFields ? (
        <section className="mt-5 border-t border-gold/25 pt-5" aria-labelledby="pay-receipt">
          <h4 id="pay-receipt" className="text-sm font-semibold text-forest">
            Upload payment proof
          </h4>
          <p className="mt-1 text-xs text-ink/65">
            After paying, enter your reference and attach a screenshot or PDF of your receipt.
          </p>

          <div className="mt-3 space-y-3">
            <label className="block text-xs font-medium text-ink">
              Payment Reference Number
              <input
                type="text"
                name="paymentReference"
                form={formId}
                required={Boolean(formId)}
                className="mt-1 w-full rounded-md border border-gold/30 bg-ivory px-3 py-2 text-sm"
                autoComplete="off"
                placeholder="InstaPay / transfer reference"
              />
            </label>
            <label className="block text-xs font-medium text-ink">
              Date of Payment
              <input
                type="date"
                name="paymentDate"
                form={formId}
                required={Boolean(formId)}
                className="mt-1 w-full rounded-md border border-gold/30 bg-ivory px-3 py-2 text-sm"
              />
            </label>

            <input
              ref={receiptInputRef}
              type="file"
              name="paymentReceipt"
              form={formId}
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setReceiptFileName(e.target.files?.[0]?.name ?? null)
              }}
            />
            <div className="rounded-xl border-2 border-dashed border-gold/55 bg-cream/50 px-4 py-6 text-center">
              <Upload className="mx-auto h-7 w-7 text-forest" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-forest">Electronic receipt</p>
              <p className="text-xs text-ink/60">JPG, PNG, or PDF · Max 5MB</p>
              <button
                type="button"
                className="btn-gloss-green mt-3 rounded-full px-5 py-2 text-xs font-semibold text-white"
                onClick={() => receiptInputRef.current?.click()}
              >
                Choose file
              </button>
              {receiptFileName ? (
                <p className="mt-2 text-xs font-medium text-forest">Selected: {receiptFileName}</p>
              ) : null}
              <p className="mt-2 text-[10px] text-ink/50">{receiptFooterNote}</p>
            </div>
          </div>
        </section>
      ) : null}
    </aside>
  )
}