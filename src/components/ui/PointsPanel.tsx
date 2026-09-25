import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import PixelBorder from './PixelBorder'
import PointsBadge from './PointsBadge'

const reasons: Record<string, string> = { welcome: '가입 선물', report: '매장 소식', comment: '댓글', like: '좋아요', place_open: '장소 정보 열람' }
export default function PointsPanel() {
  const { user } = useAuth()
  const { data, isError } = useQuery({
    queryKey: ['points', 'history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_point_entries')
        .select('id, amount, reason, created_at').eq('user_id', user!.id)
        .order('id', { ascending: false }).limit(10)
      if (error) throw error
      return data as { id: number; amount: number; reason: string; created_at: string }[]
    },
  })
  return <PixelBorder padding={12}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>내 포인트</b><PointsBadge /></div>
    <p style={{ fontSize: 12, lineHeight: 1.7 }}>가입 +10 P · 카드 소식 +3 P (재고 있음 / 없음 모두)<br />다른 사람의 소식에 댓글·첫 좋아요 +1 P<br />장소 상세 정보는 방문할 때마다 −5 P</p>
    {isError && <p role="alert">포인트 내역을 불러오지 못했어요.</p>}
    {data?.map(entry => <div key={entry.id} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '5px 0', borderTop: '1px dashed #aaa' }}>
      <span style={{ flex: 1 }}>{reasons[entry.reason] ?? entry.reason}</span>
      <time style={{ opacity: .6 }}>{new Date(entry.created_at).toLocaleDateString('ko-KR')}</time>
      <b>{entry.amount > 0 ? '+' : ''}{entry.amount} P</b>
    </div>)}
  </PixelBorder>
}
