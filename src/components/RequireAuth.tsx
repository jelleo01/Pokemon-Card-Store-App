import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  const here = location.pathname + location.search

  if (!user) {
    return (
      <Navigate
        to={`/auth-wall?redirect=${encodeURIComponent(here)}`}
        replace
      />
    )
  }

  if (!user.trainerId) {
    return (
      <Navigate
        to={`/onboarding?redirect=${encodeURIComponent(here)}`}
        replace
      />
    )
  }

  return <Outlet />
}
