import { AlertTriangle, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  referenceCode?: string | null
  /** Applicant-facing vs staff note */
  audience?: 'applicant' | 'staff'
  compact?: boolean
  children?: ReactNode
}

export function MembershipPaymentReceiptAlert({
  referenceCode,
  audience = 'applicant',
  compact = false,
  children,
}: Props) {
  const title =
    audience === 'staff'
      ? 'Payment receipt missing'
      : 'Upload your payment receipt'
  const body =
    audience === 'staff'
      ? 'This applicant has not uploaded payment proof yet. They must submit reference, payment date, and receipt before you can approve.'
      : 'Optional TMVS membership: your application does not include payment proof yet. Upload your InstaPay reference, payment date, and a screenshot or PDF of your ₱2,500 receipt below. This is separate from any LEAP course purchase.';

  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-950'
          : 'rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-4 text-sm text-amber-950'
      }
      role="status"
    >
      <p className="flex items-start gap-2 font-semibold text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {title}
      </p>
      <p className="mt-2 leading-relaxed">{body}</p>
      {referenceCode ? (
        <p className="mt-2 text-xs text-amber-900/80">Application reference: {referenceCode}</p>
      ) : null}
      {audience === 'applicant' && !children ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-forest">
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Use the upload form on this page, or{' '}
          <Link to="/membership" className="underline">
            return to TMVS registration
          </Link>{' '}
          if you have not applied yet.
        </p>
      ) : null}
      {children}
    </div>
  )
}