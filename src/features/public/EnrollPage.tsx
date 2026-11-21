import { LeapEnrollmentApplicantFields } from '@/components/forms/LeapEnrollmentApplicantFields'
import { PaymentProofSection } from '@/components/forms/PaymentProofSection'
import { useLeapPrograms } from '@/contexts/ContentContext'
import { useStaff } from '@/contexts/StaffContext'
import { submitLeapEnrollment } from '@/lib/supabase/enrollment-submit'
import { fetchProgramBySlug } from '@/lib/supabase/program-materials'
import { formatPhp, programCatalogLabel } from '@/lib/utils'
import { GraduationCap, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { userFacingError } from '@/lib/user-facing-message'
import { toast } from 'sonner'

export function EnrollPage() {
  const programs = useLeapPrograms()
  const { session, loading: authLoading } = useStaff()
  const [params] = useSearchParams()
  const prefill = params.get('program')
  const [slug, setSlug] = useState(() => {
    if (prefill && programs.some((p) => p.slug === prefill)) return prefill
    return programs[0]?.slug ?? ''
  })
  const [busy, setBusy] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  useEffect(() => {
    if (prefill && programs.some((p) => p.slug === prefill)) {
      setSlug(prefill)
      return
    }
    if (slug && !programs.some((p) => p.slug === slug) && programs[0]?.slug) {
      setSlug(programs[0].slug)
    }
    if (!slug && programs[0]?.slug) {
      setSlug(programs[0].slug)
    }
  }, [prefill, programs, slug])

  const selected = programs.find((p) => p.slug === slug) ?? programs[0] ?? null
  const catalogEmpty = programs.length === 0

  if (!authLoading && session) {
    const targetSlug =
      prefill && programs.some((p) => p.slug === prefill)
        ? prefill
        : slug && programs.some((p) => p.slug === slug)
          ? slug
          : ''
    const dashboardTo =
      targetSlug.length > 0 ? `/dashboard?purchase=${encodeURIComponent(targetSlug)}` : '/dashboard'
    return <Navigate to={dashboardTo} replace />
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session) {
      toast.error('Create an account or sign in before submitting enrollment')
      return
    }
    if (!selected) {
      toast.error('No published courses available yet — check the catalogue later')
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)
    const receipt = data.get('paymentReceipt')
    if (!(receipt instanceof File) || receipt.size === 0) {
      toast.error('Upload your payment receipt')
      return
    }

    setBusy(true)
    try {
      const programRow = await fetchProgramBySlug(slug)
      if (!programRow?.id) {
        throw new Error('This course is not available for enrollment yet.')
      }

      const result = await submitLeapEnrollment({
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

      setSubmittedRef(result.referenceCode)
      toast.success('Enrollment Submitted — Pending Admin Approval', {
        description:
          'Your application and payment details have been submitted successfully. Course materials will become available after payment verification and enrollment approval.',
      })
      form.reset()
    } catch (err) {
      toast.error(userFacingError(err, 'Submission failed. Please try again or contact the registrar.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="border-b border-gold/30 bg-cream px-4 py-8 text-center sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
          <GraduationCap className="h-10 w-10 text-gold" aria-hidden />
          <h1 className="font-display text-3xl font-semibold text-forest">LEAP Online Enrollment</h1>
          <p className="rounded-full bg-gold/25 px-4 py-1 text-sm font-medium text-ink">
            Lifelong Education Advancement Program
          </p>
        </div>
      </section>

      {!authLoading && !session ? (
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm">
          <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-amber-950">
            Please{' '}
            <Link to="/login?next=/enroll" className="font-semibold text-forest underline">
              sign in
            </Link>{' '}
            to enroll (use your existing account). New?{' '}
            <Link to="/register?next=/enroll" className="font-semibold text-forest underline">
              create an account once
            </Link>
            .
          </p>
        </div>
      ) : null}

      {catalogEmpty ? (
        <div className="mx-auto max-w-lg px-4 py-6">
          <EnrollEmptyState />
        </div>
      ) : null}

      {submittedRef ? (
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
            <p className="font-semibold text-forest">Enrollment Submitted — Pending Admin Approval</p>
            <p className="mt-2 text-sm text-ink/80">Reference: {submittedRef}</p>
            <p className="mt-2 text-xs text-ink/70">
              Your application and payment details have been submitted successfully. Course
              materials will become available after payment verification and enrollment approval.
            </p>
            <Link to="/dashboard" className="mt-4 inline-block text-sm text-forest underline">
              Go to My Courses
            </Link>
          </div>
        </div>
      ) : null}

      {!catalogEmpty ? (
      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] sm:px-6">
        <form
          id="leap-enroll-form"
          className="space-y-8 rounded-xl border border-gold/35 bg-white p-6 shadow-md"
          onSubmit={onSubmit}
          encType="multipart/form-data"
        >
          <section aria-labelledby="step-1">
            <h2 id="step-1" className="flex items-center gap-2 font-display text-xl text-forest">
              <StepBadge n={1} />
              Select Your LEAP Course
            </h2>
            <label className="mt-3 block text-xs font-medium text-ink">
              Program
              <select
                name="program"
                value={slug}
                className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
                onChange={(e) => setSlug(e.target.value)}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {programCatalogLabel(p)} — {formatPhp(p.feePhp)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section aria-labelledby="step-2">
            <h2 id="step-2" className="flex items-center gap-2 font-display text-xl text-forest">
              <StepBadge n={2} />
              Applicant Information
            </h2>
            <div className="mt-3">
              <LeapEnrollmentApplicantFields sessionEmail={null} />
            </div>
          </section>

          <button
            type="submit"
            disabled={busy || !session || !selected}
            className="btn-gloss-green flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {busy ? 'Submitting…' : 'Submit Enrollment'}
          </button>
        </form>

        <div className="space-y-4">
          {selected ? (
          <div className="rounded-xl border-2 border-gold bg-gradient-to-br from-gold/30 to-white p-5 text-center shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/70">Program Fee</p>
            <p className="font-display text-4xl font-semibold text-forest">
              {formatPhp(selected.feePhp)}
            </p>
            <p className="mt-1 text-sm text-ink/80">{programCatalogLabel(selected)}</p>
          </div>
          ) : null}
          <PaymentProofSection
            expectedAmountLabel={selected ? formatPhp(selected.feePhp) : '—'}
            formId="leap-enroll-form"
          />
          <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Payment approval is subject to administrator verification. Course access is not
            granted automatically upon upload.
          </p>
        </div>
      </section>
      ) : null}
    </>
  )
}

function EnrollEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gold/45 bg-white px-5 py-8 text-center">
      <p className="font-semibold text-forest">No courses open for enrollment yet</p>
      <p className="mt-2 text-sm text-ink/75">
        New programs are added by the academy. Browse the catalogue or return home — you can refresh
        this page when courses are published.
      </p>
      <p className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <Link to="/courses" className="font-semibold text-forest underline">
          Browse catalogue
        </Link>
        <Link to="/" className="font-semibold text-forest underline">
          Home
        </Link>
      </p>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-gold-light">
      {n}
    </span>
  )
}
