import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import { supabase } from '@/lib/supabase'
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

function SignedInHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [latestNotice, setLatestNotice] = useState<{ title: string } | null>(null)

  useEffect(() => {
    let alive = true
    supabase
      .from('notices')
      .select('title')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return
        if (data) setLatestNotice(data as { title: string })
      })
    return () => {
      alive = false
    }
  }, [])

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
      {/* Top banner: HOME 중앙 + 우측 프로필 */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 4,
            fontFamily: gbStyles.fontEn,
            textAlign: 'center',
          }}
        >
          HOME
        </div>
        <button
          onClick={() => navigate('/profile')}
          title="프로필"
          style={{
            position: 'absolute',
            right: 14,
            top: 10,
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
          flex: 1,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* POKEMON CARDS 타이틀 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '8px 0 4px',
          }}
        >
          <Sprite kind="ball" size={36} />
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              fontFamily: gbStyles.fontEn,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            POKEMON CARDS
          </div>
          <div
            style={{
              fontSize: 10,
              opacity: 0.6,
              letterSpacing: 1,
            }}
          >
            ※ {user?.trainerId} · 카드 판매점 찾기
          </div>
        </div>

        {/* 메인 버튼 3개 — 세로 중앙 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 10,
            padding: '20px 0',
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

        {/* 공지사항 — 클릭하면 /notices */}
        <button
          onClick={() => navigate('/notices')}
          style={{
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            opacity: latestNotice ? 1 : 0.45,
          }}
        >
          <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                fontFamily: gbStyles.fontEn,
                fontWeight: 700,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>★ 공지사항 / NOTICE</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 9, opacity: 0.6 }}>▶</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--ink-2)',
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {latestNotice?.title ?? '현재 등록된 공지사항이 없어요.'}
            </div>
          </PixelBorder>
        </button>
      </div>

      <GBTabBar active="home" />
    </div>
  )
}
