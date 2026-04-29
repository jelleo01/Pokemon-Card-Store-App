import { useNavigate, useSearchParams } from 'react-router-dom'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { gbStyles } from '@/lib/gbStyles'

export default function AuthWallPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const what = redirect === '/post' ? 'post' : 'community'
  const msg =
    what === 'community'
      ? '커뮤니티는 로그인 후 이용할 수 있어요.'
      : '글쓰기는 로그인 후 이용할 수 있어요.'

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        fontFamily: gbStyles.font,
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          padding: '12px 14px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackButton onClick={() => navigate('/map')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            SIGN IN
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Sprite kind="mega" size={48} />
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>{msg}</div>
        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>
          지도 보기는 로그인 없이도 가능해요.
          <br />
          커뮤니티 활동을 위해 가입해 주세요.
        </div>
        <div
          style={{
            width: '100%',
            maxWidth: 220,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <PixelButton
            full
            color="#111"
            bg="var(--red)"
            fg="#FAFAF7"
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
          >
            로그인 / 가입 ▶
          </PixelButton>
          <PixelButton full color="#111" bg="var(--paper)" onClick={() => navigate('/map')}>
            지도로 돌아가기
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
