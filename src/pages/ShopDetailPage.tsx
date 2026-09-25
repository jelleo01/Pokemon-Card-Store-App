import { usePlaceSummaries } from '@/hooks/usePlaceSummaries'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'
import PostCard from '@/components/ui/PostCard'
import PointsBadge from '@/components/ui/PointsBadge'
import ShareButton from '@/components/ui/ShareButton'
import { SHOPS, type Post } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import { supabase } from '@/lib/supabase'
import { usePoints } from '@/hooks/usePoints'

interface PlaceDetails {
  expires_at: string
  place: { name: string; addr: string; type: string; hours: string | null }
  posts: { id: string; body: string; category: 'news' | 'ask'; who: string; created_at: string; hearts_count: number; comments_count: number }[]
}

// Each screen uses an idempotent request ID. The server reuses a valid
// seven-day unlock across screens and devices.
export default function ShopDetailPage() {
  const { id = '' } = useParams()
  return <PlaceVisit key={id} id={id} />
}

function PlaceVisit({ id }: { id: string }) {
  const navigate = useNavigate()
  const { balance, error: pointsError, notifyTransaction } = usePoints()
  const { data: summaries, isError: summaryError, refetch: retrySummary } = usePlaceSummaries()
  const summary = summaries?.[id]
  const unlocked = !!summary?.expires_at && new Date(summary.expires_at).getTime() > Date.now()
  const preview = SHOPS.find(s => s.id === id)
  const requestId = useRef(crypto.randomUUID())
  const inFlight = useRef(false)
  const alive = useRef(true)
  const [paid, setPaid] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const validId = !!preview || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  async function openDetails() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setAttempted(true)
    setError('')
    try {
      if (!paid) {
        const { error } = await supabase.rpc('card_open_place', { place_key: id, request_id: requestId.current })
        if (error) throw error
        if (alive.current) setPaid(true)
        await notifyTransaction(`visit:${requestId.current}`, '장소 정보 7일 열람')
      }
      const { data, error } = await supabase.rpc('card_place_details', { visit_id: requestId.current })
      if (error) throw error
      if (alive.current) setDetails(data as PlaceDetails)
    } catch (e) {
      const message = typeof e === 'object' && e !== null && 'message' in e ? String(e.message) : ''
      if (message.includes('PLACE_ACCESS_EXPIRED')) {
        requestId.current = crypto.randomUUID()
        if (alive.current) { setPaid(false); setAttempted(false); setDetails(null) }
      }
      if (alive.current) setError(message.includes('PLACE_ACCESS_EXPIRED') ? '열람 기간이 끝났어요. 5 P를 사용하면 다시 7일 동안 볼 수 있어요.' : message.includes('INSUFFICIENT_POINTS') ? '포인트가 부족해요. 소식이나 댓글을 남겨 포인트를 모아보세요.'
        : message.includes('PLACE_NOT_FOUND') ? '매장을 찾을 수 없어요. 포인트는 차감되지 않았어요.'
        : '정보를 불러오지 못했어요. 다시 시도해 주세요. 같은 화면에서 재시도해도 중복 차감되지 않아요.')
    } finally {
      inFlight.current = false
      if (alive.current) setBusy(false)
    }
  }

  return <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', fontFamily: gbStyles.font, color: 'var(--ink)' }}>
    <header style={{ padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 12px', borderBottom: '2px solid #111', display: 'flex', gap: 12, alignItems: 'center' }}>
      <BackButton onClick={() => navigate('/map')} />
      <b style={{ flex: 1 }}>{details?.place.name ?? preview?.name ?? '장소 정보'}</b>
      <PointsBadge />
    </header>
    <main style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!validId ? <p>매장을 찾을 수 없어요.</p> : <>
        <ShareButton placeId={id} title={details?.place.name ?? preview?.name} />
        {!details && <PixelBorder padding={18}>
          <h2 style={{ fontSize: 18 }}>{paid ? '정보 불러오기' : '장소 상세 정보 열기'}</h2>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>{paid ? '추가 차감 없이 다시 불러올 수 있어요.' : unlocked ? `이미 열람 중이에요. ${new Date(summary!.expires_at!).toLocaleString('ko-KR')}까지 무료로 볼 수 있어요.` : '5 P를 사용하면 이 장소의 정보와 최신 소식을 1주일(7일) 동안 자유롭게 볼 수 있어요.'}</p>
          <p style={{ marginTop: 16, fontWeight: 700 }}>카드 소식 {summaryError ? '확인 실패' : !summaries ? '확인 중…' : `${summary?.news_count ?? 0}건`}</p>
          {summaries && !summary?.news_count && <p style={{ fontSize: 13, marginTop: 8 }}>아직 등록된 카드 소식이 없어요. 결제 전 확인해 주세요.</p>}
          <div style={{ margin: '20px 0 28px' }}><PixelButton sm onClick={() => navigate('/points')}>포인트 규칙 보기 ↗</PixelButton></div>
          {summaryError && <div style={{ marginBottom: 20 }}><PixelButton onClick={() => void retrySummary()}>소식 수 다시 확인</PixelButton></div>}
          {pointsError && <p role="alert">포인트를 불러오지 못했어요. 위 포인트 버튼으로 다시 시도해 주세요.</p>}
          <PixelButton full disabled={busy || (!paid && !unlocked && (!summaries || summaryError)) || (!paid && !unlocked && !attempted && (balance === undefined || balance < 5))} onClick={openDetails}>
            {busy ? '불러오는 중…' : paid ? '다시 불러오기 (추가 차감 없음)' : unlocked ? '열람하기 (추가 차감 없음)' : attempted ? '같은 요청 다시 시도 (총 5 P)' : balance !== undefined && balance < 5 ? '포인트 부족' : '5 P 사용하고 7일 열람'}
          </PixelButton>
          <div style={{ marginTop: 16 }}><PixelButton full onClick={() => navigate(`/post?shopId=${encodeURIComponent(id)}`)}>소식 남기고 +3 P</PixelButton></div>
        </PixelBorder>}
        {error && <p role="alert" style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        {details && <>
          <PixelBorder padding={14}>
            <b>{details.place.name}</b>
            <p style={{ fontSize: 12, marginTop: 12 }}>{new Date(details.expires_at).toLocaleString('ko-KR')}까지 열람 가능</p>
            <p>{details.place.type} · {details.place.addr}</p>
            {details.place.hours && <p>영업시간: {details.place.hours}</p>}
            <PixelButton sm disabled={busy} onClick={openDetails}>↻ 새로고침 (무료)</PixelButton>
          </PixelBorder>
          <b>최신 소식 · {details.posts.length}건</b>
          {details.posts.length === 0 && <p>아직 소식이 없어요. 첫 소식을 남겨보세요!</p>}
          {details.posts.map(row => {
            const post: Post = { id: row.id, who: row.who, loc: details.place.name, dong: '',
              t: row.body.split('\n')[0].slice(0, 40), body: row.body, tag: row.category === 'news' ? '소식' : '질문',
              mins: Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000)),
              hearts: row.hearts_count ?? 0,
              comments: Array.from({ length: row.comments_count ?? 0 }, () => ({ who: '', t: '', mins: 0 })) }
            return <PostCard key={row.id} p={post} onClick={() => navigate(`/post/${row.id}`)} />
          })}
          <PixelButton onClick={() => navigate(`/post?shopId=${encodeURIComponent(id)}`)}>✎ 카드 소식 남기기 +3 P</PixelButton>
        </>}
      </>}
    </main>
  </div>
}
