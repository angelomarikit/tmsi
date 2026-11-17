import { useStaff } from '@/contexts/StaffContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { userFacingError } from '@/lib/user-facing-message'
import { toast } from 'sonner'

export function StudentProfilePage() {
  const { session } = useStaff()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student', 'profile', session?.user.id],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      if (!supabase || !session?.user.id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, mobile, email, created_at')
        .eq('id', session.user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: Boolean(session),
  })

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setMobile(profile.mobile ?? '')
  }, [profile])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase || !session?.user.id) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), mobile: mobile.trim() || null })
        .eq('id', session.user.id)
      if (error) throw error
      toast.success('Profile updated')
      void queryClient.invalidateQueries({ queryKey: ['student', 'profile', session.user.id] })
    } catch (err) {
      toast.error(userFacingError(err, 'Could not save profile. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const email = profile?.email ?? session?.user.email ?? ''

  return (
    <section className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-forest">My Profile</h1>
      <p className="mt-1 text-sm text-ink/70">
        Available to every signed-in account — no course or membership purchase required.
      </p>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading…</p>
      ) : (
        <form className="mt-6 space-y-4 rounded-xl border border-gold/30 bg-white p-5 shadow-sm" onSubmit={onSave}>
          <label className="block text-xs font-medium text-ink">
            Email (sign-in)
            <input
              readOnly
              className="mt-1 w-full rounded-md border border-gold/30 bg-cream px-3 py-2 text-sm text-ink/70"
              value={email}
            />
          </label>
          <label className="block text-xs font-medium text-ink">
            Full name
            <input
              required
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-ink">
            Mobile
            <input
              className="mt-1 w-full rounded-md border border-gold/35 px-3 py-2 text-sm"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="btn-gloss-green rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs text-ink/55">
        <Link to="/privacy" className="text-forest underline">
          Privacy Policy
        </Link>
      </p>
    </section>
  )
}