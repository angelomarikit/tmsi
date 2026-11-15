import { mainNavItems } from '@/components/institutional/nav-items'
import { useStaff } from '@/contexts/StaffContext'
import { cn } from '@/lib/utils'
import { UserAccountNavIcon } from '@/components/institutional/UserAccountNavIcon'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function InstitutionalNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const { session, isStaff } = useStaff()
  const authTo = isStaff ? '/admin' : session ? '/dashboard' : '/login'
  const authActive =
    pathname === '/login' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard')
  const authLabel = isStaff ? 'Admin' : session ? 'My Learning' : 'Sign in'

  const isActive = (item: (typeof mainNavItems)[number]) => {
    if (item.match) return item.match(pathname)
    return pathname === item.to
  }

  return (
    <nav
      className="institutional-nav sticky top-0 z-40 border-y border-gold/45 shadow-[0_3px_8px_rgba(0,0,0,0.2)]"
      aria-label="Primary"
    >
      <div className="relative mx-auto flex max-w-[1440px] items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3">
        <button
          type="button"
          className="absolute left-4 inline-flex items-center gap-2 rounded-md border border-gold/40 px-3 py-2 text-sm text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          Menu
        </button>

        <ul className="hidden items-center justify-center gap-0.5 lg:flex">
          {mainNavItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors',
                    active
                      ? 'btn-gloss-gold text-ink shadow-md'
                      : 'text-white hover:bg-white/10',
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4 shrink-0', active ? 'text-ink' : 'text-white')}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                  {item.label === 'LEAP Courses' ? (
                    <ChevronDown
                      className={cn('h-3.5 w-3.5', active ? 'text-ink/80' : 'text-white/90')}
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>

        <Link
          to={authTo}
          className="absolute right-4 inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-white/10"
          aria-label={authLabel}
          title={authLabel}
        >
          <UserAccountNavIcon
            className={cn(
              'h-8 w-8',
              authActive ? 'text-green-300' : 'text-green-400',
            )}
          />
        </Link>
      </div>

      {open ? (
        <ul
          id="mobile-nav"
          className="border-t border-white/10 bg-forest px-4 py-3 lg:hidden"
        >
          {mainNavItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'mb-1 flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold',
                    active ? 'btn-gloss-gold text-ink' : 'text-white hover:bg-white/10',
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-ink' : 'text-white')} aria-hidden />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li className="mt-2 border-t border-white/15 pt-2">
            <Link
              to={authTo}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold',
                authActive ? 'btn-gloss-gold text-ink' : 'text-white hover:bg-white/10',
              )}
            >
              <UserAccountNavIcon
                className={cn('h-5 w-5', authActive ? 'text-green-300' : 'text-green-400')}
              />
              {authLabel}
            </Link>
          </li>
        </ul>
      ) : null}
    </nav>
  )
}