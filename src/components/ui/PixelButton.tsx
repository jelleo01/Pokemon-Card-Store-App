import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { gbStyles } from '@/lib/gbStyles'

interface PixelButtonProps {
  children?: ReactNode
  color?: string
  bg?: string
  fg?: string
  full?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
  sm?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function PixelButton({
  children,
  color = '#111',
  bg = '#FAFAF7',
  fg,
  full,
  onClick,
  style,
  sm,
  type = 'button',
  disabled = false,
}: PixelButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: gbStyles.font,
        fontSize: sm ? 11 : 13,
        color: fg || color,
        background: bg,
        border: `2px solid ${color}`,
        padding: sm ? '5px 10px' : '8px 14px',
        width: full ? '100%' : undefined,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: `3px 3px 0 0 ${color}`,
        transition: 'transform 60ms, box-shadow 60ms',
        imageRendering: 'pixelated',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onMouseDown={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translate(2px,2px)'
        e.currentTarget.style.boxShadow = `1px 1px 0 0 ${color}`
      }}
      onMouseUp={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translate(0,0)'
        e.currentTarget.style.boxShadow = `3px 3px 0 0 ${color}`
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translate(0,0)'
        e.currentTarget.style.boxShadow = `3px 3px 0 0 ${color}`
      }}
    >
      {children}
    </button>
  )
}
