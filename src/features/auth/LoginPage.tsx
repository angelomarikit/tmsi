import { useStaff } from '@/contexts/StaffContext'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { SERVICE_UNAVAILABLE_MESSAGE, userFacingError } from '@/lib/user-facing-message'
import { toast } from 'sonner'

export function LoginPage() {
  const { signIn, configured, session, loading: authLoading, isStaff } = useStaff()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? ''

  function safeLearnerNext(path: string): string | null {
    if (!path.startsWith('/') || path.startsWith('//')) return null
    if (path.startsWith('/admin')) return null
    return path
  }

  function resolveDestination(staffAccount: boolean): string {
    if (staffAccount) return '/admin'
    const learnerNext = safeLearnerNext(next)
    if (learnerNext) return learnerNext
    return '/dashboard'
  }

  if (!authLoading && session) {
    return <Navigate to={resolveDestination(isStaff)} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const { isStaff } = await signIn(email, password)
      toast.success('Signed in')
      navigate(resolveDestination(isStaff))
    } catch (err) {
      toast.error(userFacingError(err, 'Sign-in failed. Check your email and password.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl text-forest">Sign in</h1>
      <p className="mt-2 text-sm text-ink/75">
        Learners go to the student dashboard; registrar and admin accounts always open the admin
        portal (even if you signed out from a learner page).
      </p>
      {!configured ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {SERVICE_UNAVAILABLE_MESSAGE}
        </p>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs font-medium">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium">
            Password
            <input
              type="password"
              required
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="btn-gloss-green w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        New learner?{' '}
        <Link
          to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="text-forest underline"
        >
          Create account
        </Link>
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-forest underline">
        Return home
      </Link>
    </div>
  )
}