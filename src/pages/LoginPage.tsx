import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { gbStyles } from '@/lib/gbStyles'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 이미 로그인된 상태로 들어왔으면 바로 redirect
  useEffect(() => {
    if (loading) return
    if (!user) return
    if (!user.trainerId) {
      navigate(`/onboarding?redirect=${encodeURIComponent(redirect)}`, { replace: true })
    } else {
      navigate(redirect, { replace: true })
    }
  }, [user, loading, navigate, redirect])

  async function handleGoogle() {
    setErr(null)
    setBusy(true)
    const t = setTimeout(() => {
      setBusy(false)
      setErr('로그인 창이 열리지 않았어요. 실기기에서 다시 시도해주세요.')
    }, 5000)
    try {
      await signInWithGoogle()
      clearTimeout(t)
    } catch (e) {
      clearTimeout(t)
      setBusy(false)
      setErr(e instanceof Error ? e.message : '로그인 실패')
    }
  }

  async function handleApple() {
    setErr(null)
    setBusy(true)
    try {
      await signInWithApple()
    } catch (e) {
      setBusy(false)
      setErr(e instanceof Error ? e.message : 'Apple 로그인 실패')
    }
  }

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        fontFamily: gbStyles.font,
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          padding: 'calc(12px + env(safe-area-inset-top)) 14px 8px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackButton onClick={() => navigate('/')} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            LOGIN
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <PixelBorder color="#111" bg="var(--red)" padding={0} style={{ width: 110 }}>
            <div style={{ padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#FAFAF7' }}>
              <Sprite kind="ball" size={36} dark />
              <div
                style={{
                  fontSize: 9,
                  marginTop: 6,
                  letterSpacing: 2,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                TRAINER
              </div>
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700 }}>?????</div>
            </div>
          </PixelBorder>
        </div>

        <PixelBorder color="#111" bg="var(--paper-2)" padding={14}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            ▶ 트레이너 등록
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>
            구글 계정으로 로그인하면 트레이너 ID를 만들 수 있어요.
          </div>

          <PixelButton
            full
            color="#111"
            bg="#FAFAF7"
            fg="#111"
            onClick={handleGoogle}
            disabled={busy}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'center',
              }}
            >
              <GoogleG />
              <span>{busy ? '이동 중...' : 'Google로 시작하기'}</span>
            </span>
          </PixelButton>

          <PixelButton
            full
            color="#111"
            bg="#111"
            fg="#FAFAF7"
            onClick={handleApple}
            disabled={busy}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'center',
              }}
            >
              <AppleLogo />
              <span>{busy ? '이동 중...' : 'Apple로 시작하기'}</span>
            </span>
          </PixelButton>

          {err && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: 'var(--red)',
                fontWeight: 700,
              }}
            >
              ✕ {err}
            </div>
          )}
        </PixelBorder>

        <div
          style={{
            fontSize: 9,
            opacity: 0.5,
            textAlign: 'center',
            letterSpacing: 1,
            lineHeight: 1.6,
          }}
        >
          가입 시 이용약관 및 개인정보처리방침에 동의합니다.
        </div>
      </div>
    </div>
  )
}

function AppleLogo() {
  return (
    <svg width={16} height={16} viewBox="0 0 814 1000" aria-hidden fill="#FAFAF7">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-152.8-106.1C74.7 688.9 44.3 597.3 44.3 509.2c0-145.1 94.7-221.9 182.7-221.9 48.2 0 88.4 31.8 119 31.8 29.2 0 75.1-33.4 130.6-33.4 20.4 0 71.4 2 108.8 43.8zm-62-130.5c-28.7 33.2-75.4 57.8-122.5 57.8-4.1 0-8.3-.4-12.5-.9 1.5-48.3 34.8-97.1 67.4-127.6 35.3-33.2 95.7-58.6 144-60.3 1.7 50.6-19.6 100.1-76.4 131z" />
    </svg>
  )
}

function GoogleG() {
  return (
    <svg width={16} height={16} viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.57 2.69-3.88 2.69-6.64z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.27c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A8.99 8.99 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.95 10.69A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.69V4.97H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.34z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.97l2.99 2.34C4.66 5.18 6.65 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
