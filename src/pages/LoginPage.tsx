import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { gbStyles } from '@/lib/gbStyles'

type Step = 'phone' | 'otp' | 'id'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('010-')
  const [otp, setOtp] = useState('')
  const [userId, setId] = useState('')

  function complete() {
    const id = userId || '트레이너#9999'
    signIn({ id, phone, region: '서울 강남구 역삼동' })
    navigate(redirect)
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
          padding: '12px 14px 8px',
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
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.6 }}>
            STEP {step === 'phone' ? '1' : step === 'otp' ? '2' : '3'}/3
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
        }}
      >
        {/* Trainer card preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <PixelBorder color="#111" bg="var(--red)" padding={0} style={{ width: 110 }}>
            <div style={{ padding: '14px 8px', textAlign: 'center', color: '#FAFAF7' }}>
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
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700 }}>
                {userId || '?????'}
              </div>
            </div>
          </PixelBorder>
        </div>

        {step === 'phone' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 핸드폰 번호</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              인증번호를 문자로 받게 돼요.
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '2px solid #111',
                boxSizing: 'border-box',
                fontFamily: gbStyles.fontEn,
                fontSize: 14,
                fontWeight: 700,
                background: 'var(--paper)',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: 10 }}>
              <PixelButton
                full
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={() => setStep('otp')}
              >
                인증번호 받기 ▶
              </PixelButton>
            </div>
          </PixelBorder>
        )}

        {step === 'otp' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 인증번호 6자리</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              {phone} 으로 발송됨 · 02:59
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '2px solid #111',
                boxSizing: 'border-box',
                fontFamily: gbStyles.fontEn,
                fontSize: 18,
                fontWeight: 700,
                background: 'var(--paper)',
                outline: 'none',
                letterSpacing: 6,
                textAlign: 'center',
              }}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <PixelButton sm color="#111" bg="var(--paper)" onClick={() => setStep('phone')}>
                ◀ 뒤로
              </PixelButton>
              <PixelButton
                full
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={() => setStep('id')}
              >
                확인 ▶
              </PixelButton>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, opacity: 0.6, textAlign: 'center' }}>
              다시 받기 · 음성으로 받기
            </div>
          </PixelBorder>
        )}

        {step === 'id' && (
          <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 트레이너 아이디</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              커뮤니티에 표시될 이름이에요.
            </div>
            <input
              value={userId}
              onChange={(e) => setId(e.target.value.slice(0, 12))}
              placeholder="ex) 피카츄러버"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '2px solid #111',
                boxSizing: 'border-box',
                fontFamily: gbStyles.font,
                fontSize: 14,
                fontWeight: 700,
                background: 'var(--paper)',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>
              2~12자 · 한글/영문/숫자
            </div>
            <div style={{ marginTop: 10 }}>
              <PixelButton full color="#111" bg="var(--red)" fg="#FAFAF7" onClick={complete}>
                가입 완료 ▶
              </PixelButton>
            </div>
          </PixelBorder>
        )}

        <div
          style={{
            fontSize: 9,
            opacity: 0.5,
            textAlign: 'center',
            letterSpacing: 1,
          }}
        >
          가입 시 이용약관 및 개인정보처리방침에 동의합니다.
        </div>
      </div>
    </div>
  )
}
