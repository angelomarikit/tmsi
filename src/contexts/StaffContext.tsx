import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/user-facing-message'
import { getSupabaseClient, supabaseConfigured } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { ADMIN_UPLOAD_ROLE_SET } from '@/lib/admin-roles'

export type SignUpResult = {
  needsEmailConfirmation: boolean
}

type StaffContextValue = {
  configured: boolean
  session: Session | null
  isStaff: boolean
  isStudent: boolean
  isTmvsMember: boolean
  loading: boolean
  rolesLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<{ isStaff: boolean }>
  signOut: () => Promise<void>
  refreshStaff: () => Promise<void>
}

const StaffContext = createContext<StaffContextValue | null>(null)

export function StaffProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const configured = supabaseConfigured
  const [session, setSession] = useState<Session | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [isTmvsMember, setIsTmvsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(false)

  const refreshStaff = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setIsStaff(false)
      setIsStudent(false)
      setIsTmvsMember(false)
      return
    }
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setIsStaff(false)
      setIsStudent(false)
      setIsTmvsMember(false)
      return
    }
    const userId = userData.user.id
    const [
      { data: staffData, error: staffErr },
      { data: studentData, error: studentErr },
      { data: tmvsData, error: tmvsErr },
    ] = await Promise.all([
      supabase.rpc('current_user_is_staff'),
      supabase.rpc('current_user_is_student'),
      supabase.rpc('current_user_is_tmvs_member'),
    ])

    let staff = Boolean(staffData) && !staffErr
    if (!staff) {
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('roles(slug)')
        .eq('user_id', userId)
      staff = (roleRows ?? []).some((row) => {
        const slug = (row.roles as { slug?: string })?.slug
        return slug != null && ADMIN_UPLOAD_ROLE_SET.has(slug)
      })
    }

    setIsStaff(staff)
    setIsStudent(Boolean(studentData) && !studentErr)
    setIsTmvsMember(Boolean(tmvsData) && !tmvsErr)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    async function boot() {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      if (data.session) {
        setRolesLoading(true)
        try {
          await refreshStaff()
        } finally {
          if (mounted) setRolesLoading(false)
        }
      }
      if (mounted) setLoading(false)
    }

    void boot()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      if (next) {
        setRolesLoading(true)
        try {
          await refreshStaff()
        } finally {
          setRolesLoading(false)
        }
      } else {
        setIsStaff(false)
        setIsStudent(false)
        setIsTmvsMember(false)
        setRolesLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshStaff])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error(SERVICE_UNAVAILABLE_MESSAGE)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) setSession(data.session)
    await refreshStaff()

    const userId = data.user?.id
    let staff = false
    const { data: staffData, error: staffErr } = await supabase.rpc('current_user_is_staff')
    staff = Boolean(staffData) && !staffErr
    if (!staff && userId) {
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('roles(slug)')
        .eq('user_id', userId)
      staff = (roleRows ?? []).some((row) => {
        const slug = (row.roles as { slug?: string })?.slug
        return slug != null && ADMIN_UPLOAD_ROLE_SET.has(slug)
      })
    }
    return { isStaff: staff }
  }, [refreshStaff])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      navigate('/', { replace: true })
      return
    }
    await supabase.auth.signOut()
    setSession(null)
    setIsStaff(false)
    setIsStudent(false)
    setIsTmvsMember(false)
    navigate('/', { replace: true })
  }, [navigate])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<SignUpResult> => {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error(SERVICE_UNAVAILABLE_MESSAGE)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      if (data.session) {
        setSession(data.session)
        setRolesLoading(true)
        try {
          await refreshStaff()
        } finally {
          setRolesLoading(false)
        }
        return { needsEmailConfirmation: false }
      }
      return { needsEmailConfirmation: true }
    },
    [refreshStaff],
  )

  const value = useMemo(
    () => ({
      configured,
      session,
      isStaff,
      isStudent,
      isTmvsMember,
      loading,
      rolesLoading,
      signIn,
      signUp,
      signOut,
      refreshStaff,
    }),
    [
      configured,
      session,
      isStaff,
      isStudent,
      isTmvsMember,
      loading,
      rolesLoading,
      signIn,
      signUp,
      signOut,
      refreshStaff,
    ],
  )

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export function useStaff() {
  const ctx = useContext(StaffContext)
  if (!ctx) throw new Error('useStaff must be used within StaffProvider')
  return ctx
}