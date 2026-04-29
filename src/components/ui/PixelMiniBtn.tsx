import type { ReactNode } from 'react'
import { gbStyles } from '@/lib/gbStyles'

interface PixelMiniBtnProps {
  children: ReactNode
  onClick?: () => void
}

export default function PixelMiniBtn({ children, onClick }: PixelMiniBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px',
        border: '2px solid #111',
        background: 'var(--paper)',
        cursor: 'pointer',
        fontFamily: gbStyles.font,
        fontSize: 10,
      }}
    >
      {children}
    </button>
  )
}
