import { useNavigate } from 'react-router-dom'
import Sprite, { type SpriteKind } from './Sprite'
import { gbStyles } from '@/lib/gbStyles'
import { useAuth } from '@/contexts/AuthContext'

export type Tab = 'home' | 'map' | 'community'

interface GBTabBarProps {
  active: Tab
}

const items: { id: Tab; label: string; kind: SpriteKind; path: string; needsAuth?: boolean }[] = [
  { id: 'home', label: 'HOME', kind: 'ball', path: '/' },
  { id: 'map', label: 'MAP', kind: 'map', path: '/map' },
  { id: 'community', label: 'COMMUNITY', kind: 'mega', path: '/community', needsAuth: true },
]

export default function GBTabBar({ active }: GBTabBarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        padding: '8px 10px 14px',
        borderTop: '2px solid #111',
        background: 'var(--paper)',
        flexShrink: 0,
      }}
    >
      {items.map((it) => {
        const isActive = active === it.id
        return (
          <button
            key={it.id}
            onClick={() => {
              if (it.needsAuth && !user) {
                navigate(`/auth-wall?redirect=${encodeURIComponent(it.path)}`)
                return
              }
              navigate(it.path)
            }}
            style={{
              flex: 1,
              background: isActive ? '#111' : 'transparent',
              color: isActive ? '#FAFAF7' : '#111',
              border: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontFamily: gbStyles.font,
              fontSize: 9,
              letterSpacing: 0.5,
            }}
          >
            <Sprite kind={it.kind} size={22} dark={isActive} />
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
