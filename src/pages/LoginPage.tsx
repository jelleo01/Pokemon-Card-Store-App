import { safeRedirect, rememberRedirect } from '@/lib/authRedirect'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { gbStyles } from '@/lib/gbStyles'
import appleSignInButton from '@/assets/apple-signin-ko.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth()
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  // 이미 로그인된 상태로 들어왔으면 바로 redirect
  useEffect(() => {
    if (loading) return
    if (!user) return
    sessionStorage.removeItem('loginRedirect')
    if (!user.trainerId) {
      navigate(`/onboarding?redirect=${encodeURIComponent(redirect)}`, { replace: true })
    } else {
      navigate(redirect, { replace: true })
    }
  }, [user, loading, navigate, redirect])

  async function handleGoogle() {
    rememberRedirect(redirect)
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
    rememberRedirect(redirect)
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
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            ▶ 트레이너 등록
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14, lineHeight: 1.6 }}>
            로그인하면 트레이너 ID를 만들 수 있어요.
          </div>

          {/* 약관 동의 */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 3, width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, lineHeight: 1.6, fontFamily: gbStyles.font, color: 'var(--ink)' }}>
              <b>이용약관</b>에 동의합니다.
              <br />
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                본 앱은 부적절한 콘텐츠 및 욕설, 스팸을 포함한 어떠한 유해 행위도 허용하지 않으며, 위반 시 즉시 조치합니다.
              </span>
            </span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PixelButton
              full
              color="#111"
              bg="#FAFAF7"
              fg="#111"
              onClick={handleGoogle}
              disabled={busy || !agreed}
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

            {/* Apple HIG: 공식 버튼 아트워크(appleid.cdn-apple.com 생성) 그대로 사용 */}
            <button
              type="button"
              onClick={handleApple}
              disabled={busy || !agreed}
              aria-label="Apple로 로그인"
              style={{
                width: '100%',
                height: 44,
                padding: 0,
                border: 'none',
                borderRadius: 8,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: busy || !agreed ? 'not-allowed' : 'pointer',
                opacity: busy || !agreed ? 0.5 : 1,
              }}
            >
              <img
                src={appleSignInButton}
                alt=""
                draggable={false}
                style={{ height: 44, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
              />
            </button>
          </div>

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
