import type { ReactNode } from 'react'
import { gbStyles } from '@/lib/gbStyles'

interface FieldProps {
  label: string
  children: ReactNode
}

export default function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--ink-2)',
          letterSpacing: 0.5,
          marginBottom: 4,
          fontFamily: gbStyles.fontReadable,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
