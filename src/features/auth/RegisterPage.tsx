import { DataPrivacyConsentModal } from '@/components/auth/DataPrivacyConsentModal'
import { useStaff } from '@/contexts/StaffContext'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { SERVICE_UNAVAILABLE_MESSAGE, userFacingError } from '@/lib/user-facing-message'
import { toast } from 'sonner'

function safeNext(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  if (path.startsWith('/admin')) return '/dashboard'
  return path
}

export function RegisterPage() {
  const { signUp, configured, session, loading: authLoading } = useStaff()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next') ?? '/dashboard')

  if (!authLoading && session) {
    return <Navigate to={next} replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || password.length < 8) return
    setPrivacyOpen(true)
  }

  async function completeRegistration() {
    setBusy(true)
    try {
      const result = await signUp(email, password, fullName)
      setPrivacyOpen(false)
      if (result.needsEmailConfirmation) {
        toast.success('Confirm your email, then sign in to continue.', {
          description: 'Check your inbox for the verification link from TMSI–LAPS.',
        })
        navigate(`/login?next=${encodeURIComponent(next)}`)
        return
      }
      toast.success('Account created — purchase courses or apply for TMVS membership from your dashboard.')
      navigate(next)
    } catch (err) {
      toast.error(userFacingError(err, 'Registration failed. Please try again or contact support.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl text-forest">Create account</h1>
      <p className="mt-2 text-sm text-ink/75">
        One account for LEAP courses and/or TMVS membership. You can buy either track from your
        dashboard after sign-in; staff approval unlocks course access or member downloads.
      </p>
      {!configured ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {SERVICE_UNAVAILABLE_MESSAGE}
        </p>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs font-medium">
            Full name
            <input
              required
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
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
              minLength={8}
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
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}
      <DataPrivacyConsentModal
        open={privacyOpen}
        busy={busy}
        title="Confirm account registration"
        confirmLabel="Complete registration"
        onClose={() => !busy && setPrivacyOpen(false)}
        onConfirm={() => void completeRegistration()}
      />
      <p className="mt-6 text-sm">
        Already have an account?{' '}
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-forest underline">
          Sign in
        </Link>
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-forest underline">
        Return home
      </Link>
    </div>
  )
}