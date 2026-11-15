import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { MembershipPaymentReceiptAlert } from '@/components/membership/MembershipPaymentReceiptAlert'
import { useStaff } from '@/contexts/StaffContext'
import { studentNavItems } from '@/features/student/student-nav'
import {
  ensureMembershipPaymentReminder,
  fetchMyMembershipStatus,
} from '@/lib/supabase/membership-materials'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'

const PENDING_STATUSES = new Set(['submitted', 'under_review', 'correction_requested', 'draft'])

export function StudentDashboardLayout() {
  const { session, loading, signOut } = useStaff()
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
    <div className="flex min-h-full w-full flex-1 bg-ivory">
      <aside className="hidden w-[240px] shrink-0 border-r border-gold/25 bg-emerald-institutional text-white shadow-lg lg:flex lg:min-h-full lg:flex-col lg:self-stretch">
        <div className="border-b border-gold/30 px-4 py-5">
          <Link to="/" className="flex items-center gap-3 rounded-lg outline-offset-2 hover:opacity-95">
            <VisualAssetImage
              assetKey="brand.logo"
              className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-md"
              imgClassName="object-cover"
              fallback={
                <span className="flex h-full w-full items-center justify-center bg-forest text-[10px] text-gold">
                  TMSI
                </span>
              }
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight text-gold-light">TMSI–LAPS</p>
              <p className="text-[9px] uppercase tracking-wide text-white/75">Student portal</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4 pb-6">
          {studentNavItems.map((item) =>
            item.comingSoon ? (
              <span
                key={item.to}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/45"
                title="Privilege access"
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
                <span className="ml-auto max-w-[5.5rem] text-end text-[8px] font-medium uppercase leading-tight tracking-wide text-gold-light/90">
                  Privilege access
                </span>
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

      <div className="flex min-h-full min-w-0 flex-1 flex-col bg-ivory">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gold/25 bg-white px-4 py-4 sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-forest">Welcome, {name}</p>
            <p className="text-sm text-ink/70">
              LEAP courses and TMVS membership are separate — use My Courses or Downloads anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gold/35 bg-cream px-3 py-2 text-xs font-semibold text-forest shadow-sm transition-colors hover:bg-gold/15"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8">
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