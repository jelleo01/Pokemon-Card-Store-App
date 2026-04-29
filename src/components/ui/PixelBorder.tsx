import type { CSSProperties, ReactNode, MouseEventHandler } from 'react'

interface PixelBorderProps {
  children?: ReactNode
  style?: CSSProperties
  color?: string
  bg?: string
  padding?: number
  onClick?: MouseEventHandler<HTMLDivElement>
}

export default function PixelBorder({
  children,
  style,
  color = '#111',
  bg = '#FAFAF7',
  padding = 12,
  onClick,
}: PixelBorderProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: bg,
        padding,
        boxShadow: `inset 0 0 0 2px ${color}, 0 2px 0 0 ${color}`,
        clipPath: `polygon(
          2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
          100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
          2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px),
          0 2px, 2px 2px
        )`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
