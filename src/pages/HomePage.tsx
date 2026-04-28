import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GBTabBar from '@/components/ui/GBTabBar'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const location = localStorage.getItem('user_location') ?? '위치 미설정'

  function goWithAuth(path: string) {
    if (!user) {
      navigate(`/auth-wall?redirect=${encodeURIComponent(path)}`)
    } else {
      navigate(path)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-paper font-galmuri">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b-2 border-ink">
        <span className="font-bold text-lg text-red">트레이너 맵</span>
        <button
          onClick={() => navigate('/location')}
          className="text-sm text-ink-2 underline"
        >
          {location} ▼
        </button>
        <button
          onClick={() => user ? navigate('/profile') : navigate('/login')}
          className="text-xl"
        >
          👤
        </button>
      </header>

      {/* 메인 메뉴 */}
      <main className="flex-1 flex flex-col gap-3 px-4 py-6">
        <button
          onClick={() => navigate('/map')}
          className="w-full py-5 border-2 border-ink bg-paper-2 text-left px-5 font-bold text-base active:translate-y-0.5 transition-transform"
        >
          🗺 매장 찾기
        </button>
        <button
          onClick={() => goWithAuth('/post')}
          className="w-full py-5 border-2 border-ink bg-paper-2 text-left px-5 font-bold text-base active:translate-y-0.5 transition-transform"
        >
          ✏️ 글쓰기
        </button>
        <button
          onClick={() => goWithAuth('/community')}
          className="w-full py-5 border-2 border-ink bg-paper-2 text-left px-5 font-bold text-base active:translate-y-0.5 transition-transform"
        >
          📣 커뮤니티
        </button>

        {/* 위치 박스 */}
        <div className="mt-2 flex items-center justify-between border-2 border-ink px-4 py-3 bg-paper">
          <span className="text-sm">현재 위치: <strong>{location}</strong></span>
          <button
            onClick={() => navigate('/location')}
            className="text-xs border border-ink px-2 py-1"
          >
            변경
          </button>
        </div>

        {/* 통계 스트립 */}
        <div className="border-2 border-ink px-4 py-3 bg-red-soft text-sm text-center">
          이번 주 <strong>23건</strong> 신상 입고 · <strong>14명</strong> 활동
        </div>
      </main>

      <GBTabBar active="home" />
    </div>
  )
}
