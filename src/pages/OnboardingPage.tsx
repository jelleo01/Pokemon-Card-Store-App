import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { REGIONS } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'

const ID_RE = /^[가-힣A-Za-z0-9_]{2,12}$/

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, refresh } = useAuth()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [trainerId, setTrainerId] = useState('')
  const [city, setCity] = useState('서울')
  const [district, setDistrict] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 비로그인이면 /login으로
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true })
      return
    }
    if (user.trainerId) {
      navigate(redirect, { replace: true })
    }
  }, [user, authLoading, navigate, redirect])

  const cityRegion = useMemo(
    () => REGIONS.find((r) => r.city === city) ?? REGIONS[0],
    [city],
  )

  // trainer_id 중복 검사 (debounce)
  useEffect(() => {
    setAvailable(null)
    if (!ID_RE.test(trainerId)) return
    let cancelled = false
    setChecking(true)
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('trainer_id')
        .eq('trainer_id', trainerId)
        .maybeSingle()
      if (cancelled) return
      setChecking(false)
      if (error) {
        setAvailable(null)
        return
      }
      setAvailable(!data)
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [trainerId])

  const idValid = ID_RE.test(trainerId)
  const needsDistrict = cityRegion.districts.length > 0
  const canSubmit =
    idValid && available === true && (!needsDistrict || !!district) && !submitting

  async function handleSubmit() {
    if (!user) return
    if (!canSubmit) return
    setErr(null)
    setSubmitting(true)
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      trainer_id: trainerId,
      city,
      district,
      phone: user.phone,
    })
    if (error) {
      setSubmitting(false)
      if (error.code === '23505') {
        setErr('이미 사용 중인 아이디예요.')
        setAvailable(false)
      } else {
        setErr(error.message)
      }
      return
    }
    await refresh()
    navigate(redirect, { replace: true })
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
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: gbStyles.fontEn,
            }}
          >
            ONBOARDING
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1 }}>
            거의 다 됐어요
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
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
                {trainerId || '?????'}
              </div>
            </div>
          </PixelBorder>
        </div>

        <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            ▶ 트레이너 아이디
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            커뮤니티에 표시될 이름이에요. 한글/영문/숫자 2~12자.
          </div>
          <input
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value.slice(0, 12))}
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
          <div style={{ marginTop: 6, fontSize: 10, minHeight: 14 }}>
            {!trainerId && <span style={{ opacity: 0.5 }}>아이디를 입력해주세요.</span>}
            {trainerId && !idValid && (
              <span style={{ color: 'var(--red)' }}>✕ 형식이 맞지 않아요</span>
            )}
            {idValid && checking && <span style={{ opacity: 0.6 }}>확인 중...</span>}
            {idValid && !checking && available === true && (
              <span style={{ color: '#1a8a3e', fontWeight: 700 }}>✓ 사용 가능</span>
            )}
            {idValid && !checking && available === false && (
              <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                ✕ 이미 사용 중이에요
              </span>
            )}
          </div>
        </PixelBorder>

        <PixelBorder color="#111" bg="var(--paper-2)" padding={12}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>▶ 지역</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            커뮤니티 필터에 사용돼요.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            {REGIONS.map((r) => (
              <button
                key={r.city}
                onClick={() => {
                  setCity(r.city)
                  setDistrict('')
                }}
                style={{
                  padding: '4px 8px',
                  border: '2px solid #111',
                  background: city === r.city ? 'var(--red)' : 'var(--paper)',
                  color: city === r.city ? '#FAFAF7' : '#111',
                  fontFamily: gbStyles.font,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: city === r.city ? 'none' : '2px 2px 0 0 #111',
                }}
              >
                {r.city}
              </button>
            ))}
          </div>
          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              border: '2px solid #111',
              background: 'var(--paper)',
            }}
          >
            {cityRegion.districts.length === 0 ? (
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: 11,
                  opacity: 0.6,
                  textAlign: 'center',
                }}
              >
                기초자치단체 없음 — &lsquo;{city}&rsquo; 로 등록됩니다.
              </div>
            ) : (
              cityRegion.districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistrict(d)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderBottom: '1px dashed rgba(0,0,0,0.2)',
                    background: district === d ? 'var(--red)' : 'transparent',
                    color: district === d ? '#FAFAF7' : '#111',
                    fontFamily: gbStyles.font,
                    fontSize: 12,
                    fontWeight: district === d ? 700 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {district === d ? '✓ ' : ''}
                  {d}
                </button>
              ))
            )}
          </div>
        </PixelBorder>

        {err && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--red)',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            ✕ {err}
          </div>
        )}

        <PixelButton
          full
          color="#111"
          bg="var(--red)"
          fg="#FAFAF7"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? '등록 중...' : '시작하기 ▶'}
        </PixelButton>

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
