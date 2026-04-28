import type { ButtonHTMLAttributes } from 'react'

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function PixelButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: PixelButtonProps) {
  const base = 'font-galmuri font-bold border-2 border-ink active:translate-y-0.5 transition-transform duration-75 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-red text-white hover:bg-red-2',
    secondary: 'bg-paper-2 text-ink hover:bg-paper',
    ghost: 'bg-transparent text-ink border-transparent hover:bg-paper-2',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg w-full',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
