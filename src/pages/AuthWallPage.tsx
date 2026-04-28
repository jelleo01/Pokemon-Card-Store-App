import { useNavigate, useSearchParams } from 'react-router-dom'

export default function AuthWallPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') ?? '/'

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 font-galmuri px-6">
      <div className="text-4xl">🔒</div>
      <p className="text-lg font-bold text-ink text-center">트레이너 등록이 필요해요</p>
      <p className="text-sm text-ink-2 text-center">로그인 후 이용할 수 있어요</p>
      <button
        onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
        className="w-full max-w-xs py-3 bg-red text-white font-bold border-2 border-ink active:translate-y-0.5"
      >
        로그인
      </button>
      <button
        onClick={() => navigate('/')}
        className="w-full max-w-xs py-3 bg-paper-2 text-ink font-bold border-2 border-ink active:translate-y-0.5"
      >
        둘러보기
      </button>
    </div>
  )
}
