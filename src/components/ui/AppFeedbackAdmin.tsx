import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import PixelBorder from './PixelBorder'
import PixelButton from './PixelButton'

export default function AppFeedbackAdmin() {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['admin-feedback', user?.id, page], enabled: !!user?.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_app_feedback')
        .select('user_id, rating, headline, feedback, created_at').order('created_at', { ascending: false })
        .range(page * 20, page * 20 + 20)
      if (error) throw error
      return data as { user_id: string; rating: number; headline: string; feedback: string; created_at: string }[]
    },
  })
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <b>앱 사용 후기</b>
    {isPending && <p>불러오는 중…</p>}
    {isError && <PixelButton onClick={() => void refetch()}>후기 다시 불러오기</PixelButton>}
    {data?.length === 0 && <p>등록된 후기가 없어요.</p>}
    {data?.slice(0, 20).map(row => <PixelBorder key={row.user_id} padding={14}>
      <b>{'★'.repeat(row.rating)} ({row.rating}/5) · {row.headline}</b>
      {row.feedback !== row.headline && <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '12px 0', lineHeight: 1.8 }}>{row.feedback}</p>}
      <time style={{ fontSize: 12, opacity: .6 }}>{new Date(row.created_at).toLocaleString('ko-KR')}</time>
    </PixelBorder>)}
    <div style={{ display: 'flex', gap: 12 }}><PixelButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</PixelButton><PixelButton disabled={!data || data.length <= 20} onClick={() => setPage(p => p + 1)}>다음</PixelButton></div>
  </div>
}
