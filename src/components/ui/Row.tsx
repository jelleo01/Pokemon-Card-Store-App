interface RowProps {
  k: string
  v: React.ReactNode
}

export default function Row({ k, v }: RowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        fontSize: 11,
        padding: '3px 0',
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
      <div
        style={{
          flex: 1,
          fontWeight: 700,
          fontFamily: 'Geist, Galmuri11, monospace',
          wordBreak: 'keep-all',
        }}
      >
        {v}
      </div>
    </div>
  )
}
