import { EnrollmentPaymentUploadForm } from '@/components/enrollment/EnrollmentPaymentUploadForm'
import { ProgramCoverFrame } from '@/components/institutional/ProgramCoverFrame'
import { CourseCoverPlaceholder } from '@/components/institutional/CourseCoverPlaceholder'
import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { useLeapPrograms, useMediaOverrides } from '@/contexts/ContentContext'
import { getVisualAsset, type VisualAssetKey } from '@/data/visual-assets'
import type { StudentEnrollmentCard } from '@/lib/supabase/student-dashboard'
import { formatPhp } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

type Props = {
  row: StudentEnrollmentCard
  feePhp?: number
  onPaymentUploaded?: () => void
}

function accessGranted(row: StudentEnrollmentCard) {
  return row.course_access_granted && row.enrollment_status === 'approved' && row.payment_status === 'verified'
}

export function CourseEnrollmentCard({ row, feePhp: feeOverride, onPaymentUploaded }: Props) {
  const programs = useLeapPrograms()
  const program = programs.find((p) => p.slug === row.slug)
  const feePhp = feeOverride ?? program?.feePhp ?? 0

  const media = useMediaOverrides()
  const coverKey = (row.cover_asset_key ?? 'course.dms') as VisualAssetKey
  const asset = getVisualAsset(coverKey)
  const coverSrc = media[coverKey] ?? asset.publicPath
  const granted = accessGranted(row)
  const pending =
    !granted &&
    !['rejected', 'correction_requested'].includes(row.enrollment_status)
  const needsReceipt = pending && !row.has_payment_receipt

  const statusLabel = granted
    ? 'Enrolled — Access Granted'
    : row.enrollment_status === 'rejected'
      ? 'Rejected'
      : row.enrollment_status === 'correction_requested'
        ? 'Correction required'
        : 'Pending Admin Approval'

  return (
    <article className="overflow-hidden rounded-2xl border border-gold/35 bg-white shadow-md">
      <ProgramCoverFrame
        src={coverSrc}
        alt={asset.alt}
        className="h-40 w-full"
        roundedTop
        fallback={
          <VisualAssetImage
            assetKey={coverKey}
            className="h-40 w-full"
            imgClassName="!object-cover"
            fallback={<CourseCoverPlaceholder assetKey={coverKey} className="h-full w-full" />}
          />
        }
      />
      <div className="p-4">
        <p className="text-xs font-semibold text-gold">{row.code}</p>
        <h3 className="font-display text-lg font-semibold text-forest">{row.title}</h3>
        {row.subtitle ? <p className="mt-1 text-xs text-ink/70">{row.subtitle}</p> : null}
        {feePhp > 0 ? (
          <p className="mt-2 text-sm text-ink/80">Fee: {formatPhp(feePhp)}</p>
        ) : null}
        {row.submitted_at ? (
          <p className="mt-1 text-[10px] text-ink/55">
            Submitted {new Date(row.submitted_at).toLocaleDateString()}
          </p>
        ) : null}

        <p
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            granted
              ? 'bg-emerald-100 text-emerald-900'
              : pending
                ? 'bg-amber-100 text-amber-950'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusLabel}
        </p>
        <p className="mt-1 text-[10px] text-ink/60">
          Payment: {row.payment_status.replaceAll('_', ' ')}
        </p>

        {needsReceipt ? (
          <EnrollmentPaymentUploadForm
            applicationId={row.application_id}
            courseTitle={row.title}
            feePhp={feePhp}
            onUploaded={() => onPaymentUploaded?.()}
          />
        ) : null}

        {pending ? (
          <div className="mt-4 space-y-2">
            <p className="flex items-start gap-1.5 text-xs text-ink/70">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Your course will be unlocked once your payment and enrollment are approved.
            </p>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400"
            >
              Read Course
            </button>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400"
            >
              Download Materials
            </button>
          </div>
        ) : null}

        {granted ? (
          <Link
            to={`/dashboard/courses/${row.program_id}`}
            className="btn-gloss-green mt-4 flex w-full items-center justify-center rounded-full py-2.5 text-sm font-semibold text-white no-underline"
          >
            Continue Learning
          </Link>
        ) : null}

        {row.enrollment_status === 'correction_requested' ? (
          <Link
            to={`/enroll?program=${row.slug}`}
            className="mt-4 block text-center text-xs font-semibold text-forest underline"
          >
            View required corrections &amp; resubmit
          </Link>
        ) : null}
      </div>
    </article>
  )
}