import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/hooks/usePoints'
import { supabase } from '@/lib/supabase'
import PixelBorder from './PixelBorder'
import PixelButton from './PixelButton'

export default function AppFeedback() {
  const { user } = useAuth()
  const { notifyTransaction } = usePoints()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [headline, setHeadline] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const existing = useQuery({
    queryKey: ['app-feedback', user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_app_feedback').select('rating, headline, feedback').eq('user_id', user!.id).maybeSingle()
      if (error) throw error
      return data
    }, retry: 1,
  })
  async function submit() {
    if (busy || saved || existing.data) return
    setBusy(true); setError('')
    try {
      const { error } = await supabase.rpc('card_submit_feedback', { stars: rating, summary: headline.trim(), details: feedback.trim() })
      if (error) throw error
      setSaved(true)
      await notifyTransaction('app_feedback', '앱 사용 후기 감사합니다!')
      void existing.refetch()
    } catch { setError('후기를 저장하지 못했어요. 입력 내용은 남아 있어요. 다시 시도해 주세요.') }
    finally { setBusy(false) }
  }
  const inputStyle = { width: '100%', padding: 10, border: '2px solid #111', background: 'var(--paper)', fontSize: 14, marginTop: 8 }
  return <PixelBorder padding={16} style={{ flexShrink: 0, margin: '8px 0 20px' }}>
    <b>앱 사용 후기</b>
    <p style={{ fontSize: 12, lineHeight: 1.8, margin: '8px 0 16px' }}>별점과 한줄평, 피드백을 남겨 주세요.<br />별점에 관계없이 최초 1회 <b>+15 P</b> · 운영자에게만 전달돼요.</p>
    {saved || existing.data ? <div role="status"><b>후기를 남겨 주셔서 감사합니다!</b>{existing.data && <p style={{ marginTop: 8, fontSize: 13 }}>{'★'.repeat(existing.data.rating)} · {existing.data.headline}</p>}</div>
      : existing.isError ? <PixelButton onClick={() => void existing.refetch()}>후기 상태 다시 확인</PixelButton>
      : !open ? <PixelButton full disabled={existing.isPending} onClick={() => setOpen(true)}>{existing.isPending ? '확인 중…' : '사용 후기 남기고 +15 P'}</PixelButton>
      : <form onSubmit={e => { e.preventDefault(); void submit() }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <fieldset disabled={busy}><legend>별점 (5점 만점)</legend><div role="radiogroup" aria-label="별점" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map(star => <button type="button" role="radio" aria-checked={rating === star} aria-label={`${star}점`} key={star} onClick={() => setRating(star)} style={{ fontSize: 30, color: star <= rating ? '#a55d00' : '#777', padding: 4 }}>{star <= rating ? '★' : '☆'}</button>)}
        </div></fieldset>
        <label>한줄평<input required disabled={busy} value={headline} onChange={e => setHeadline(e.target.value)} minLength={2} maxLength={100} placeholder="앱을 써 보니 어떠셨나요?" style={inputStyle} /></label>
        <label>피드백<textarea required disabled={busy} value={feedback} onChange={e => setFeedback(e.target.value)} minLength={5} maxLength={2000} placeholder="좋았던 점이나 개선할 점을 5자 이상 알려 주세요." rows={4} style={inputStyle} /></label>
        {error && <p role="alert" style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <PixelButton type="submit" full disabled={busy || !rating || headline.trim().length < 2 || feedback.trim().length < 5}>{busy ? '저장 중…' : '제출하고 +15 P'}</PixelButton>
      </form>}
  </PixelBorder>
}
