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
import { useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export function MembershipApplyModal({ open, onClose, onSubmitted }: Props) {
  const formId = useId().replace(/:/g, '')
  const formRef = useRef<HTMLFormElement>(null)
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
    const paymentReference = String(data.get('paymentReference') ?? '').trim()
    const paymentDate = String(data.get('paymentDate') ?? '').trim()
    const receipt = data.get('paymentReceipt')
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
    setPrivacyOpen(true)
  }

  async function confirmSubmit() {
    const form = formRef.current
    if (!form) {
      toast.error('Form not ready — close and reopen the application dialog')
      return
    }
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
        className="fixed inset-0 z-[250] flex items-end justify-center overflow-y-auto bg-black/45 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-start sm:p-4 sm:pt-8"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tmvs-apply-title"
          className="mb-0 max-h-[min(96dvh,920px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gold/35 bg-ivory shadow-xl sm:mb-8"
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

          <div className="grid gap-5 p-4 sm:gap-6 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <form id={formId} ref={formRef} className="space-y-3" onSubmit={onSubmit}>
              <TmvsMembershipApplicantFields sessionEmail={sessionEmail} />
              <button
                type="submit"
                disabled={busy || !session}
                className="btn-gloss-gold hidden min-h-[44px] w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-ink disabled:opacity-50 lg:flex"
              >
                <Send className="h-4 w-4" aria-hidden />
                Submit membership application
              </button>
            </form>

            <div className="space-y-3">
              <PaymentProofSection
                expectedAmountLabel={formatPhp(TMVS_MEMBERSHIP_FEE_PHP)}
                formId={formId}
                receiptFooterNote="Submitted with your TMVS application; staff verify before approval."
              />
              <button
                type="submit"
                form={formId}
                disabled={busy || !session}
                className="btn-gloss-gold flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-ink disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
                Submit membership application
              </button>
            </div>
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