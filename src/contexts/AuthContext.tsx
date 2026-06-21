import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'

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
  // 프로필은 핵심 — 실패하면 user 자체가 null 됨 (호출자가 catch).
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('trainer_id, phone, city, district, notif_news, notif_comment, marketing_opt_in')
    .eq('id', session.user.id)
    .maybeSingle()
  if (profileErr) {
    // not-found 는 maybeSingle 이 data=null 로 처리하므로 여기 도달하는 건 네트워크/스키마 문제
    console.warn('[Auth] profile fetch error', profileErr)
  }

  // is_admin RPC 는 별도 try — 실패해도 isAdmin=false 로 폴백, 로그인 자체는 유지
  let isAdmin = false
  try {
    const { data: adminData, error: adminErr } = await supabase.rpc('is_admin', {
      uid: session.user.id,
    })
    if (adminErr) {
      console.warn('[Auth] is_admin RPC error', adminErr)
    } else {
      isAdmin = !!adminData
    }
  } catch (e) {
    console.warn('[Auth] is_admin RPC threw', e)
  }

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
      // OAuth 콜백으로 세션이 생기면 인앱 브라우저 닫기
      if (s) Browser.close().catch(() => {})
    })

    // iOS 딥링크 콜백 처리 (com.jelleo01.pokemonmap://login-callback#...)
    let appUrlSub: { remove: () => void } | null = null
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('com.jelleo01.pokemonmap://')) return
        const hashPart = url.split('#')[1] ?? ''
        const params = new URLSearchParams(hashPart)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        }
      }).then(l => { appUrlSub = l })
    }

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
      appUrlSub?.remove()
    }
  }, [loadSession])

  async function signInWithGoogle() {
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.jelleo01.pokemonmap://login-callback',
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error
      if (data.url) await Browser.open({ url: data.url })
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
        },
      })
      if (error) throw error
    }
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
