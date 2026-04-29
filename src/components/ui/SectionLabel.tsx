import { gbStyles } from '@/lib/gbStyles'

interface SectionLabelProps {
  n: string
  label: string
}

export default function SectionLabel({ n, label }: SectionLabelProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <span
        style={{
          fontSize: 11,
          padding: '2px 7px',
          background: '#111',
          color: '#FAFAF7',
          letterSpacing: 1,
          fontFamily: gbStyles.fontEn,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
    </div>
  )
}
