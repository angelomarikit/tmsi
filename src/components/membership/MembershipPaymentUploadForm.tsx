import { PaymentInstructions } from '@/components/institutional/PaymentInstructions'
import {
  TMVS_MEMBERSHIP_FEE_PHP,
  uploadTmvsMembershipPaymentProof,
} from '@/lib/supabase/membership-submit'
import { formatPhp } from '@/lib/utils'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type Props = {
  applicationId: string
  onUploaded: () => void
}

export function MembershipPaymentUploadForm({ applicationId, onUploaded }: Props) {
  const formId = useId().replace(/:/g, '')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const receipt = data.get('paymentReceipt')
    const paymentReference = String(data.get('paymentReference') ?? '').trim()
    const paymentDate = String(data.get('paymentDate') ?? '').trim()

    if (!paymentReference) {
      toast.error('Enter your payment reference number')
      return
    }
    if (!paymentDate) {
      toast.error('Enter your payment date')
      return
    }
    if (!(receipt instanceof File) || receipt.size === 0) {
      toast.error('Upload your payment receipt')
      return
    }
    if (receipt.size > 5 * 1024 * 1024) {
      toast.error('Receipt must be 5MB or smaller')
      return
    }

    setBusy(true)
    try {
      await uploadTmvsMembershipPaymentProof({
        applicationId,
        paymentReference,
        paymentDate,
        receiptFile: receipt,
      })
      toast.success('Payment receipt uploaded — pending registrar verification')
      e.currentTarget.reset()
      onUploaded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form id={formId} onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
      <p className="text-xs text-ink/70">
        Registration fee: {formatPhp(TMVS_MEMBERSHIP_FEE_PHP)} · Pay via Metrobank / InstaPay before uploading.
      </p>
      <PaymentInstructions
        expectedAmountLabel={formatPhp(TMVS_MEMBERSHIP_FEE_PHP)}
        formId={formId}
        showReceiptFields
        receiptFooterNote="Staff verify payment before your membership can be approved."
        className="border-gold/35 shadow-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="btn-gloss-green w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Upload payment receipt'}
      </button>
    </form>
  )
}