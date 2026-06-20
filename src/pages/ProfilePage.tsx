import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { gbStyles } from '@/lib/gbStyles'
import { REGIONS } from '@/lib/data'

interface Stats {
  posts: number
  hearts: number
  comments: number
}

const ID_RE = /^[가-힣A-Za-z0-9_]{2,12}$/

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, refresh } = useAuth()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [trainerId, setTrainerId] = useState(user?.trainerId || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [city, setCity] = useState(user?.city || '서울')
  const [district, setDistrict] = useState(user?.district || '')

  const [stats, setStats] = useState<Stats>({ posts: 0, hearts: 0, comments: 0 })
  const [version, setVersion] = useState('v0.1')

  useEffect(() => {
    if (!user) return
    setTrainerId(user.trainerId || '')
    setPhone(user.phone || '')
    setCity(user.city || '서울')
    setDistrict(user.district || '')
  }, [user])

  // 통계 fetch — 내가 쓴 글 + 받은 하트/댓글
  useEffect(() => {
    if (!user) return
    let alive = true
    supabase
      .from('posts')
      .select('hearts_count, comments_count')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          console.error('[stats]', error)
          return
        }
        const rows = data ?? []
        setStats({
          posts: rows.length,
          hearts: rows.reduce((s, p) => s + (p.hearts_count ?? 0), 0),
          comments: rows.reduce((s, p) => s + (p.comments_count ?? 0), 0),
        })
      })
    return () => {
      alive = false
    }
  }, [user])

  // 버전 fetch from app_meta
  useEffect(() => {
    let alive = true
    supabase
      .from('app_meta')
      .select('value')
      .eq('key', 'version')
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return
        if (data?.value) setVersion(data.value)
      })
    return () => {
      alive = false
    }
  }, [])

  const cityRegion = useMemo(
    () => REGIONS.find((r) => r.city === city) ?? REGIONS[0],
    [city],
  )

  async function save() {
    if (!user) return
    if (!ID_RE.test(trainerId)) {
      setErr('아이디는 2~12자 (한글/영문/숫자) 만 가능해요.')
      return
    }
    setErr(null)
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        trainer_id: trainerId,
        phone: phone || null,
        city: city || null,
        district: district || null,
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      if (error.code === '23505') {
        setErr('이미 사용 중인 아이디예요.')
      } else {
        setErr(error.message)
      }
      return
    }
    await refresh()
    setEditing(false)
  }

  function cancel() {
    if (!user) return
    setTrainerId(user.trainerId || '')
    setPhone(user.phone || '')
    setCity(user.city || '서울')
    setDistrict(user.district || '')
    setErr(null)
    setEditing(false)
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const regionLabel = user?.city
    ? user.district
      ? `${user.city} ${user.district}`
      : user.city
    : '미등록'

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
          padding: 'calc(12px + env(safe-area-inset-top, 0px)) 14px 8px',
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
            PROFILE
          </div>
          <div style={{ flex: 1 }} />
          {editing ? (
            <>
              <PixelButton sm color="#111" bg="var(--paper)" onClick={cancel} disabled={saving}>
                취소
              </PixelButton>
              <PixelButton
                sm
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={save}
                disabled={saving}
              >
                {saving ? '...' : '✓ 저장'}
              </PixelButton>
            </>
          ) : (
            <PixelButton
              sm
              color="#111"
              bg="var(--paper)"
              onClick={() => setEditing(true)}
            >
              ✎ 편집
            </PixelButton>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
        }}
      >
        {/* Trainer card */}
        <PixelBorder color="#111" bg="var(--red)" padding={0}>
          <div
            style={{
              padding: '14px 16px',
              color: '#FAFAF7',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: '#FAFAF7',
                border: '2px solid #111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sprite kind="person" size={44} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 2,
                  opacity: 0.85,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                TRAINER
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                {user?.trainerId || '?????'}
              </div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>
                {user?.email || ''}
              </div>
              {user?.isAdmin && (
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 9,
                    padding: '2px 6px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    color: '#111',
                    fontFamily: gbStyles.fontEn,
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  ★ ADMIN
                </div>
              )}
            </div>
          </div>
        </PixelBorder>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: '쓴 글', v: stats.posts },
            { k: '하트', v: stats.hearts },
            { k: '댓글', v: stats.comments },
          ].map((s) => (
            <PixelBorder
              key={s.k}
              color="#111"
              bg="var(--paper)"
              padding={8}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--ink-2)' }}>
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

        {/* Account */}
        <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 8,
              fontFamily: gbStyles.fontEn,
            }}
          >
            ACCOUNT
          </div>

          <FieldRow label="아이디">
            {editing ? (
              <input
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value.slice(0, 12))}
                placeholder="2~12자"
                style={inputStyle}
              />
            ) : (
              <div style={{ fontWeight: 700, fontSize: 11 }}>
                {user?.trainerId || '미등록'}
              </div>
            )}
          </FieldRow>

          <FieldRow label="번호">
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                placeholder="(선택)"
                style={inputStyle}
              />
            ) : (
              <div style={{ fontWeight: 700, fontSize: 11 }}>{user?.phone || '미등록'}</div>
            )}
          </FieldRow>

          <FieldRow label="지역">
            {editing ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {REGIONS.map((r) => (
                    <button
                      key={r.city}
                      onClick={() => {
                        setCity(r.city)
                        setDistrict('')
                      }}
                      style={{
                        fontSize: 10,
                        padding: '3px 7px',
                        border: '2px solid #111',
                        background: city === r.city ? '#111' : 'var(--paper)',
                        color: city === r.city ? '#FAFAF7' : '#111',
                        cursor: 'pointer',
                        fontFamily: gbStyles.font,
                        fontWeight: 700,
                      }}
                    >
                      {r.city}
                    </button>
                  ))}
                </div>
                {cityRegion.districts.length > 0 ? (
                  <div
                    style={{
                      maxHeight: 110,
                      overflowY: 'auto',
                      border: '2px solid #111',
                      background: 'var(--paper)',
                    }}
                  >
                    {cityRegion.districts.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDistrict(d)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          border: 'none',
                          borderBottom: '1px dashed rgba(0,0,0,0.2)',
                          background: district === d ? 'var(--red)' : 'transparent',
                          color: district === d ? '#FAFAF7' : '#111',
                          fontFamily: gbStyles.font,
                          fontSize: 11,
                          fontWeight: district === d ? 700 : 400,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        {district === d ? '✓ ' : ''}
                        {d}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, opacity: 0.6, padding: '4px 0' }}>
                    {city} 는 기초자치단체가 없어요.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontWeight: 700, fontSize: 11 }}>{regionLabel}</div>
            )}
          </FieldRow>

          {err && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 8px',
                border: '2px solid var(--red)',
                background: '#FCE7E7',
                color: 'var(--red)',
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ✕ {err}
            </div>
          )}
        </PixelBorder>

        {/* Settings list */}
        <PixelBorder color="#111" bg="var(--paper)" padding={0}>
          <SettingsRow label="공지사항" onClick={() => navigate('/notices')} />
          <SettingsRow label="문의하기" onClick={() => navigate('/inquiry')} />
          <SettingsRow label="약관 / 정책" onClick={() => navigate('/policy')} />
          {user?.isAdmin && (
            <SettingsRow
              label="★ 관리자 페이지"
              onClick={() => navigate('/admin')}
            />
          )}
          <div
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <span style={{ flex: 1 }}>버전</span>
            <span
              style={{
                fontFamily: gbStyles.fontEn,
                fontWeight: 700,
                opacity: 0.7,
              }}
            >
              {version}
            </span>
          </div>
        </PixelBorder>

        <PixelButton full color="#111" bg="var(--paper)" onClick={handleLogout}>
          로그아웃
        </PixelButton>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 6px',
  border: '2px solid #111',
  background: 'var(--paper)',
  fontFamily: gbStyles.font,
  fontSize: 11,
  fontWeight: 700,
  outline: 'none',
  boxSizing: 'border-box',
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px dashed rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          width: 56,
          color: 'var(--ink-2)',
          letterSpacing: 1,
          fontSize: 10,
          flexShrink: 0,
          paddingTop: 4,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function SettingsRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderBottom: '1px dashed rgba(0,0,0,0.15)',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
        fontFamily: gbStyles.font,
        color: '#111',
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ opacity: 0.5 }}>▶</span>
    </button>
  )
}
