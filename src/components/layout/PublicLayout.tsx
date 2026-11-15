import { InstitutionalFooter } from '@/components/institutional/InstitutionalFooter'
import { InstitutionalMasthead } from '@/components/institutional/InstitutionalMasthead'
import { InstitutionalNav } from '@/components/institutional/InstitutionalNav'
import { Outlet, useLocation } from 'react-router-dom'

const footerByPath: Record<string, string> = {
  '/ebooks': 'Knowledge • Consciousness • Healing • Human Evolution',
}

function mastheadForPath(pathname: string) {
  if (pathname.startsWith('/courses')) return 'leap' as const
  if (pathname.startsWith('/ebooks')) return 'ebooks' as const
  if (pathname.startsWith('/membership')) return 'tmvs' as const
  if (pathname.startsWith('/enroll')) return 'enroll' as const
  return 'default' as const
}

export function PublicLayout() {
  const { pathname } = useLocation()
  const variant = mastheadForPath(pathname)
  const footerTagline = footerByPath[pathname]
  const isStudentDashboard = pathname.startsWith('/dashboard')

  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <InstitutionalMasthead variant={variant} />
      <InstitutionalNav />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {isStudentDashboard ? null : <InstitutionalFooter tagline={footerTagline} />}
    </div>
  )
}