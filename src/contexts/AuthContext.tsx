import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface TrainerUser {
  id: string                   // auth.users.id (uuid)
  email: string
  trainerId: string | null     // null = 온보딩 필요
  city: string | null
  district: string | null
  phone: string | null
  notifNews: boolean
  notifComment: boolean
  marketingOptIn: boolean
  isAdmin: boolean
}

interface AuthContextValue {
  user: TrainerUser | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(session: Session): Promise<TrainerUser> {
  const [profileRes, adminRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('trainer_id, phone, city, district, notif_news, notif_comment, marketing_opt_in')
      .eq('id', session.user.id)
      .maybeSingle(),
    supabase.rpc('is_admin', { uid: session.user.id }),
  ])
  const profile = profileRes.data
  const isAdmin = adminRes.error ? false : !!adminRes.data

  return {
    id: session.user.id,
    email: session.user.email || '',
    trainerId: profile?.trainer_id ?? null,
    phone: profile?.phone ?? null,
    city: profile?.city ?? null,
    district: profile?.district ?? null,
    notifNews: profile?.notif_news ?? true,
    notifComment: profile?.notif_comment ?? true,
    marketingOptIn: profile?.marketing_opt_in ?? false,
    isAdmin,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TrainerUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async (s: Session | null) => {
    if (!s) {
      setSession(null)
      setUser(null)
      return
    }
    setSession(s)
    try {
      const u = await fetchProfile(s)
      setUser(u)
    } catch (err) {
      console.error('[Auth] fetchProfile failed', err)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      loadSession(data.session).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      loadSession(s)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadSession])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const refresh = useCallback(async () => {
    if (!session) return
    const u = await fetchProfile(session)
    setUser(u)
  }, [session])

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
