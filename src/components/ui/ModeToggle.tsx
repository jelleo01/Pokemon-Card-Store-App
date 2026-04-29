import type { ReactNode } from 'react'
import { gbStyles } from '@/lib/gbStyles'

interface ModeToggleProps {
  children: ReactNode
  active: boolean
  onClick: () => void
}

export default function ModeToggle({ children, active, onClick }: ModeToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 10px',
        cursor: 'pointer',
        border: '2px solid #111',
        background: active ? '#D9D7CF' : 'var(--paper)',
        color: '#111',
        boxShadow: active ? '1px 1px 0 0 #111' : '3px 3px 0 0 #111',
        transform: active ? 'translate(2px, 2px)' : 'translate(0, 0)',
        fontFamily: gbStyles.font,
        fontSize: 11,
        fontWeight: 700,
        transition: 'transform 60ms, box-shadow 60ms',
      }}
    >
      {children}
    </button>
  )
}
