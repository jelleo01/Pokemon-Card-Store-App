import { createContext, useContext, useEffect, useState } from 'react'

export interface TrainerUser {
  id: string
  phone: string
  region: string
}

interface AuthContextValue {
  user: TrainerUser | null
  loading: boolean
  signIn: (user: TrainerUser) => void
  signOut: () => void
  updateUser: (patch: Partial<TrainerUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'trainer_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TrainerUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw) as TrainerUser)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  function signIn(next: TrainerUser) {
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  function updateUser(patch: Partial<TrainerUser>) {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
