import { MembershipApplicationDetailModal } from '@/components/admin/MembershipApplicationDetailModal'
import { MembershipPaymentReceiptAlert } from '@/components/membership/MembershipPaymentReceiptAlert'
import {
  displayMembershipEmail,
  displayMembershipFullName,
  membershipPayloadString,
} from '@/lib/supabase/membership-display'
import {
  fetchAdminMembershipQueue,
  fetchMembershipApprovalStats,
  staffApproveMembership,
  staffRejectMembership,
  type AdminMembershipRow,
} from '@/lib/supabase/membership-workflow'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

function paymentColumnLabel(row: AdminMembershipRow): string {
  if (!row.payment_receipt_path) return 'Upload payment receipt'
  if (row.payment_status === 'verified') return 'Verified'
  if (row.payment_reference_number) return row.payment_reference_number
  return 'On file'
}

export function AdminMembershipApprovalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<AdminMembershipRow | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['admin', 'membership-stats'],
    queryFn: fetchMembershipApprovalStats,
  })
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'membership-queue'],
    queryFn: fetchAdminMembershipQueue,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const fullName = displayMembershipFullName(r).toLowerCase()
      const email = displayMembershipEmail(r).toLowerCase()
      return (
        r.reference_code?.toLowerCase().includes(q) ||
        email.includes(q) ||
        fullName.includes(q) ||
        membershipPayloadString(r.payload, 'mobile').includes(q)
      )
    })
  }, [rows, search])

  const missingPaymentCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          !r.payment_receipt_path &&
          r.status !== 'approved' &&
          r.status !== 'rejected',
      ).length,
    [rows],
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'membership-queue'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'membership-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'tmvs-members'] })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">Membership Approvals</h1>
      <p className="mt-1 text-sm text-ink/75">
        Review payment proof, then Approve or Decline. Approve verifies payment and unlocks Member Downloads.
        TMVS only — independent of LEAP enrollments.
      </p>

      {stats ? (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['Pending', stats.pending],
              ['Approved', stats.approved],
              ['Corrections', stats.corrections],
              ['Rejected', stats.rejected],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="rounded-lg border border-gold/30 bg-white px-3 py-2 text-center">
              <dt className="text-[10px] uppercase text-ink/55">{label}</dt>
              <dd className="font-display text-xl font-semibold text-forest">{val}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {missingPaymentCount > 0 ? (
        <div className="mt-6 max-w-2xl">
          <MembershipPaymentReceiptAlert audience="staff" compact />
          <p className="mt-1 text-xs text-ink/60">
            {missingPaymentCount} application{missingPaymentCount === 1 ? '' : 's'} waiting on
            payment receipt — applicants see an in-app reminder to upload at Member Downloads.
          </p>
        </div>
      ) : null}

      <input
        className="mt-6 w-full max-w-md rounded-md border border-gold/35 px-3 py-2 text-sm"
        placeholder="Search reference, name, email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-gold/30 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink/60">
                  No membership applications.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const fullName = displayMembershipFullName(r)
                const email = displayMembershipEmail(r)
                const canDecide = r.status !== 'approved' && r.status !== 'rejected'
                const hasReceipt = Boolean(r.payment_receipt_path)
                return (
                  <tr key={r.id} className="border-t border-gold/20">
                    <td className="px-3 py-2">
                      <p className="font-medium text-forest">{fullName}</p>
                      <p className="text-xs text-ink/60">{email}</p>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className={
                          hasReceipt
                            ? 'text-left text-xs text-forest underline'
                            : 'text-left text-xs font-semibold text-amber-800 underline'
                        }
                        onClick={() => setDetail(r)}
                      >
                        {paymentColumnLabel(r)}
                      </button>
                    </td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {canDecide ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={!hasReceipt}
                            className="rounded-full bg-forest px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                            onClick={async () => {
                              setDetail(r)
                            }}
                            title="Open details and receipt"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            disabled={!hasReceipt}
                            className="rounded-full border border-forest/40 px-2.5 py-1 text-[10px] font-semibold text-forest disabled:opacity-40"
                            title={hasReceipt ? undefined : 'Applicant must upload payment receipt'}
                            onClick={async () => {
                              if (!hasReceipt) {
                                toast.error('Applicant must upload their payment receipt first')
                                return
                              }
                              if (
                                !window.confirm(
                                  'Confirm payment on file and approve this membership?',
                                )
                              ) {
                                return
                              }
                              try {
                                await staffApproveMembership(r.id)
                                toast.success('Approved')
                                invalidate()
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Failed')
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-900"
                            onClick={async () => {
                              const reason =
                                window.prompt('Reason for decline:') ?? ''
                              if (!reason.trim()) return
                              try {
                                await staffRejectMembership(r.id, reason.trim())
                                toast.success('Declined')
                                invalidate()
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Failed')
                              }
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-forest underline"
                          onClick={() => setDetail(r)}
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {detail ? (
        <MembershipApplicationDetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onChanged={() => {
            invalidate()
            setDetail(null)
          }}
        />
      ) : null}
    </div>
  )
}