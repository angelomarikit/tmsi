import { DataPrivacyConsentModal } from '@/components/auth/DataPrivacyConsentModal'
import { PaymentProofSection } from '@/components/forms/PaymentProofSection'
import { TmvsMembershipApplicantFields } from '@/components/forms/TmvsMembershipApplicantFields'
import { useStaff } from '@/contexts/StaffContext'
import {
  submitTmvsMembershipForLoggedInUser,
  TMVS_MEMBERSHIP_FEE_PHP,
} from '@/lib/supabase/membership-submit'
import { formatPhp } from '@/lib/utils'
import { Send, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export function MembershipApplyModal({ open, onClose, onSubmitted }: Props) {
  const formId = useId().replace(/:/g, '')
  const { session } = useStaff()
  const [busy, setBusy] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session) {
      toast.error('Sign in to apply for TMVS membership')
      return
    }
    const data = new FormData(e.currentTarget)
    const receipt = data.get('paymentReceipt')
    if (!(receipt instanceof File) || receipt.size === 0) {
      toast.error('Upload your payment receipt')
      return
    }
    if (receipt.size > 5 * 1024 * 1024) {
      toast.error('Receipt must be 5MB or smaller')
      return
    }
    setPrivacyOpen(true)
  }

  async function confirmSubmit() {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) return
    const data = new FormData(form)
    const receipt = data.get('paymentReceipt')
    if (!(receipt instanceof File) || receipt.size === 0) return

    setBusy(true)
    try {
      await submitTmvsMembershipForLoggedInUser({
        fullName: String(data.get('fullName') ?? ''),
        mobile: String(data.get('mobile') ?? ''),
        dateOfBirth: String(data.get('dob') ?? ''),
        address: String(data.get('address') ?? ''),
        profession: String(data.get('profession') ?? ''),
        background: String(data.get('background') ?? ''),
        paymentReference: String(data.get('paymentReference') ?? ''),
        paymentDate: String(data.get('paymentDate') ?? ''),
        receiptFile: receipt,
      })
      toast.success('TMVS application submitted — pending registrar approval')
      setPrivacyOpen(false)
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const sessionEmail = session?.user.email ?? ''

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[250] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-8"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tmvs-apply-title"
          className="mb-8 w-full max-w-4xl rounded-2xl border border-gold/35 bg-ivory shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gold/25 px-5 py-4">
            <div>
              <h2 id="tmvs-apply-title" className="font-display text-xl text-forest">
                Apply for TMVS membership
              </h2>
              <p className="mt-0.5 text-xs text-ink/65">
                Optional — separate from LEAP courses. Fee {formatPhp(TMVS_MEMBERSHIP_FEE_PHP)}.
              </p>
            </div>
            <button type="button" className="rounded-md p-1 hover:bg-cream" aria-label="Close" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <form id={formId} className="space-y-3" onSubmit={onSubmit}>
              <TmvsMembershipApplicantFields sessionEmail={sessionEmail} />
              <button
                type="submit"
                disabled={busy || !session}
                className="btn-gloss-gold flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-ink disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
                Continue to consent
              </button>
            </form>

            <PaymentProofSection
              expectedAmountLabel={formatPhp(TMVS_MEMBERSHIP_FEE_PHP)}
              formId={formId}
              receiptFooterNote="Submitted with your TMVS application; staff verify before approval."
            />
          </div>
        </div>
      </div>

      <DataPrivacyConsentModal
        open={privacyOpen}
        busy={busy}
        title="Confirm TMVS membership application"
        confirmLabel="Submit application"
        onClose={() => !busy && setPrivacyOpen(false)}
        onConfirm={() => void confirmSubmit()}
      />
    </>,
    document.body,
  )
}