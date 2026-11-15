import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import {
  fetchAdminEnrollmentQueue,
  fetchEnrollmentApprovalStats,
  getReceiptSignedUrl,
  staffApproveEnrollment,
  staffRejectEnrollment,
  staffRequestCorrection,
  staffVerifyPayment,
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.reference_code?.toLowerCase().includes(q) ||
        r.profiles?.email?.toLowerCase().includes(q) ||
        r.profiles?.full_name?.toLowerCase().includes(q) ||
        r.programs?.title?.toLowerCase().includes(q),
    )
  }, [rows, search])

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
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-gold/15">
                  <td className="px-3 py-2">
                    <p className="font-medium text-forest">{r.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-ink/60">{r.profiles?.email ?? '—'}</p>
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
                    <button
                      type="button"
                      className="text-xs font-semibold text-forest underline"
                      onClick={() => setDetail(r)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail ? (
        <EnrollmentDetailDrawer
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

function EnrollmentDetailDrawer({
  row,
  onClose,
  onChanged,
}: {
  row: AdminEnrollmentRow
  onClose: () => void
  onChanged: () => void
}) {
  const payload = row.payload ?? {}

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
            <p>{String(payload.fullName ?? row.profiles?.full_name ?? '—')}</p>
            <p className="text-ink/70">{row.profiles?.email}</p>
            <p className="text-ink/70">{String(payload.mobile ?? '')}</p>
          </Section>
          <Section title="Course">
            <p>{row.programs?.title}</p>
            <p className="text-ink/70">{row.programs?.code}</p>
            <p>Fee: {row.programs ? formatPhp(row.programs.fee_php) : '—'}</p>
          </Section>
          <Section title="Payment">
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
              onClick={async () => {
                try {
                  await staffVerifyPayment(row.id)
                  toast.success('Payment verified (recorded separately from enrollment)')
                  onChanged()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed')
                }
              }}
            />
            <ActionBtn
              label="Approve Enrollment"
              onClick={async () => {
                if (!window.confirm('Grant course access? Payment must already be verified.')) return
                try {
                  await staffApproveEnrollment(row.id)
                  toast.success('Enrollment approved — course access granted')
                  onChanged()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed')
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
                  onChanged()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed')
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
                  onChanged()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed')
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
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'danger'
          ? 'rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900'
          : 'rounded-full border border-forest/30 bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest'
      }
    >
      {label}
    </button>
  )
}