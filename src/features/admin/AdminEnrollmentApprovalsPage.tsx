import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import {
  fetchAdminEnrollmentQueue,
  fetchEnrollmentApprovalStats,
  getReceiptSignedUrl,
  staffApproveEnrollment,
  staffRejectEnrollment,
  staffRequestCorrection,
  staffVerifyPayment,
  enrollmentApplicantDisplay,
  type AdminEnrollmentRow,
} from '@/lib/supabase/enrollment-workflow'
import { formatPhp } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'

export function AdminEnrollmentApprovalsPage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<AdminEnrollmentRow | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['admin', 'enrollment-stats'],
    queryFn: fetchEnrollmentApprovalStats,
  })
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'enrollment-queue'],
    queryFn: fetchAdminEnrollmentQueue,
  })

  const focusId = (location.state as { focusApplicationId?: string } | null)?.focusApplicationId

  useEffect(() => {
    if (!focusId || rows.length === 0) return
    const match = rows.find((r) => r.id === focusId)
    if (match) setDetail(match)
  }, [focusId, rows])

  useEffect(() => {
    if (!detail) return
    const fresh = rows.find((r) => r.id === detail.id)
    if (fresh) setDetail(fresh)
  }, [rows, detail?.id])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const { name, email, studentNumber } = enrollmentApplicantDisplay(r)
      return (
        r.reference_code?.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        studentNumber?.toLowerCase().includes(q) ||
        r.programs?.title?.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  async function handleApproveRow(row: AdminEnrollmentRow) {
    if (row.payment?.status !== 'verified') {
      toast.error('Verify payment first (open View → Verify Payment).')
      return
    }
    if (
      !window.confirm(
        `Approve enrollment for ${enrollmentApplicantDisplay(row).name}?`,
      )
    ) {
      return
    }
    try {
      await staffApproveEnrollment(row.id)
      toast.success('Enrollment approved — student number assigned if new')
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approve failed')
    }
  }

  async function handleDeclineRow(row: AdminEnrollmentRow) {
    const reason = window.prompt(`Decline enrollment for ${enrollmentApplicantDisplay(row).name}? Enter reason:`)
    if (!reason?.trim()) return
    try {
      await staffRejectEnrollment(row.id, reason.trim())
      toast.success('Enrollment declined')
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Decline failed')
    }
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'enrollment-queue'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'enrollment-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">Enrollment Approvals</h1>
      <p className="mt-1 text-xs text-ink/65">
        Step 1: Verify payment on the receipt. Step 2: Approve enrollment to grant course access. LEAP only — not TMVS.
      </p>
      <p className="mt-1 max-w-2xl text-sm text-ink/75">
        Verify payment and approve enrollment separately. Access is granted only after both are
        complete (database RPC <code className="text-xs">staff_approve_enrollment</code>).
      </p>
      <StaffUploadBanner />

      {stats ? (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ['Pending Approval', stats.pending_approval],
              ['Pending Payment', stats.pending_payment_verification],
              ['Approved', stats.approved],
              ['Corrections', stats.corrections_requested],
              ['Rejected', stats.rejected],
            ] as const
          ).map(([label, val]) => (
            <div
              key={label}
              className="rounded-lg border border-gold/30 bg-white px-3 py-2 text-center shadow-sm"
            >
              <dt className="text-[10px] font-medium uppercase text-ink/55">{label}</dt>
              <dd className="font-display text-xl font-semibold text-forest">{val}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <label className="mt-6 block max-w-md text-xs font-medium">
        Search
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1 w-full rounded-md border border-gold/35 bg-white px-3 py-2 text-sm"
          placeholder="Name, email, reference, course"
        />
      </label>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gold/30 bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Enrollment</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-ink/60">
                  No applications
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const student = enrollmentApplicantDisplay(r)
                const canApprove =
                  !['approved', 'rejected'].includes(r.status) &&
                  r.payment?.status === 'verified'
                const canDecline = !['rejected'].includes(r.status)
                return (
                <tr key={r.id} className="border-t border-gold/15">
                  <td className="px-3 py-2">
                    <p className="font-medium text-forest">{student.name}</p>
                    {student.studentNumber ? (
                      <p className="text-xs font-semibold text-gold">{student.studentNumber}</p>
                    ) : (
                      <p className="text-xs text-ink/50">Student no. on approval</p>
                    )}
                    <p className="text-xs text-ink/60">{student.email}</p>
                  </td>
                  <td className="px-3 py-2">{r.programs?.title ?? '—'}</td>
                  <td className="px-3 py-2">
                    {r.payment ? formatPhp(Number(r.payment.declared_amount)) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.payment?.status ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.status}
                    {r.course_access_granted ? ' · access granted' : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-forest underline"
                        onClick={() => setDetail(r)}
                      >
                        View
                      </button>
                      <span className="text-ink/30" aria-hidden>
                        ·
                      </span>
                      <button
                        type="button"
                        disabled={!canApprove}
                        title={
                          r.payment?.status !== 'verified'
                            ? 'Verify payment first'
                            : r.status === 'approved'
                              ? 'Already approved'
                              : undefined
                        }
                        className="text-xs font-semibold text-forest underline disabled:cursor-not-allowed disabled:no-underline disabled:text-ink/35"
                        onClick={() => void handleApproveRow(r)}
                      >
                        Approve
                      </button>
                      <span className="text-ink/30" aria-hidden>
                        ·
                      </span>
                      <button
                        type="button"
                        disabled={!canDecline}
                        className="text-xs font-semibold text-red-800 underline disabled:cursor-not-allowed disabled:no-underline disabled:text-ink/35"
                        onClick={() => void handleDeclineRow(r)}
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {detail ? (
        <EnrollmentDetailDrawer
          row={detail}
          onClose={() => setDetail(null)}
          onRefresh={invalidate}
          onComplete={() => {
            invalidate()
            setDetail(null)
          }}
        />
      ) : null}
    </div>
  )
}

function EnrollmentDetailDrawer({
  row,
  onClose,
  onRefresh,
  onComplete,
}: {
  row: AdminEnrollmentRow
  onClose: () => void
  onRefresh: () => void
  onComplete: () => void
}) {
  const payload = row.payload ?? {}
  const student = enrollmentApplicantDisplay(row)
  const paymentVerified = row.payment?.status === 'verified'
  const enrollmentFinal = ['approved', 'rejected'].includes(row.status)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-cream shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gold/25 bg-white px-5 py-4">
          <h2 className="font-display text-lg text-forest">Application {row.reference_code}</h2>
          <button type="button" className="text-sm text-forest underline" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-6 px-5 py-4 text-sm">
          <Section title="Student">
            <p>{student.name}</p>
            {student.studentNumber ? (
              <p className="font-semibold text-gold">{student.studentNumber}</p>
            ) : (
              <p className="text-xs text-ink/55">Student number assigned when enrollment is approved</p>
            )}
            <p className="text-ink/70">{student.email}</p>
            <p className="text-ink/70">{String(payload.mobile ?? '')}</p>
          </Section>
          <Section title="Course">
            <p>{row.programs?.title}</p>
            <p className="text-ink/70">{row.programs?.code}</p>
            <p>Fee: {row.programs ? formatPhp(row.programs.fee_php) : '—'}</p>
          </Section>
          <Section title="Payment">
            {!paymentVerified ? (
              <p className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
                Step 1: Click <strong>Verify Payment</strong> after reviewing the receipt. Approval is
                blocked until payment status is verified.
              </p>
            ) : null}
            <p>Reference: {row.payment?.reference_number ?? '—'}</p>
            <p>Status: {row.payment?.status ?? '—'}</p>
            <p>Date: {row.payment?.payment_date ?? '—'}</p>
            {row.payment?.receipt_path ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-forest underline"
                onClick={async () => {
                  try {
                    const url = await getReceiptSignedUrl(row.payment!.receipt_path)
                    window.open(url, '_blank', 'noopener,noreferrer')
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Receipt unavailable')
                  }
                }}
              >
                View receipt
              </button>
            ) : null}
          </Section>
          <Section title="Application">
            <p>Enrollment status: {row.status}</p>
            <p>Access: {row.course_access_granted ? 'Granted' : 'Locked'}</p>
            {row.admin_notes ? <p className="text-ink/70">{row.admin_notes}</p> : null}
          </Section>
          <div className="flex flex-wrap gap-2 border-t border-gold/20 pt-4">
            <ActionBtn
              label="Verify Payment"
              disabled={paymentVerified}
              onClick={async () => {
                try {
                  await staffVerifyPayment(row.id)
                  toast.success('Payment verified — you can now approve enrollment')
                  onRefresh()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Verify payment failed')
                }
              }}
            />
            <ActionBtn
              label="Approve Enrollment"
              disabled={!paymentVerified || enrollmentFinal}
              title={
                !paymentVerified
                  ? 'Verify payment first'
                  : enrollmentFinal
                    ? 'Enrollment already finalized'
                    : undefined
              }
              onClick={async () => {
                if (!paymentVerified) {
                  toast.error('Verify payment first, then approve enrollment.')
                  return
                }
                if (!window.confirm('Grant course access and assign student number if needed?')) return
                try {
                  await staffApproveEnrollment(row.id)
                  toast.success('Enrollment approved — course access granted')
                  onComplete()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Approve failed')
                }
              }}
            />
            <ActionBtn
              label="Request Correction"
              onClick={async () => {
                const msg = window.prompt('Message to student:')
                if (!msg) return
                try {
                  await staffRequestCorrection(row.id, msg)
                  toast.success('Correction requested')
                  onRefresh()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Request failed')
                }
              }}
            />
            <ActionBtn
              label="Reject"
              variant="danger"
              onClick={async () => {
                const reason = window.prompt('Rejection reason:')
                if (!reason) return
                try {
                  await staffRejectEnrollment(row.id, reason)
                  toast.success('Application rejected')
                  onComplete()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Reject failed')
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/55">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  variant = 'default',
  disabled = false,
  title,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={
        variant === 'danger'
          ? 'rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 disabled:cursor-not-allowed disabled:opacity-45'
          : 'rounded-full border border-forest/30 bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-45'
      }
    >
      {label}
    </button>
  )
}