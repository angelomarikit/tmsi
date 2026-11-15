import { PaymentProofSection } from '@/components/forms/PaymentProofSection'
import { uploadLeapEnrollmentPaymentProof } from '@/lib/supabase/enrollment-submit'
import { formatPhp } from '@/lib/utils'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type Props = {
  applicationId: string
  courseTitle: string
  feePhp: number
  onUploaded: () => void
}

export function EnrollmentPaymentUploadForm({
  applicationId,
  courseTitle,
  feePhp,
  onUploaded,
}: Props) {
  const formId = useId().replace(/:/g, '')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const receipt = data.get('paymentReceipt')
    const paymentReference = String(data.get('paymentReference') ?? '').trim()
    const paymentDate = String(data.get('paymentDate') ?? '').trim()

    if (!paymentReference || !paymentDate) {
      toast.error('Enter payment reference and date')
      return
    }
    if (!(receipt instanceof File) || receipt.size === 0) {
      toast.error('Upload your payment receipt')
      return
    }

    setBusy(true)
    try {
      await uploadLeapEnrollmentPaymentProof({
        applicationId,
        paymentReference,
        paymentDate,
        declaredAmount: feePhp,
        receiptFile: receipt,
      })
      toast.success('Payment receipt uploaded')
      onUploaded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form id={formId} className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3" onSubmit={onSubmit}>
      <p className="text-xs font-semibold text-amber-950">Upload payment receipt — {courseTitle}</p>
      <PaymentProofSection
        expectedAmountLabel={formatPhp(feePhp)}
        formId={formId}
        receiptFooterNote="Staff verify payment before course access."
        className="border-none bg-transparent p-0 shadow-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="btn-gloss-green w-full rounded-full py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Upload payment receipt'}
      </button>
    </form>
  )
}