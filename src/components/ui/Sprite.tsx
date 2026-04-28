type SpriteType = 'pokeball' | 'shop' | 'card' | 'person'

interface SpriteProps {
  type: SpriteType
  size?: number
  className?: string
}

const sprites: Record<SpriteType, string> = {
  pokeball: '⚪',
  shop: '🏪',
  card: '🃏',
  person: '👤',
}

export default function Sprite({ type, size = 24, className = '' }: SpriteProps) {
  return (
    <span
      className={`inline-block pix ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={type}
    >
      {sprites[type]}
    </span>
  )
}
