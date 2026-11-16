import { MembershipPaymentReceiptAlert } from '@/components/membership/MembershipPaymentReceiptAlert'
import { MembershipPaymentUploadForm } from '@/components/membership/MembershipPaymentUploadForm'
import { MembershipApplyModal } from '@/components/student/MembershipApplyModal'
import { useStaff } from '@/contexts/StaffContext'
import { createMaterialSignedUrl } from '@/lib/supabase/learning-access'
import {
  checkTmvsMembershipAccess,
  ensureMembershipPaymentReminder,
  fetchMembershipMaterials,
  fetchMyMembershipStatus,
} from '@/lib/supabase/membership-materials'
import { fetchStudentDashboardEnrollments } from '@/lib/supabase/student-dashboard'
import { isVideoMaterial } from '@/lib/supabase/program-materials'
import { Download, FileText, Film, Lock } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

const benefits = [
  'Digital Membership Certificate',
  'Digital Membership ID Card',
  'Member updates and institutional correspondence',
  'Professional networking within TMVS',
  'Downloadable member resources (when published by TMSI)',
]

const PENDING_STATUSES = new Set(['submitted', 'under_review', 'correction_requested', 'draft'])

export function StudentMembershipDownloadsPage() {
  const { session } = useStaff()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [membershipOpen, setMembershipOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('apply') === 'tmvs') {
      setMembershipOpen(true)
      navigate('/dashboard/downloads', { replace: true })
    }
  }, [searchParams, navigate])

  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['tmvs', 'access'],
    queryFn: checkTmvsMembershipAccess,
    enabled: Boolean(session),
  })

  const { data: status } = useQuery({
    queryKey: ['tmvs', 'status'],
    queryFn: fetchMyMembershipStatus,
    enabled: Boolean(session),
  })

  const needsPaymentReceipt =
    Boolean(status) &&
    PENDING_STATUSES.has(status!.status) &&
  !status!.has_payment_receipt

  useEffect(() => {
    if (!session || !needsPaymentReceipt) return
    void ensureMembershipPaymentReminder()
  }, [session, needsPaymentReceipt])

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['tmvs', 'materials'],
    queryFn: fetchMembershipMaterials,
    enabled: hasAccess === true,
  })

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student', 'dashboard-enrollments'],
    queryFn: fetchStudentDashboardEnrollments,
    enabled: Boolean(session),
  })

  async function download(path: string, label: string) {
    try {
      const url = await createMaterialSignedUrl(path)
      const a = document.createElement('a')
      a.href = url
      a.download = label
      a.target = '_blank'
      a.rel = 'noopener'
      a.click()
    } catch {
      toast.error('Unable to download this file')
    }
  }

  if (!session) {
    return (
      <div className="max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-5 py-8">
        <p className="font-semibold text-forest">Sign in required</p>
        <p className="mt-2 text-sm text-ink/75">
          Use the email and password from your TMVS registration to access member downloads.
        </p>
        <Link to="/login?next=/dashboard/downloads" className="mt-4 inline-block text-sm text-forest underline">
          Sign in
        </Link>
      </div>
    )
  }

  if (accessLoading) {
    return <p className="text-sm text-ink/60">Checking membership access…</p>
  }

  const canStartApplication = !status || status.status === 'rejected'

  if (!hasAccess) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {enrollments.length > 0 ? (
          <p className="lg:col-span-2 text-sm text-ink/75">
            <Link to="/dashboard" className="font-semibold text-forest underline">
              My LEAP courses
            </Link>{' '}
            — course access is separate from TMVS membership.
          </p>
        ) : null}
        {needsPaymentReceipt ? (
          <div className="lg:col-span-2">
            <MembershipPaymentReceiptAlert referenceCode={status?.reference_code}>
              <MembershipPaymentUploadForm
                applicationId={status!.application_id}
                onUploaded={() => {
                  void queryClient.invalidateQueries({ queryKey: ['tmvs', 'status'] })
                }}
              />
            </MembershipPaymentReceiptAlert>
          </div>
        ) : null}
        <div className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-forest">Member downloads</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink/75">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {needsPaymentReceipt
              ? 'Upload your payment receipt so the registrar can verify payment and approve your membership.'
              : status?.status === 'submitted' || status?.status === 'under_review'
                ? 'Your TMVS application is pending registrar approval. Downloads unlock after approval.'
                : status?.status === 'rejected'
                  ? 'Your membership application was not approved. You may apply again or contact the registrar.'
                  : 'Apply for TMVS membership to access member materials after approval.'}
          </p>
          {status?.reference_code ? (
            <p className="mt-2 text-xs text-ink/60">Reference: {status.reference_code}</p>
          ) : null}
          {canStartApplication && !needsPaymentReceipt ? (
            <>
              <button
                type="button"
                className="btn-gloss-gold mt-4 w-full rounded-full py-2 text-sm font-semibold text-ink"
                onClick={() => setMembershipOpen(true)}
              >
                {status?.status === 'rejected' ? 'Apply again for TMVS membership' : 'Apply for TMVS membership'}
              </button>
              <p className="mt-2 text-center text-[10px] text-ink/55">
                No TMVS account needed for LEAP — optional society membership only.
              </p>
            </>
          ) : null}
          {canStartApplication && !needsPaymentReceipt ? (
            <Link
              to="/membership"
              className="mt-2 block text-center text-xs text-forest underline"
            >
              Or read membership details on the public TMVS page
            </Link>
          ) : null}
        </div>
        <div className="rounded-xl border border-gold/25 bg-cream/50 p-5">
          <h3 className="text-sm font-semibold text-forest">Membership benefits</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-forest">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <MembershipApplyModal
          open={membershipOpen}
          onClose={() => setMembershipOpen(false)}
          onSubmitted={() => {
            void queryClient.invalidateQueries({ queryKey: ['tmvs', 'status'] })
            void queryClient.invalidateQueries({ queryKey: ['tmvs', 'access'] })
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-forest">Member downloads</h2>
      <p className="mt-1 text-sm text-ink/70">
        Approved TMVS materials from TMSI–LAPS. Files are private and tied to your membership.
      </p>

      <ul className="mt-6 space-y-3">
        {materialsLoading ? (
          <li className="text-sm text-ink/60">Loading…</li>
        ) : materials.length === 0 ? (
          <li className="rounded-lg border border-dashed border-gold/40 bg-white px-4 py-8 text-center text-sm text-ink/60">
            No member files are published yet. Check back after TMSI posts new resources.
          </li>
        ) : (
          materials.map((m) =>
            m.file_path ? (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/25 bg-white px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-forest">
                  {isVideoMaterial(m.file_path) ? (
                    <Film className="h-4 w-4" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4" aria-hidden />
                  )}
                  {m.label}
                </span>
                <button
                  type="button"
                  className="btn-gloss-green inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => void download(m.file_path!, m.label)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download
                </button>
              </li>
            ) : null,
          )
        )}
      </ul>
    </div>
  )
}