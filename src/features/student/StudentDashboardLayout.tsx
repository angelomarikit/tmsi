import { MembershipPaymentReceiptAlert } from '@/components/membership/MembershipPaymentReceiptAlert'
import { useStaff } from '@/contexts/StaffContext'
import { studentNavItems } from '@/features/student/student-nav'
import {
  ensureMembershipPaymentReminder,
  fetchMyMembershipStatus,
} from '@/lib/supabase/membership-materials'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'

const PENDING_STATUSES = new Set(['submitted', 'under_review', 'correction_requested', 'draft'])

export function StudentDashboardLayout() {
  const { session, loading } = useStaff()
  const location = useLocation()
  const { data: membershipStatus } = useQuery({
    queryKey: ['tmvs', 'status'],
    queryFn: fetchMyMembershipStatus,
    enabled: Boolean(session),
  })
  const showPaymentBanner =
    Boolean(membershipStatus) &&
    PENDING_STATUSES.has(membershipStatus!.status) &&
    !membershipStatus!.has_payment_receipt

  useEffect(() => {
    if (!session || !showPaymentBanner) return
    void ensureMembershipPaymentReminder()
  }, [session, showPaymentBanner])

  const name =
    session?.user.user_metadata?.full_name ??
    session?.user.email?.split('@')[0] ??
    'Student'

  if (!loading && !session) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (loading) {
    return <p className="px-8 py-12 text-sm text-ink/60">Loading your dashboard…</p>
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-ivory">
      <aside className="hidden w-[240px] shrink-0 flex-col bg-emerald-institutional text-white shadow-lg lg:flex">
        <div className="border-b border-gold/30 px-5 py-6">
          <p className="font-display text-lg font-semibold text-gold-light">TMSI–LAPS</p>
          <p className="mt-1 text-[10px] leading-snug text-white/80">Student portal</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {studentNavItems.map((item) =>
            item.comingSoon ? (
              <span
                key={item.to}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/45"
                title="Coming soon"
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
                <span className="ml-auto text-[9px] uppercase tracking-wide text-gold-light/80">Soon</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-gold/90 to-gold/60 text-ink shadow'
                      : 'text-white/90 hover:bg-white/10',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-gold/25 bg-white px-4 py-4 sm:px-8">
          <p className="font-display text-xl text-forest">Welcome, {name}</p>
          <p className="text-sm text-ink/70">
            LEAP courses and TMVS membership are separate — use My Courses or Downloads anytime.
          </p>
        </header>
        <main className="px-4 py-6 sm:px-8">
          {showPaymentBanner ? (
            <div className="mb-6">
              <MembershipPaymentReceiptAlert
                compact
                referenceCode={membershipStatus?.reference_code}
              >
                <NavLink
                  to="/dashboard/downloads"
                  className="mt-2 inline-block text-xs font-semibold text-forest underline"
                >
                  Go to Member Downloads to upload your receipt
                </NavLink>
              </MembershipPaymentReceiptAlert>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}