import { useStaff } from '@/contexts/StaffContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

export function LoginPage() {
  const { signIn, configured } = useStaff()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? ''

  async function resolveDestination() {
    const supabase = getSupabaseClient()
    if (!supabase) return '/'
    const { data: staffUser } = await supabase.rpc('current_user_is_staff')
    if (next && next !== '/admin') return next
    if (staffUser) return '/admin'
    return '/dashboard'
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await signIn(email, password)
      toast.success('Signed in')
      navigate(await resolveDestination())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl text-forest">Sign in</h1>
      <p className="mt-2 text-sm text-ink/75">
        One account for LEAP courses and/or TMVS membership. Staff with admin roles open the admin
        portal; everyone else goes to the learner dashboard after sign-in.
      </p>
      {!configured ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web/.env.local
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
        <Link to="/register" className="text-forest underline">
          Create account
        </Link>
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-forest underline">
        Return home
      </Link>
    </div>
  )
}