import { Link, useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/login': 'Sign in',
  '/register': 'Create account',
  '/forgot-password': 'Reset password',
}

export function AuthPlaceholderPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Account'

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl text-forest">{title}</h1>
      <p className="mt-3 text-sm text-ink/75">
        Account sign-in is being prepared. Please use the main sign-in page when available.
      </p>
      <Link to="/" className="mt-6 inline-block text-sm text-forest underline">
        Return home
      </Link>
    </div>
  )
}