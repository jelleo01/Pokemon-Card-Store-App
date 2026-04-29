import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
}

export default function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 9,
          color: 'var(--ink-2)',
          letterSpacing: 1,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
