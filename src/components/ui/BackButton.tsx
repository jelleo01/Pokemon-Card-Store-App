import { gbStyles } from '@/lib/gbStyles'

interface BackButtonProps {
  onClick: () => void
  glyph?: string
  width?: number
  height?: number
}

export default function BackButton({
  onClick,
  glyph = '◀',
  width = 26,
  height = 22,
}: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '2px solid #111',
        width,
        height,
        fontFamily: gbStyles.font,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {glyph}
    </button>
  )
}
