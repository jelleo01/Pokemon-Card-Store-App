import { useEffect, useRef, useState } from 'react'
import PixelBorder from './PixelBorder'
import PixelButton from './PixelButton'

export default function PointNotifications() {
  const dialog = useRef<HTMLDivElement>(null)
  const [queue, setQueue] = useState<{ amount: number; label: string }[]>([])
  useEffect(() => {
    const receive = (event: Event) => setQueue(q => [...q, (event as CustomEvent).detail])
    window.addEventListener('points-notice', receive)
    return () => window.removeEventListener('points-notice', receive)
  }, [])
  const current = queue[0]
  useEffect(() => {
    if (!current) return
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector('button')?.focus()
    return () => previous?.focus()
  }, [current])
  if (!current) return null
  return <div ref={dialog} onKeyDown={e => { if (e.key === 'Escape') setQueue(q => q.slice(1)); if (e.key === 'Tab') { e.preventDefault(); dialog.current?.querySelector('button')?.focus() } }} role="dialog" aria-modal="true" aria-label="포인트 알림" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0008', display: 'grid', placeItems: 'center', padding: 24 }}>
    <PixelBorder padding={24} style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>{current.amount > 0 ? '+' : '−'}{Math.abs(current.amount)} P</div>
      <p style={{ marginBottom: 8 }}>{current.amount > 0 ? '포인트가 적립되었어요!' : '포인트를 사용했어요.'}</p>
      {current.label && <p style={{ fontSize: 13, marginBottom: 24 }}>{current.label}</p>}
      <PixelButton full onClick={() => setQueue(q => q.slice(1))}>확인</PixelButton>
    </PixelBorder>
  </div>
}
