import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'

const reasons: Record<string, string> = { welcome: '가입 선물', welcome_adjustment: '가입 선물 20 P 조정', report: '매장 소식', question: '질문 작성', comment: '댓글·답변', like: '좋아요', place_open: '장소 7일 열람', feedback: '앱 사용 후기' }
export default function PointsHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['points', 'history', user?.id, page], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_point_entries').select('id, amount, reason, created_at')
        .eq('user_id', user!.id).order('id', { ascending: false }).range(page * 20, page * 20 + 20)
      if (error) throw error
      return data as { id: number; amount: number; reason: string; created_at: string }[]
    },
  })
  return <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
    <header style={{ padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '2px solid #111' }}><BackButton onClick={() => navigate(-1)} /><b>포인트 기록</b></header>
    <main style={{ padding: 20, overflowY: 'auto' }}>
      {isPending && <p>기록을 불러오는 중…</p>}
      {isError && <div role="alert">기록을 불러오지 못했어요. <PixelButton onClick={() => void refetch()}>다시 시도</PixelButton></div>}
      {data?.length === 0 && <p>아직 포인트 기록이 없어요.</p>}
      {data?.slice(0, 20).map(entry => <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px dashed #aaa' }}>
        <div style={{ flex: 1 }}><b>{reasons[entry.reason] ?? entry.reason}</b><div style={{ fontSize: 12, opacity: .65, marginTop: 6 }}>{new Date(entry.created_at).toLocaleString('ko-KR')}</div></div>
        <b style={{ color: entry.amount > 0 ? '#187435' : 'var(--red)' }}>{entry.amount > 0 ? '+' : ''}{entry.amount} P</b>
      </div>)}
      <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}><PixelButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</PixelButton><span>{page + 1}</span><PixelButton disabled={!data || data.length <= 20} onClick={() => setPage(p => p + 1)}>다음</PixelButton></nav>
    </main>
  </div>
}
