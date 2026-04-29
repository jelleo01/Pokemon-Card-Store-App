import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import BackButton from '@/components/ui/BackButton'
import { REGIONS } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import { getCurrentPosition, reverseGeocode } from '@/lib/kakao'

const LOC_KEY = 'user_location'

export default function LocationSearchPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [locating, setLocating] = useState(false)
  const current = localStorage.getItem(LOC_KEY) || '서울 강남구 역삼동'

  async function useCurrentLocation() {
    if (locating) return
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      const region = await reverseGeocode(pos.lat, pos.lng)
      if (!region) {
        alert('위치는 가져왔지만 지역명 변환에 실패했어요.')
        return
      }
      const stripped = `${region.district} ${region.dong}`.trim()
      localStorage.setItem(LOC_KEY, stripped)
      navigate('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : '위치를 가져올 수 없어요.')
    } finally {
      setLocating(false)
    }
  }

  const recents = ['서울 강남구 역삼동', '서울 서초구 서초동', '서울 마포구 합정동']
  const all = REGIONS.flatMap((r) => r.districts.map((d) => ({ city: r.city, district: d })))
  const filtered = q ? all.filter((x) => (x.city + ' ' + x.district).includes(q)) : all

  function pick(label: string) {
    // Strip leading "시 " prefix (matches JSX behavior)
    const stripped = label.replace(/^[^\s]+\s/, '')
    localStorage.setItem(LOC_KEY, stripped)
    navigate('/')
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
            LOCATION
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
              }}
            >
              <span style={{ fontSize: 12 }}>Q</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="동/구/시 이름 검색"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: gbStyles.font,
                  fontSize: 12,
                }}
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </PixelBorder>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          minHeight: 0,
        }}
      >
        {!q && (
          <>
            <div style={{ marginBottom: 12 }}>
              <PixelButton
                full
                color="#111"
                bg="var(--red)"
                fg="#FAFAF7"
                onClick={useCurrentLocation}
              >
                {locating ? '위치 가져오는 중...' : '📍 현재 위치 사용'}
              </PixelButton>
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: 'var(--ink-2)',
                marginBottom: 6,
                fontFamily: gbStyles.fontEn,
              }}
            >
              RECENT
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 14,
              }}
            >
              {recents.map((r) => (
                <button
                  key={r}
                  onClick={() => pick(r)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 10, opacity: 0.5 }}>↻</span>
                  <span style={{ flex: 1 }}>{r}</span>
                  {r === current && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 4px',
                        background: '#111',
                        color: '#FAFAF7',
                      }}
                    >
                      현재
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: 'var(--ink-2)',
                marginBottom: 6,
                fontFamily: gbStyles.fontEn,
              }}
            >
              ALL
            </div>
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((x, i) => (
            <button
              key={i}
              onClick={() => pick(`${x.city} ${x.district}`)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                border: '2px solid #111',
                background: 'var(--paper)',
                cursor: 'pointer',
                fontFamily: gbStyles.font,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.6, width: 28 }}>{x.city}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{x.district}</span>
              <span style={{ opacity: 0.5 }}>▶</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--ink-2)',
              }}
            >
              검색 결과가 없어요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
