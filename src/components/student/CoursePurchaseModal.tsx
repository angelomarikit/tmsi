import { LeapEnrollmentApplicantFields } from '@/components/forms/LeapEnrollmentApplicantFields'
import { PaymentProofSection } from '@/components/forms/PaymentProofSection'
import { useLeapPrograms } from '@/contexts/ContentContext'
import { useStaff } from '@/contexts/StaffContext'
import { fetchMyPendingEnrollments, submitLeapEnrollment } from '@/lib/supabase/enrollment-submit'
import { fetchProgramBySlug } from '@/lib/supabase/program-materials'
import { formatPhp } from '@/lib/utils'
import { Send, ShieldCheck, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { userFacingError } from '@/lib/user-facing-message'
import { toast } from 'sonner'

type Props = {
  open: boolean
  initialSlug?: string
  onClose: () => void
  onSubmitted?: () => void
}

export function CoursePurchaseModal({ open, initialSlug, onClose, onSubmitted }: Props) {
  const formId = useId().replace(/:/g, '')
  const programs = useLeapPrograms()
  const { session } = useStaff()
  const [slug, setSlug] = useState(programs[0]?.slug ?? '')
  const [busy, setBusy] = useState(false)
  const [pendingOthers, setPendingOthers] = useState<
    { id: string; programs: { title: string; slug: string } | null }[]
  >([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void fetchMyPendingEnrollments().then((rows) => {
      if (cancelled) return
      const mapped = rows.map((r) => {
        const prog = r.programs
        const one =
          prog && typeof prog === 'object' && !Array.isArray(prog)
            ? (prog as { title: string; slug: string })
            : null
        return { id: r.id as string, programs: one }
      })
      setPendingOthers(mapped)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (initialSlug && programs.some((p) => p.slug === initialSlug)) {
      setSlug(initialSlug)
    } else if (programs[0]?.slug) {
      setSlug(programs[0].slug)
    }
  }, [open, initialSlug, programs])

  const selected = programs.find((p) => p.slug === slug) ?? programs[0]
  const otherPending = pendingOthers.filter((p) => p.programs?.slug && p.programs.slug !== slug)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session) {
      toast.error('Sign in to purchase a course')
      return
    }
    const data = new FormData(e.currentTarget)
    const receipt = data.get('paymentReceipt')
    if (!(receipt instanceof File) || receipt.size === 0) {
      toast.error('Upload your payment receipt')
      return
    }
    if (!selected) {
      toast.error('Select a course')
      return
    }

    setBusy(true)
    try {
      const programRow = await fetchProgramBySlug(slug)
      if (!programRow?.id) {
        throw new Error('Program not in database — contact the registrar.')
      }
      await submitLeapEnrollment({
        programId: programRow.id,
        fullName: String(data.get('fullName') ?? ''),
        email: String(data.get('email') ?? ''),
        mobile: String(data.get('mobile') ?? ''),
        dateOfBirth: String(data.get('dob') ?? ''),
        address: String(data.get('address') ?? ''),
        civilStatus: String(data.get('civilStatus') ?? ''),
        paymentReference: String(data.get('paymentReference') ?? ''),
        paymentDate: String(data.get('paymentDate') ?? ''),
        declaredAmount: selected.feePhp,
        receiptFile: receipt,
      })
      toast.success('Enrollment submitted — pending admin approval')
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast.error(userFacingError(err, 'Submission failed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const catalogEmpty = programs.length === 0

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center overflow-y-auto bg-black/45 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-start sm:p-4 sm:pt-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-purchase-title"
        className="mb-0 max-h-[min(96dvh,920px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gold/35 bg-ivory shadow-xl sm:mb-8"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center justify-between border-b border-gold/25 px-5 py-4">
          <h2 id="course-purchase-title" className="font-display text-xl text-forest">
            Purchase a LEAP course
          </h2>
          <button type="button" className="rounded-md p-1 hover:bg-cream" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {catalogEmpty ? (
          <p className="px-5 pb-6 text-center text-sm text-ink/75">
            No published courses yet. Close this window and check the catalogue later, or contact the
            registrar.
          </p>
        ) : (
        <div className="grid gap-5 p-4 sm:gap-6 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
          {otherPending.length > 0 ? (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 lg:col-span-2">
              You still have a pending application for{' '}
              <strong>{otherPending.map((p) => p.programs?.title ?? 'another course').join(', ')}</strong>.
              Submitting for <strong>{selected?.subtitle ?? 'this course'}</strong> will cancel that
              pending application so you can enroll in the correct program.
            </p>
          ) : null}
          <form id={formId} className="space-y-5" onSubmit={onSubmit} encType="multipart/form-data">
            <label className="block text-xs font-medium text-ink">
              Course
              <select
                name="program"
                value={slug}
                className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
                onChange={(e) => setSlug(e.target.value)}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.subtitle} — {formatPhp(p.feePhp)}
                  </option>
                ))}
              </select>
            </label>

            <LeapEnrollmentApplicantFields sessionEmail={session?.user.email} />

            <button
              type="submit"
              disabled={busy || !session || !selected}
              className="btn-gloss-green flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              {busy ? 'Submitting…' : 'Submit enrollment & payment proof'}
            </button>
          </form>

          <div className="space-y-3">
            {selected ? (
              <div className="rounded-xl border-2 border-gold bg-gradient-to-br from-gold/30 to-white p-4 text-center">
                <p className="text-xs font-medium uppercase text-ink/70">Program fee</p>
                <p className="font-display text-3xl font-semibold text-forest">{formatPhp(selected.feePhp)}</p>
                <p className="mt-1 text-sm text-ink/80">{selected.subtitle}</p>
              </div>
            ) : null}
            <PaymentProofSection
              expectedAmountLabel={selected ? formatPhp(selected.feePhp) : '—'}
              formId={formId}
              receiptFooterNote="Submitted with your enrollment; staff verify before course access."
            />
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              TMVS membership is optional and separate from LEAP course purchase.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>,
    document.body,
  )
}