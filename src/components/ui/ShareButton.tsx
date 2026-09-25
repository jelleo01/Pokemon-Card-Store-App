import { useState } from 'react'
import { shareApp, shareUrl } from '@/lib/share'
import PixelButton from './PixelButton'

export default function ShareButton({ placeId, title }: { placeId?: string; title?: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [fallback, setFallback] = useState('')
  async function handleShare() {
    if (busy) return
    setBusy(true)
    setMessage('')
    setFallback('')
    try {
      const result = await shareApp(placeId, title)
      setMessage(result === 'copied' ? '링크를 복사했어요!' : '')
    } catch {
      setMessage('아래 링크를 복사해 공유해 주세요.')
      try { setFallback(shareUrl(placeId)) } catch { setMessage('공유 주소를 확인해 주세요.') }
    } finally { setBusy(false) }
  }
  return <div>
    <PixelButton sm onClick={handleShare} disabled={busy}>↗ {placeId ? '장소 공유' : '앱 공유'}</PixelButton>
    {message && <div role="status" style={{ fontSize: 12, marginTop: 8 }}>{message}</div>}
    {fallback && <input aria-label="공유 링크" readOnly value={fallback} onFocus={e => e.target.select()} style={{ width: '100%', marginTop: 6 }} />}
  </div>
}
