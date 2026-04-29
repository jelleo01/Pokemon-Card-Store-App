import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import Sprite from '@/components/ui/Sprite'
import TypePin from '@/components/ui/TypePin'
import MapControl from '@/components/ui/MapControl'
import Row from '@/components/ui/Row'
import BackButton from '@/components/ui/BackButton'
import KakaoMap, { type KakaoMapHandle } from '@/components/ui/KakaoMap'
import { SHOPS, SHOP_TYPES, type ShopType } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import {
  getCurrentPosition,
  getDirectionsUrl,
  haversine,
  searchPlaces,
  type KakaoPlace,
  type LatLng,
} from '@/lib/kakao'

// 서울 시청 근처를 디폴트로 (강남역보다 살짝 북쪽 — 수도권 매장 분포 중앙)
const DEFAULT_CENTER: LatLng = { lat: 37.5547, lng: 126.9707 }
// level 6 = 구 단위로 한 화면. 1=가장 줌인, 14=가장 줌아웃
const DEFAULT_LEVEL = 6

export default function MapPage() {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const [active, setActive] = useState<ShopType[]>([...SHOP_TYPES])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [me, setMe] = useState<LatLng | null>(null)
  const [visibleCount, setVisibleCount] = useState(30)
  const [placeResults, setPlaceResults] = useState<KakaoPlace[]>([])
  const [locating, setLocating] = useState(false)
  const mapRef = useRef<KakaoMapHandle>(null)

  // mount 시 자동으로 현재 위치 시도. 실패 시 DEFAULT_CENTER 유지.
  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setMe(pos))
      .catch(() => {
        // 권한 거부/타임아웃 — 무시. 사용자가 "내 위치" 버튼으로 다시 시도 가능
      })
  }, [])

  // me 가 처음 set되면 지도도 자동으로 그쪽으로 이동
  useEffect(() => {
    if (me) mapRef.current?.panTo(me)
  }, [me])

  // 검색어 변할 때 카카오 Places 호출 — debounce 250ms
  useEffect(() => {
    if (!query.trim()) {
      setPlaceResults([])
      return
    }
    const t = setTimeout(() => {
      searchPlaces(query, 8).then(setPlaceResults).catch(() => setPlaceResults([]))
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function locateMe() {
    if (locating) return
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      setMe(pos)
      mapRef.current?.panTo(pos)
    } catch (err) {
      alert(err instanceof Error ? err.message : '위치를 가져올 수 없어요.')
    } finally {
      setLocating(false)
    }
  }

  function panToPlace(p: KakaoPlace) {
    mapRef.current?.panTo({ lat: p.lat, lng: p.lng })
    setSearchOpen(false)
    setQuery('')
  }

  // 거리는 me 좌표 기준으로 동적 계산. 데이터의 dist 필드는 무시.
  const withDist = useMemo(
    () =>
      SHOPS.map((s) => ({
        ...s,
        dist: me ? Math.round(haversine(me, { lat: s.lat, lng: s.lng }) * 10) / 10 : 0,
      })),
    [me],
  )

  const open = withDist.find((s) => s.id === openId)

  const visible = withDist.filter((s) => active.includes(s.type))
  const sorted = [...visible].sort((a, b) => a.dist - b.dist)

  // 핀 또는 리스트/검색 결과 선택 시 — 카카오 지도를 그 매장으로 이동
  const selectShop = (id: string | null) => {
    setOpenId(id)
    if (id) {
      const s = withDist.find((x) => x.id === id)
      if (s) mapRef.current?.panTo({ lat: s.lat, lng: s.lng })
    }
  }

  const toggleType = (t: ShopType) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]))

  const searchResults = query
    ? withDist.filter(
        (s) => s.name.includes(query) || s.addr.includes(query) || s.type.includes(query),
      )
    : [...withDist].sort((a, b) => a.dist - b.dist).slice(0, 8)

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        fontFamily: gbStyles.font,
        color: 'var(--ink)',
      }}
    >
      {/* Header */}
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
            MAP
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, letterSpacing: 1 }}>강남 · 거리순</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              flex: 1,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: gbStyles.fontEn,
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  매장 / 주소 / 종류 찾기...
                </span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
              </div>
            </PixelBorder>
          </button>
        </div>
      </div>

      {/* Map view */}
      <div
        style={{
          position: 'relative',
          height: 220,
          borderBottom: '2px solid #111',
          overflow: 'hidden',
          background: '#EEECE2',
          flexShrink: 0,
        }}
      >
        <KakaoMap
          ref={mapRef}
          center={me || DEFAULT_CENTER}
          level={DEFAULT_LEVEL}
          shops={sorted}
          openId={openId}
          me={me}
          onPinClick={selectShop}
          onMeClick={() => {
            if (me) mapRef.current?.panTo(me)
          }}
        />

        {/* INDEX (legend) */}
        <div style={{ position: 'absolute', top: 8, right: 8, maxWidth: 150, zIndex: 20 }}>
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <button
              onClick={() => setIndexOpen((o) => !o)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                fontSize: 10,
                letterSpacing: 2,
                fontFamily: gbStyles.fontEn,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              INDEX <span style={{ marginLeft: 'auto' }}>{indexOpen ? '▲' : '▼'}</span>
            </button>
            {indexOpen && (
              <div
                style={{
                  borderTop: '2px solid #111',
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {SHOP_TYPES.map((t) => (
                  <div
                    key={t}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}
                  >
                    <TypePin type={t} size={12} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </PixelBorder>
        </div>

        {/* Map controls */}
        <MapControl
          right={8}
          top={8 + (indexOpen ? 110 : 28)}
          onClick={locateMe}
        >
          {locating ? <span style={{ fontSize: 11 }}>…</span> : <Sprite kind="ball" size={16} />}
        </MapControl>
        <MapControl
          right={8}
          top={8 + (indexOpen ? 110 : 28) + 36}
          onClick={() => mapRef.current?.zoomIn()}
        >
          +
        </MapControl>
        <MapControl
          right={8}
          top={8 + (indexOpen ? 110 : 28) + 36 + 32}
          onClick={() => mapRef.current?.zoomOut()}
        >
          −
        </MapControl>
      </div>

      {/* Filter row */}
      <div
        style={{
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
          }}
        >
          <button
            onClick={() => setFilterOpen((o) => !o)}
            style={{
              background: filterOpen ? '#111' : 'var(--paper)',
              color: filterOpen ? '#FAFAF7' : '#111',
              border: '2px solid #111',
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: gbStyles.font,
              fontSize: 10,
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            FILTER <span>{filterOpen ? '▲' : '▼'}</span>
          </button>
          <div style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: 1 }}>
            ▶ 거리순 · {active.length}/{SHOP_TYPES.length} 종류 표시
          </div>
        </div>
        {filterOpen && (
          <div
            style={{
              padding: '4px 12px 10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {SHOP_TYPES.map((t) => {
              const on = active.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  style={{
                    fontSize: 10,
                    padding: '4px 8px',
                    border: '2px solid #111',
                    background: on ? '#111' : 'var(--paper)',
                    color: on ? '#FAFAF7' : '#111',
                    letterSpacing: 1,
                    cursor: 'pointer',
                    fontFamily: gbStyles.font,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <TypePin type={t} size={10} active={on} />
                  <span>{t}</span>
                  <span style={{ opacity: 0.6 }}>{on ? '☑' : '☐'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Shop list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
        }}
      >
        {sorted.slice(0, visibleCount).map((s) => {
          const isOpen = openId === s.id
          return (
            <div key={s.id}>
              <button
                onClick={() => selectShop(isOpen ? null : s.id)}
                style={{
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <PixelBorder color="#111" bg={isOpen ? '#111' : 'var(--paper)'} padding={0}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      color: isOpen ? '#FAFAF7' : '#111',
                    }}
                  >
                    <TypePin type={s.type} size={16} active={isOpen} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.75,
                          marginTop: 2,
                          fontFamily: gbStyles.fontEn,
                        }}
                      >
                        {s.dist}km · {s.type} · stock:{s.stockLevel}
                      </div>
                    </div>
                    <div
                      role="link"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(getDirectionsUrl(s), '_blank', 'noopener,noreferrer')
                      }}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        background: 'var(--red)',
                        color: '#FAFAF7',
                        border: '2px solid ' + (isOpen ? '#FAFAF7' : '#111'),
                        fontFamily: gbStyles.fontEn,
                        letterSpacing: 1,
                        cursor: 'pointer',
                      }}
                    >
                      GO ▶
                    </div>
                  </div>
                </PixelBorder>
              </button>

              {isOpen && open && (
                <div style={{ marginTop: -2 }}>
                  <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: 2,
                        marginBottom: 6,
                        fontFamily: gbStyles.fontEn,
                      }}
                    >
                      ▼ DETAIL
                    </div>
                    <Row k="위치" v={open.addr} />
                    <Row k="거리" v={`${open.dist}km`} />
                    <Row k="분류" v={open.type} />
                    <Row k="UPDATE" v={open.update} />
                    <Row k="재고" v={open.stock} />
                    <Row k="소식" v={`${open.newsCount}건`} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <PixelButton sm full color="#111" bg="var(--paper)">
                        ✎ 수정 제안
                      </PixelButton>
                      <PixelButton sm full color="#111" bg="var(--red)" fg="#FAFAF7">
                        더 자세히 ▶
                      </PixelButton>
                    </div>
                  </PixelBorder>
                </div>
              )}
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--ink-2)',
            }}
          >
            ☐ 모든 분류가 꺼져있어요. FILTER에서 켜주세요.
          </div>
        )}
        {sorted.length > visibleCount && (
          <div style={{ padding: '4px 0 8px' }}>
            <PixelButton
              full
              color="#111"
              bg="var(--paper)"
              onClick={() => setVisibleCount((c) => c + 30)}
            >
              + 더 보기 ({sorted.length - visibleCount}개)
            </PixelButton>
          </div>
        )}
      </div>

      <GBTabBar active="map" />

      {/* SEARCH overlay */}
      {searchOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--paper)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '2px solid #111',
              background: 'var(--paper-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BackButton
                onClick={() => {
                  setSearchOpen(false)
                  setQuery('')
                }}
                glyph="✕"
              />
              <PixelBorder color="#111" bg="var(--paper)" padding={0} style={{ flex: 1 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}
                >
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="매장 / 주소 / 종류 검색"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: gbStyles.font,
                      fontSize: 12,
                    }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {/* 매장 (SHOPS) — 분류 아이콘과 함께 */}
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: 'var(--ink-2)',
                marginBottom: 8,
                fontFamily: gbStyles.fontEn,
              }}
            >
              {query ? `매장 · ${searchResults.length}` : '근처 매장'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    selectShop(s.id)
                    setSearchOpen(false)
                    setQuery('')
                  }}
                  style={{
                    textAlign: 'left',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <PixelBorder color="#111" bg="var(--paper)" padding={0}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                      }}
                    >
                      <TypePin type={s.type} size={14} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                        <div
                          style={{
                            fontSize: 10,
                            opacity: 0.7,
                            fontFamily: gbStyles.fontEn,
                          }}
                        >
                          {s.addr} · {s.dist}km
                        </div>
                      </div>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                    </div>
                  </PixelBorder>
                </button>
              ))}
              {query && searchResults.length === 0 && (
                <div
                  style={{
                    padding: 12,
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'var(--ink-2)',
                  }}
                >
                  매장 결과 없음
                </div>
              )}
            </div>

            {/* 카카오 일반 장소 (지하철역/마트/카페 등) — 매장이 아니라 위치만 이동 */}
            {query && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 2,
                    color: 'var(--ink-2)',
                    margin: '14px 0 8px',
                    fontFamily: gbStyles.fontEn,
                  }}
                >
                  장소 · {placeResults.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {placeResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => panToPlace(p)}
                      style={{
                        textAlign: 'left',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <PixelBorder color="#111" bg="var(--paper)" padding={0}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              fontSize: 10,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #111',
                              background: 'var(--paper)',
                            }}
                          >
                            📍
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                            <div
                              style={{
                                fontSize: 10,
                                opacity: 0.7,
                                fontFamily: gbStyles.fontEn,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {p.addr || p.category}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                        </div>
                      </PixelBorder>
                    </button>
                  ))}
                  {placeResults.length === 0 && (
                    <div
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        fontSize: 11,
                        color: 'var(--ink-2)',
                      }}
                    >
                      장소 결과 없음
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
