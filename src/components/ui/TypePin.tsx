import type { ShopType } from '@/lib/data'

interface TypePinProps {
  type: ShopType
  size?: number
  active?: boolean
}

export default function TypePin({ type, size = 14, active }: TypePinProps) {
  const fg = active ? '#FAFAF7' : '#111'
  const bg = active ? '#111' : '#FAFAF7'
  const accent = '#E63946'

  if (type === '공식') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="0" y="0" width="10" height="10" fill={fg} />
        <rect x="1" y="1" width="8" height="8" fill={accent} />
        <rect x="3" y="3" width="4" height="4" fill={bg} />
      </svg>
    )
  }
  if (type === '자판기') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="1" y="0" width="8" height="10" fill={fg} />
        <rect x="2" y="1" width="6" height="3" fill={accent} />
        <rect x="2" y="5" width="6" height="1" fill={bg} />
        <rect x="2" y="7" width="6" height="1" fill={bg} />
      </svg>
    )
  }
  if (type === '편의점') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect x="0" y="2" width="10" height="6" fill={fg} />
        <rect x="1" y="3" width="8" height="4" fill={bg} />
        <rect x="0" y="1" width="10" height="1" fill={accent} />
      </svg>
    )
  }
  // 카드샵
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges">
      <rect x="2" y="0" width="6" height="10" fill={fg} />
      <rect x="3" y="1" width="4" height="3" fill={accent} />
      <rect x="3" y="5" width="4" height="1" fill={bg} />
      <rect x="3" y="7" width="3" height="1" fill={bg} />
    </svg>
  )
}
