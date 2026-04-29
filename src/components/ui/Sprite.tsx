// Pixel-art SVG icons mirroring version-gameboy.jsx Sprite.

export type SpriteKind = 'ball' | 'card' | 'map' | 'mega' | 'person' | 'shop'

interface SpriteProps {
  kind?: SpriteKind
  size?: number
  dark?: boolean
}

export default function Sprite({ kind = 'ball', size = 22, dark = false }: SpriteProps) {
  const fg = dark ? '#FAFAF7' : '#111'
  const accent = '#E63946'
  const paper = dark ? '#111' : '#FAFAF7'

  if (kind === 'ball') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="3" y="1" width="8" height="1" fill={fg} />
        <rect x="2" y="2" width="10" height="1" fill={fg} />
        <rect x="2" y="3" width="10" height="3" fill={accent} />
        <rect x="1" y="3" width="1" height="3" fill={fg} />
        <rect x="12" y="3" width="1" height="3" fill={fg} />
        <rect x="1" y="6" width="12" height="1" fill={fg} />
        <rect x="2" y="7" width="10" height="3" fill={paper} />
        <rect x="1" y="7" width="1" height="3" fill={fg} />
        <rect x="12" y="7" width="1" height="3" fill={fg} />
        <rect x="2" y="10" width="10" height="1" fill={fg} />
        <rect x="3" y="11" width="8" height="1" fill={fg} />
        <rect x="6" y="6" width="2" height="1" fill={fg} />
      </svg>
    )
  }
  if (kind === 'card') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="3" y="1" width="8" height="12" fill={paper} stroke={fg} strokeWidth="1" />
        <rect x="4" y="2" width="6" height="3" fill={accent} />
        <rect x="4" y="6" width="6" height="1" fill={fg} />
        <rect x="4" y="8" width="4" height="1" fill={fg} />
        <rect x="4" y="10" width="5" height="1" fill={fg} />
      </svg>
    )
  }
  if (kind === 'map') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="1" y="2" width="12" height="10" fill={paper} stroke={fg} strokeWidth="1" />
        <rect x="5" y="2" width="1" height="10" fill={fg} />
        <rect x="9" y="2" width="1" height="10" fill={fg} />
        <rect x="6" y="2" width="3" height="1" fill={fg} />
        <rect x="6" y="11" width="3" height="1" fill={fg} />
        <rect x="3" y="5" width="2" height="2" fill={accent} />
        <rect x="3" y="7" width="1" height="1" fill={fg} />
      </svg>
    )
  }
  if (kind === 'mega') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="9" y="4" width="1" height="6" fill={fg} />
        <rect x="7" y="3" width="2" height="8" fill={fg} />
        <rect x="8" y="4" width="1" height="6" fill={accent} />
        <rect x="2" y="5" width="5" height="4" fill={accent} />
        <rect x="1" y="5" width="1" height="4" fill={fg} />
        <rect x="2" y="4" width="5" height="1" fill={fg} />
        <rect x="2" y="9" width="5" height="1" fill={fg} />
        <rect x="11" y="3" width="1" height="1" fill={fg} />
        <rect x="12" y="5" width="1" height="1" fill={fg} />
        <rect x="11" y="6" width="1" height="2" fill={fg} />
        <rect x="12" y="8" width="1" height="1" fill={fg} />
        <rect x="11" y="10" width="1" height="1" fill={fg} />
      </svg>
    )
  }
  if (kind === 'person') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="5" y="2" width="4" height="4" fill={fg} />
        <rect x="6" y="3" width="2" height="2" fill={paper} />
        <rect x="3" y="7" width="8" height="5" fill={fg} />
        <rect x="4" y="8" width="6" height="3" fill={paper} />
        <rect x="2" y="11" width="10" height="1" fill={fg} />
      </svg>
    )
  }
  if (kind === 'shop') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" shapeRendering="crispEdges">
        <rect x="1" y="3" width="12" height="9" fill={paper} stroke={fg} strokeWidth="1" />
        <rect x="1" y="2" width="12" height="2" fill={accent} />
        <rect x="3" y="6" width="2" height="3" fill={fg} />
        <rect x="9" y="6" width="2" height="3" fill={fg} />
        <rect x="6" y="8" width="2" height="4" fill={fg} />
      </svg>
    )
  }
  return null
}
