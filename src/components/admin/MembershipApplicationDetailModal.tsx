import type { AdminMembershipRow } from '@/lib/supabase/membership-workflow'
import {
  displayMembershipEmail,
  displayMembershipFullName,
  membershipPayloadString,
} from '@/lib/supabase/membership-display'
import { MembershipPaymentReceiptAlert } from '@/components/membership/MembershipPaymentReceiptAlert'
import { getReceiptSignedUrl } from '@/lib/supabase/enrollment-workflow'
import { staffApproveMembership, staffRejectMembership } from '@/lib/supabase/membership-workflow'
import { formatPhp } from '@/lib/utils'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1 text-sm">
      <span className="text-ink/55">{label}</span>
      <span className="text-forest">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gold">{title}</h3>
      <div className="mt-3 space-y-2 rounded-lg border border-gold/25 bg-white p-4">{children}</div>
    </section>
  )
}

function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return 'No payment proof'
  switch (status) {
    case 'verified':
      return 'Verified'
    case 'submitted':
    case 'pending_verification':
      return 'Awaiting review'
    case 'rejected':
      return 'Rejected'
    default:
      return status.replace(/_/g, ' ')
  }
}

type Props = {
  row: AdminMembershipRow
  onClose: () => void
  onChanged: () => void
}

export function MembershipApplicationDetailModal({ row, onClose, onChanged }: Props) {
  const fullName = displayMembershipFullName(row)
  const email = displayMembershipEmail(row)
  const mobile = membershipPayloadString(row.payload, 'mobile')
  const dob = membershipPayloadString(row.payload, 'dateOfBirth')
  const address = membershipPayloadString(row.payload, 'address')
  const profession = membershipPayloadString(row.payload, 'profession')
  const background = membershipPayloadString(row.payload, 'background')
  const hasPayment = Boolean(row.payment_receipt_path)
  const canDecide = row.status !== 'approved' && row.status !== 'rejected'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-app-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/35 bg-ivory shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gold/25 px-6 py-4">
          <div>
            <h2 id="membership-app-title" className="font-display text-xl font-semibold text-forest">
              Application {row.reference_code ?? '—'}
            </h2>
            <p className="mt-1 text-sm text-ink/80">{fullName}</p>
            <p className="text-xs text-ink/60">{email}</p>
          </div>
          <button type="button" className="rounded-md p-1 hover:bg-cream" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 text-sm">
          <Section title="Payment proof">
            {hasPayment ? (
              <>
                <DetailRow label="Reference" value={row.payment_reference_number ?? ''} />
                <DetailRow label="Amount" value={formatPhp(row.payment_declared_amount ?? 2500)} />
                <DetailRow label="Payment date" value={row.payment_date ?? ''} />
                <DetailRow label="Status" value={paymentStatusLabel(row.payment_status)} />
                <button
                  type="button"
                  className="text-xs font-semibold text-forest underline"
                  onClick={async () => {
                    try {
                      const url = await getReceiptSignedUrl(row.payment_receipt_path!)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Receipt unavailable')
                    }
                  }}
                >
                  View receipt
                </button>
              </>
            ) : (
              <MembershipPaymentReceiptAlert audience="staff" referenceCode={row.reference_code} />
            )}
          </Section>

          <Section title="Contact">
            <DetailRow label="Full name" value={fullName === '—' ? '' : fullName} />
            <DetailRow label="Email" value={email === '—' ? '' : email} />
            <DetailRow label="Mobile" value={mobile} />
            <DetailRow label="Date of birth" value={dob} />
          </Section>

          <Section title="Background">
            <DetailRow label="Address" value={address} />
            <DetailRow label="Profession" value={profession} />
            <div>
              <p className="text-xs text-ink/55">Interest / background</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{background || '—'}</p>
            </div>
          </Section>

          <Section title="Application">
            <DetailRow label="Status" value={row.status} />
            <DetailRow label="Package" value={row.package_code ?? ''} />
            <DetailRow
              label="Downloads"
              value={row.membership_access_granted ? 'Access granted' : 'Locked until approval'}
            />
            <DetailRow
              label="Submitted"
              value={row.submitted_at ? new Date(row.submitted_at).toLocaleString() : ''}
            />
            {row.admin_notes ? (
              <div>
                <p className="text-xs text-ink/55">Admin notes</p>
                <p className="mt-1 text-sm text-ink/80">{row.admin_notes}</p>
              </div>
            ) : null}
          </Section>

          {canDecide ? (
            <div className="flex flex-col gap-2 border-t border-gold/20 pt-4 sm:flex-row">
              <button
                type="button"
                disabled={!hasPayment}
                title={hasPayment ? undefined : 'Payment proof required'}
                className="btn-gloss-green flex-1 rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Confirm payment on the receipt matches ₱2,500.00 and approve membership?',
                    )
                  ) {
                    return
                  }
                  try {
                    await staffApproveMembership(row.id)
                    toast.success('Membership approved')
                    onChanged()
                    onClose()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed')
                  }
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-900"
                onClick={async () => {
                  const msg =
                    window.prompt('Reason for decline (shown to applicant):') ??
                    ''
                  if (!msg.trim()) return
                  try {
                    await staffRejectMembership(row.id, msg.trim())
                    toast.success('Application declined')
                    onChanged()
                    onClose()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed')
                  }
                }}
              >
                Decline
              </button>
            </div>
          ) : null}

          <div className="text-center">
            <button type="button" className="text-xs text-forest underline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}