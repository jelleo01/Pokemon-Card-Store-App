import type { ReactNode, MouseEventHandler } from 'react'
import { gbStyles } from '@/lib/gbStyles'

interface MapControlProps {
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  top?: number | string
  bottom?: number | string
  right?: number | string
}

export default function MapControl({ children, onClick, top, bottom, right }: MapControlProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        right,
        top,
        bottom,
        width: 30,
        height: 30,
        padding: 0,
        background: 'var(--paper)',
        border: '2px solid #111',
        cursor: 'pointer',
        boxShadow: '2px 2px 0 0 #111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: gbStyles.font,
        fontSize: 14,
        fontWeight: 700,
        zIndex: 20,
      }}
    >
      {children}
    </button>
  )
}
