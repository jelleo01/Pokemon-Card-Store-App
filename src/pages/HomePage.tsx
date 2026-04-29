import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import { gbStyles } from '@/lib/gbStyles'

export default function HomePage() {
  const { user } = useAuth()

  if (!user) return <Landing />

  return <SignedInHome />
}

function Landing() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
        background: 'var(--paper)',
        fontFamily: gbStyles.font,
        color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Sprite kind="ball" size={64} />
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            fontFamily: gbStyles.fontEn,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          POKEMON
          <br />
          CARDS
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, textAlign: 'center' }}>
          트레이너 카드샵 맵 · 베타
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <PixelButton
          full
          color="#111"
          bg="var(--red)"
          fg="#FAFAF7"
          onClick={() => navigate('/map')}
        >
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
          >
            <Sprite kind="map" size={18} dark /> <span>지도 찾기 / FIND ON MAP</span>
          </span>
        </PixelButton>
        <PixelButton full color="#111" bg="var(--paper)" onClick={() => navigate('/login')}>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
          >
            <Sprite kind="person" size={18} /> <span>로그인 / SIGN IN</span>
          </span>
        </PixelButton>
      </div>
    </div>
  )
}

const LOC_KEY = 'user_location'

function SignedInHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const stored = localStorage.getItem(LOC_KEY)
  const loc =
    stored ||
    (user?.city
      ? user.district
        ? `${user.city} ${user.district}`
        : user.city
      : '지역 미설정')

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
          padding: '14px 16px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sprite kind="ball" size={22} />
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            POKEMON CARDS
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/profile')}
            title="프로필"
            style={{
              width: 30,
              height: 30,
              padding: 0,
              cursor: 'pointer',
              background: 'var(--paper)',
              border: '2px solid #111',
              boxShadow: '2px 2px 0 0 #111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprite kind="person" size={18} />
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            opacity: 0.6,
            letterSpacing: 1,
          }}
        >
          ※ {user?.trainerId} · 카드 판매점 찾기
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflow: 'auto',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PixelButton
            full
            color="#111"
            bg="var(--red)"
            fg="#FAFAF7"
            onClick={() => navigate('/map')}
          >
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <Sprite kind="map" size={18} dark /> <span>지도 찾기 / FIND ON MAP</span>
            </span>
          </PixelButton>
          <PixelButton full color="#111" bg="var(--paper)" onClick={() => navigate('/post')}>
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <Sprite kind="card" size={18} /> <span>글 쓰기 / POST</span>
            </span>
          </PixelButton>
          <PixelButton full color="#111" bg="var(--paper)" onClick={() => navigate('/community')}>
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <Sprite kind="mega" size={18} /> <span>커뮤니티 / COMMUNITY</span>
            </span>
          </PixelButton>
        </div>

        <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
          <div style={{ fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
            위치선택 / LOCATION
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              ▶ {loc}
            </div>
            <PixelButton sm color="#111" bg="var(--paper)" onClick={() => navigate('/location')}>
              CHANGE
            </PixelButton>
          </div>
        </PixelBorder>
      </div>

      <GBTabBar active="home" />
    </div>
  )
}
