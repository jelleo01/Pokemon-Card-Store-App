import PointsBadge from '@/components/ui/PointsBadge'
import { pendingRedirect } from '@/lib/authRedirect'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const sharedPlace = params.get('place')
  const [savedRedirect] = useState(pendingRedirect)
  useEffect(() => {
    if (user && savedRedirect !== '/') sessionStorage.removeItem('loginRedirect')
  }, [user, savedRedirect])

  // 세션/프로필 로딩 중엔 빈 화면 — Landing 이 flash 되는 걸 방지
  if (loading) {
    return (
      <div
        style={{
          height: '100dvh',
          background: 'var(--paper)',
        }}
      />
    )
  }

  if (sharedPlace) return <Navigate to={`/shop/${encodeURIComponent(sharedPlace)}`} replace />

  if (!user) return <Landing />

  if (savedRedirect !== '/') {
    return <Navigate to={savedRedirect} replace />
  }

  if (!user.trainerId) return <Navigate to="/onboarding" replace />

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
            <Sprite kind="map" size={18} dark /> <span>로그인하고 지도 찾기</span>
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
    const bodyOverflow = document.body.style.overflow
    const rootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = rootOverflow
    }
  }, [])


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
    return () => { alive = false }
  }, [])

  return (
    <div className="home-screen" style={{ fontFamily: gbStyles.font }}>
      <header className="home-header">
        <b>HOME</b>
        <button aria-label="프로필" onClick={() => navigate('/profile')}><Sprite kind="person" size={18} /></button>
      </header>
      <main className="home-content">
        <div className="home-hero">
          <span className="home-ball"><Sprite kind="ball" size={32} /></span>
          <b>POKEMON CARDS</b>
          <small>내 주변 포켓몬 카드 판매점 찾기</small>
        </div>
        <PixelBorder padding={10} bg="var(--paper-2)" style={{ flexShrink: 0 }}>
          <div className="home-trainer">
            <span className="home-avatar"><Sprite kind="person" size={30} /></span>
            <div className="home-trainer-name"><small>TRAINER</small><b>{user?.trainerId ?? '???'}</b><small>{[user?.city, user?.district].filter(Boolean).join(' ') || '지역 미설정'}</small></div>
            <PointsBadge />
          </div>
        </PixelBorder>
        <div className="home-actions">
          <div className="home-primary">
            <PixelButton full bg="var(--red)" fg="#FAFAF7" onClick={() => navigate('/map')}>지도 찾기 / MAP</PixelButton>
            <PixelButton full onClick={() => navigate('/post')}>글 쓰기 / POST</PixelButton>
            <PixelButton full onClick={() => navigate('/community')}>커뮤니티 / COMMUNITY</PixelButton>
          </div>
          <div className="home-secondary">
            <PixelButton full onClick={() => navigate('/feedback')}>앱 사용 후기 남기기 (+15P)</PixelButton>
            <PixelButton full onClick={() => navigate('/inquiry')}>문의하기</PixelButton>
          </div>
        </div>
        <button className="home-notice" onClick={() => navigate('/notices')}>
          <b>공지사항</b><span>{latestNotice?.title ?? '현재 등록된 공지사항이 없어요.'}</span><span>▶</span>
        </button>
      </main>
      <GBTabBar active="home" />
    </div>
  )
}
