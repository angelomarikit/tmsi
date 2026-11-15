import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { adminNavItems } from '@/features/admin/admin-nav'
import { cn } from '@/lib/utils'
import { useStaff } from '@/contexts/StaffContext'
import { Bell, LogIn, LogOut, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export function AdminLayout() {
  const { session, isStaff, signOut } = useStaff()

  return (
    <div className="flex min-h-dvh bg-[#ece8df]">
      <aside className="flex w-[220px] shrink-0 flex-col bg-emerald-institutional text-white shadow-lg lg:w-[240px]">
        <div className="border-b border-gold/25 px-4 py-5">
          <div className="flex items-center gap-3">
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
              <p className="font-display text-lg font-semibold leading-tight text-gold-light">
                TMSI–LAPS
              </p>
              <p className="text-[9px] uppercase tracking-wide text-white/75">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3" aria-label="Admin">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gold text-forest shadow-sm'
                    : 'text-white/90 hover:bg-white/10',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-gold/30 bg-cream px-4 py-3 sm:px-6">
          <label className="relative flex min-w-[200px] flex-1 items-center">
            <Search className="absolute left-3 h-4 w-4 text-ink/45" aria-hidden />
            <input
              type="search"
              placeholder="Search students, members, applications…"
              className="w-full rounded-lg border border-gold/35 bg-white py-2 pl-9 pr-3 text-sm text-ink shadow-sm"
              disabled
            />
          </label>
          <button
            type="button"
            className="relative rounded-lg border border-gold/30 bg-white p-2 text-forest shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />
          </button>
          {session && isStaff ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-2 rounded-lg border border-gold/30 bg-white px-3 py-2 text-xs text-forest shadow-sm"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          ) : (
            <Link
              to="/login?next=/admin"
              className="flex items-center gap-2 rounded-lg border border-gold/30 bg-white px-3 py-2 text-xs font-semibold text-forest shadow-sm"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in as admin
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-x-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminPageHeader({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-forest">{title}</h1>
      {children}
    </div>
  )
}