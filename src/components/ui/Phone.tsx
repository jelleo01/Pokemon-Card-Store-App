interface PhoneProps {
  children: React.ReactNode
}

export default function Phone({ children }: PhoneProps) {
  return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center p-4">
      <div
        className="relative bg-paper border-4 border-ink overflow-hidden"
        style={{ width: 360, minHeight: 780, borderRadius: 40 }}
      >
        {/* 노치 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-ink rounded-full z-10" />
        <div className="h-14" />
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
