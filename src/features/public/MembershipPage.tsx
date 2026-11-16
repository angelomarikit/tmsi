import { DataPrivacyConsentModal } from '@/components/auth/DataPrivacyConsentModal'
import { PaymentProofSection } from '@/components/forms/PaymentProofSection'
import { TmvsMembershipApplicantFields } from '@/components/forms/TmvsMembershipApplicantFields'
import { useStaff } from '@/contexts/StaffContext'
import { supabaseConfigured } from '@/lib/supabase/client'
import { registerAndSubmitTmvsMembership } from '@/lib/supabase/membership-submit'
import { CheckCircle2, ListOrdered, Send } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const benefits = [
  'Digital Membership Certificate',
  'Digital Membership ID Card',
  'Eligibility to apply for DMS–Vitalogy scholarship (separate policy)',
  'Member updates and institutional correspondence',
  'Professional networking within TMVS',
]

const steps = [
  'Complete the membership registration form.',
  'Pay the ₱2,500.00 registration fee via approved channels.',
  'Upload your electronic receipt and reference number.',
  'Submit for registrar verification.',
  'Receive confirmation and digital credentials after approval.',
]

export function MembershipPage() {
  const { session, loading: authLoading } = useStaff()
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured — contact the registrar.')
      return
    }
    const data = new FormData(e.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirm = String(data.get('confirmPassword') ?? '')
    const paymentReference = String(data.get('paymentReference') ?? '').trim()
    const paymentDate = String(data.get('paymentDate') ?? '').trim()
    const receipt = data.get('paymentReceipt')
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
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
    if (!form) return
    const data = new FormData(form)
    setBusy(true)
    try {
      const receipt = data.get('paymentReceipt')
      if (!(receipt instanceof File) || receipt.size === 0) {
        throw new Error('Upload your payment receipt')
      }
      const result = await registerAndSubmitTmvsMembership({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? ''),
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
      setSubmittedRef(result.referenceCode)
      setPrivacyOpen(false)
      toast.success('Membership Submitted — Pending Verification', {
        description:
          'After approval, sign in with your email and password, then open Downloads on your dashboard.',
      })
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="border-b border-gold/25 bg-white px-4 py-8 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-forest sm:text-3xl">
          Transcendental Metaphysician Vitalogists Society (TMVS)
        </h1>
        <p className="mt-2 text-sm italic text-ink/75">
          A Professional and Philosophical Community under TMSI–LAPS
        </p>
      </section>

      <section className="bg-gradient-to-r from-emerald-institutional to-forest px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="max-w-xl text-center lg:text-left">
            <h2 className="font-display text-3xl font-semibold text-gold-light">
              Become a TMVS Member
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Join a community devoted to metaphysical inquiry, vitalogical study, and service.
              Regular digital membership registration fee applies; credentials are issued after
              verified approval.
            </p>
          </div>
          <HealthBadge />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 lg:grid-cols-3 sm:px-6">
        <div className="rounded-xl border-2 border-forest/30 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-display text-lg text-forest">
            <CheckCircle2 className="h-5 w-5 text-gold" aria-hidden />
            Membership Benefits
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-ink/85">
            {benefits.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-forest">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 flex items-center gap-2 font-display text-lg text-forest">
            <ListOrdered className="h-5 w-5 text-gold" aria-hidden />
            Registration Process
          </h3>
          <ol className="mt-4 space-y-3 text-sm text-ink/85">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border-2 border-forest/30 bg-white p-5 shadow-sm">
          {session && !authLoading ? (
            <div className="py-2">
              <h3 className="font-display text-lg text-forest">You are signed in</h3>
              <p className="mt-2 text-sm text-ink/80">
                Submit your TMVS application from the student dashboard — one form with payment proof,
                no need to create another password here.
              </p>
              <Link
                to="/dashboard?apply=tmvs"
                className="btn-gloss-gold mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-ink no-underline"
              >
                <Send className="h-4 w-4" aria-hidden />
                Apply from dashboard
              </Link>
              <p className="mt-3 text-center text-xs text-ink/60">
                New to TMSI–LAPS?{' '}
                <Link to="/register?next=%2Fdashboard%3Fapply%3Dtmvs" className="text-forest underline">
                  Create an account
                </Link>{' '}
                first, then use the button above.
              </p>
            </div>
          ) : authLoading ? (
            <p className="text-sm text-ink/60">Loading sign-in status…</p>
          ) : submittedRef ? (
            <div className="text-center py-4">
              <p className="font-display text-lg font-semibold text-forest">
                Application received
              </p>
              <p className="mt-2 text-sm text-ink/80">Reference: {submittedRef}</p>
              <p className="mt-2 text-xs text-ink/65">
                Pending payment verification and registrar approval.
              </p>
              <button
                type="button"
                className="mt-4 text-sm text-forest underline"
                onClick={() => setSubmittedRef(null)}
              >
                Submit another application
              </button>
            </div>
          ) : (
            <>
              <form id="tmvs-membership-form" ref={formRef} className="space-y-0" onSubmit={onSubmit}>
                <h3 className="font-display text-lg text-forest">TMVS Membership Registration Form</h3>
                <p className="mt-1 text-xs text-ink/60">
                  Create your login (email + password), pay ₱2,500.00, and upload payment proof in the
                  panel on the right. After approval, sign in → Dashboard → Downloads.
                </p>

                <fieldset className="mt-4 space-y-3" disabled={busy}>
                  <legend className="sr-only">Applicant information</legend>
                  <TmvsMembershipApplicantFields includePassword />
                </fieldset>

                <p className="mt-3 text-xs text-ink/60">
                  Already a member?{' '}
                  <Link to="/login?next=/dashboard/downloads" className="text-forest underline">
                    Sign in
                  </Link>
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gloss-gold mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-ink disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {busy ? 'Submitting…' : 'Submit Registration'}
                </button>
              </form>
            </>
          )}
        </div>

        {session && !authLoading ? null : (
          <PaymentProofSection
            expectedAmountLabel="₱2,500.00"
            formId="tmvs-membership-form"
            receiptFooterNote="Submitted with your TMVS application; staff verify payment before approval."
          />
        )}
      </section>

      <DataPrivacyConsentModal
        open={privacyOpen}
        busy={busy}
        title="Confirm membership registration"
        confirmLabel="Submit registration"
        onClose={() => !busy && setPrivacyOpen(false)}
        onConfirm={() => void confirmSubmit()}
      />
    </>
  )
}

function HealthBadge() {
  return (
    <div className="rounded-xl border-2 border-gold bg-forest/60 px-6 py-4 text-center shadow-lg">
      <p className="text-xs uppercase tracking-wide text-gold-light">Membership Registration Fee</p>
      <p className="font-display text-3xl font-semibold text-white">₱2,500.00</p>
    </div>
  )
}