import { CourseEnrollmentCard } from '@/components/student/CourseEnrollmentCard'
import { CoursePurchaseModal } from '@/components/student/CoursePurchaseModal'
import { MembershipApplyModal } from '@/components/student/MembershipApplyModal'
import { StudentDashboardHub } from '@/components/student/StudentDashboardHub'
import { useStaff } from '@/contexts/StaffContext'
import { fetchMyMembershipStatus } from '@/lib/supabase/membership-materials'
import {
  ensureEnrollmentPaymentReminder,
  fetchStudentDashboardEnrollments,
} from '@/lib/supabase/student-dashboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export function StudentDashboardHome() {
  const { session, isTmvsMember, loading: authLoading } = useStaff()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [purchaseSlug, setPurchaseSlug] = useState<string | undefined>()
  const [openPurchaseWhenReady, setOpenPurchaseWhenReady] = useState(false)
  const [openMembershipWhenReady, setOpenMembershipWhenReady] = useState(false)

  useEffect(() => {
    const purchase = searchParams.get('purchase')
    const apply = searchParams.get('apply')
    if (purchase) {
      setPurchaseSlug(purchase)
      setOpenPurchaseWhenReady(true)
    }
    if (apply === 'tmvs') {
      setOpenMembershipWhenReady(true)
    }
    if (purchase || apply === 'tmvs') {
      navigate('/dashboard', { replace: true })
    }
  }, [searchParams, navigate])

  useEffect(() => {
    if (!session || authLoading) return
    if (openPurchaseWhenReady) {
      setPurchaseOpen(true)
      setOpenPurchaseWhenReady(false)
    }
    if (openMembershipWhenReady) {
      setMembershipOpen(true)
      setOpenMembershipWhenReady(false)
    }
  }, [session, authLoading, openPurchaseWhenReady, openMembershipWhenReady])

  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['student', 'dashboard-enrollments'],
    queryFn: fetchStudentDashboardEnrollments,
    enabled: Boolean(session),
    refetchOnWindowFocus: true,
  })

  const missingEnrollmentReceipt = enrollments.some(
    (e) =>
      !e.has_payment_receipt &&
      !['rejected', 'approved'].includes(e.enrollment_status),
  )

  useEffect(() => {
    if (!session || !missingEnrollmentReceipt) return
    void ensureEnrollmentPaymentReminder()
  }, [session, missingEnrollmentReceipt])

  const { data: membershipStatus } = useQuery({
    queryKey: ['tmvs', 'status'],
    queryFn: fetchMyMembershipStatus,
    enabled: Boolean(session),
  })

  const showMemberLink = isTmvsMember || Boolean(membershipStatus)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['student', 'dashboard-enrollments'] })
    void queryClient.invalidateQueries({ queryKey: ['tmvs', 'status'] })
  }

  return (
    <section>
      <StudentDashboardHub
        onPurchaseCourse={() => {
          setPurchaseSlug(undefined)
          setPurchaseOpen(true)
        }}
        onApplyMembership={() => setMembershipOpen(true)}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest">
          My Courses
        </h1>
        <div className="flex flex-wrap gap-3 text-sm">
          {showMemberLink ? (
            <Link to="/dashboard/downloads" className="font-medium text-forest underline">
              Member downloads
            </Link>
          ) : null}
          <Link to="/courses" className="font-medium text-forest underline">
            Browse catalog
          </Link>
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Could not load enrollments</p>
          <p className="mt-1 text-xs">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-ink/60">Loading enrollments…</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-white px-6 py-12 text-center">
          <p className="text-sm text-ink/75">You have no enrollments yet.</p>
          <p className="mt-2 text-xs text-ink/60">
            LEAP courses are independent of TMVS membership — purchase either or both from the hub above.
          </p>
          <button
            type="button"
            className="btn-gloss-green mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white"
            onClick={() => setPurchaseOpen(true)}
          >
            Browse courses &amp; purchase
          </button>
          <button
            type="button"
            className="mt-3 block w-full text-center text-sm font-semibold text-forest underline"
            onClick={() => setMembershipOpen(true)}
          >
            Apply for TMVS membership (optional)
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((row) => (
            <CourseEnrollmentCard
              key={row.application_id}
              row={row}
              onPaymentUploaded={invalidate}
            />
          ))}
        </div>
      )}

      <CoursePurchaseModal
        open={purchaseOpen && Boolean(session) && !authLoading}
        initialSlug={purchaseSlug}
        onClose={() => setPurchaseOpen(false)}
        onSubmitted={invalidate}
      />
      <MembershipApplyModal
        open={membershipOpen && Boolean(session) && !authLoading}
        onClose={() => setMembershipOpen(false)}
        onSubmitted={invalidate}
      />
    </section>
  )
}