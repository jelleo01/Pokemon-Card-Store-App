import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import { gbStyles } from '@/lib/gbStyles'

const LOC_KEY = 'user_location'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const loc = localStorage.getItem(LOC_KEY) || '강남구 역삼동'

  function goWithAuth(path: string) {
    if (!user) {
      navigate(`/auth-wall?redirect=${encodeURIComponent(path)}`)
      return
    }
    navigate(path)
  }

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
            onClick={() => navigate(user ? '/profile' : '/login')}
            title={user ? '프로필' : '로그인'}
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
          ※ {user ? `${user.id} · 카드 판매점 찾기` : '카드 판매점 찾기 · 로그인 시 커뮤니티 가능'}
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
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          <div
            style={{
              background: '#111',
              color: 'var(--paper)',
              padding: '4px 8px',
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            NOTICE
          </div>
          <div style={{ padding: '10px 12px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              ★ 신상 카드팩 입고!
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              강남 일대 6개 매장에 4월 28일자 신상 박스가 들어왔어요. 지도에서 ★ 표시를 확인해보세요.
            </div>
          </div>
        </PixelBorder>

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
          <PixelButton
            full
            color="#111"
            bg="var(--paper)"
            onClick={() => goWithAuth('/post')}
          >
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <Sprite kind="card" size={18} /> <span>글 쓰기 / POST</span>
            </span>
          </PixelButton>
          <PixelButton
            full
            color="#111"
            bg="var(--paper)"
            onClick={() => goWithAuth('/community')}
          >
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
          <div style={{ marginTop: 6 }}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <button
                onClick={() => navigate('/location')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: gbStyles.font,
                  fontSize: 11,
                  color: 'var(--ink-2)',
                }}
              >
                <span style={{ fontSize: 11 }}>Q</span>
                <span style={{ flex: 1 }}>다른 동네 검색하기...</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
              </button>
            </PixelBorder>
          </div>
        </PixelBorder>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: '근처', v: '6' },
            { k: '재고', v: '4' },
            { k: '소식', v: '11' },
          ].map((s) => (
            <PixelBorder
              key={s.k}
              color="#111"
              bg="var(--paper)"
              padding={8}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 1,
                  color: 'var(--ink-2)',
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                {s.v}
              </div>
            </PixelBorder>
          ))}
        </div>
      </div>

      <GBTabBar active="home" />
    </div>
  )
}
