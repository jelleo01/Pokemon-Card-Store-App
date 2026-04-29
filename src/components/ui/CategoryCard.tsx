import Sprite, { type SpriteKind } from './Sprite'
import { gbStyles } from '@/lib/gbStyles'

interface CategoryCardProps {
  active: boolean
  onClick: () => void
  icon: SpriteKind
  title: string
  en: string
  sub: string
}

export default function CategoryCard({ active, onClick, icon, title, en, sub }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: 10,
        cursor: 'pointer',
        textAlign: 'left',
        border: '2px solid #111',
        background: active ? '#D9D7CF' : 'var(--paper)',
        color: '#111',
        boxShadow: active ? '1px 1px 0 0 #111' : '3px 3px 0 0 #111',
        transform: active ? 'translate(2px, 2px)' : 'translate(0, 0)',
        fontFamily: gbStyles.font,
        transition: 'transform 60ms, box-shadow 60ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Sprite kind={icon} size={18} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span
          style={{
            fontSize: 9,
            opacity: 0.6,
            fontFamily: gbStyles.fontEn,
            letterSpacing: 2,
          }}
        >
          {en}
        </span>
      </div>
      <div style={{ fontSize: 10, opacity: 0.8 }}>{sub}</div>
    </button>
  )
}
