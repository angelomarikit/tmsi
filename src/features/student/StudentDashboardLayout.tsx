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
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'

const PENDING_STATUSES = new Set(['submitted', 'under_review', 'correction_requested', 'draft'])

function StudentSideNav({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav className={cn('flex-1 space-y-0.5 px-2 py-3', className)} aria-label="Student">
      {studentNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-[44px] items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-gold text-forest shadow-sm' : 'text-white/90 hover:bg-white/10',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function StudentDashboardLayout() {
  const { session, loading, signOut } = useStaff()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

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

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [navOpen])

  const name =
    session?.user.user_metadata?.full_name ??
    session?.user.email?.split('@')[0] ??
    'Student'

  if (!loading && !session) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#ece8df]">
        <p className="text-sm text-ink/60">Loading your dashboard…</p>
      </div>
    )
  }

  const brandBlock = (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-lg outline-offset-2 hover:opacity-95"
      onClick={() => setNavOpen(false)}
    >
      <VisualAssetImage
        assetKey="brand.logo"
        className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-md sm:h-14 sm:w-14"
        imgClassName="object-cover"
        fallback={
          <span className="flex h-full w-full items-center justify-center bg-forest text-[10px] text-gold">
            TMSI
          </span>
        }
      />
      <div className="min-w-0">
        <p className="font-display text-base font-semibold leading-tight text-gold-light sm:text-lg">
          TMSI–LAPS
        </p>
        <p className="text-[9px] uppercase tracking-wide text-white/75">Student portal</p>
      </div>
    </Link>
  )

  return (
    <div className="flex min-h-dvh bg-[#ece8df]">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(88vw,280px)] flex-col bg-emerald-institutional text-white shadow-lg transition-transform duration-200 lg:static lg:z-auto lg:w-[240px] lg:shrink-0 lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gold/25 px-4 py-4">
          {brandBlock}
          <button
            type="button"
            className="rounded-md p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <StudentSideNav onNavigate={() => setNavOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-start justify-between gap-3 border-b border-gold/30 bg-cream px-3 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              type="button"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-white text-forest shadow-sm lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-forest sm:text-xl">Welcome, {name}</p>
              <p className="text-xs text-ink/70 sm:text-sm">
                LEAP courses and TMVS membership are separate — use My Courses or Downloads anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gold/30 bg-white px-3 py-2.5 text-xs font-semibold text-forest shadow-sm transition-colors hover:bg-gold/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
          {showPaymentBanner ? (
            <div className="mb-4 sm:mb-6">
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