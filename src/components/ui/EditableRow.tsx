import { gbStyles } from '@/lib/gbStyles'

interface EditableRowProps {
  k: string
  v: string
  editing: boolean
  onChange: (value: string) => void
}

export default function EditableRow({ k, v, editing, onChange }: EditableRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        padding: '4px 0',
        borderBottom: '1px dashed rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          width: 56,
          color: 'var(--ink-2)',
          letterSpacing: 1,
          fontSize: 10,
          flexShrink: 0,
        }}
      >
        {k}
      </div>
      {editing ? (
        <input
          value={v}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '3px 6px',
            border: '2px solid #111',
            background: 'var(--paper)',
            fontFamily: gbStyles.font,
            fontSize: 11,
            fontWeight: 700,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{ flex: 1, fontWeight: 700 }}>{v}</div>
      )}
    </div>
  )
}
