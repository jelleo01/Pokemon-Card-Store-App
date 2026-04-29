import type { InputHTMLAttributes } from 'react'
import { gbStyles } from '@/lib/gbStyles'

type PixelInputProps = InputHTMLAttributes<HTMLInputElement>

export default function PixelInput(props: PixelInputProps) {
  const { style, ...rest } = props
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        padding: '6px 8px',
        border: '2px solid #111',
        background: 'var(--paper)',
        boxSizing: 'border-box',
        fontFamily: gbStyles.font,
        fontSize: 11,
        outline: 'none',
        ...style,
      }}
    />
  )
}
