interface PixelBorderProps {
  children: React.ReactNode
  className?: string
}

export default function PixelBorder({ children, className = '' }: PixelBorderProps) {
  return (
    <div className={`border-2 border-ink ${className}`}>
      {children}
    </div>
  )
}
