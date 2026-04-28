import type { InputHTMLAttributes } from 'react'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function PixelInput({ label, error, className = '', ...props }: PixelInputProps) {
  return (
    <div className="flex flex-col gap-1 font-galmuri">
      {label && <label className="text-sm font-bold text-ink">{label}</label>}
      <input
        className={`border-2 border-ink bg-paper px-3 py-2 text-ink text-sm outline-none focus:border-red transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
}
