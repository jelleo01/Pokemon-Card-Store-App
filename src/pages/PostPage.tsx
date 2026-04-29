import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GBTabBar from '@/components/ui/GBTabBar'
import PixelBorder from '@/components/ui/PixelBorder'
import PixelButton from '@/components/ui/PixelButton'
import PixelInput from '@/components/ui/PixelInput'
import PixelMiniBtn from '@/components/ui/PixelMiniBtn'
import TypePin from '@/components/ui/TypePin'
import SectionLabel from '@/components/ui/SectionLabel'
import ModeToggle from '@/components/ui/ModeToggle'
import CategoryCard from '@/components/ui/CategoryCard'
import Field from '@/components/ui/Field'
import BackButton from '@/components/ui/BackButton'
import KakaoMap from '@/components/ui/KakaoMap'
import { SHOPS, SHOP_TYPES, type ShopType } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import type { LatLng } from '@/lib/kakao'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const NEW_PIN_DEFAULT: LatLng = { lat: 37.5547, lng: 126.9707 }

type PlaceMode = 'existing' | 'new'
type Category = '소식' | '질문'

const TYPE_DB_MAP: Record<ShopType, string> = {
  공식: 'cardshop',
  카드샵: 'cardshop',
  자판기: 'vending',
  편의점: 'cvs',
}

export default function PostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()

  const initialShopId = params.get('shopId') || SHOPS[0]?.id || ''
  const [placeMode, setPlace] = useState<PlaceMode>('existing')
  const [shopId, setShopId] = useState<string>(initialShopId)
  const [category, setCat] = useState<Category>('소식')
  const [stockTag, setStock] = useState('')
  const [body, setBody] = useState('')
  const [pickerOpen, setPicker] = useState(false)
  const [pickerQ, setPickerQ] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // 새 장소 모드 state
  const [newName, setNewName] = useState('')
  const [newAddr, setNewAddr] = useState('')
  const [newType, setNewType] = useState<ShopType>('카드샵')
  const [newCoord, setNewCoord] = useState<LatLng>(NEW_PIN_DEFAULT)

  const open = SHOPS.find((s) => s.id === shopId) ?? SHOPS[0]
  const stockTags = ['신상 박스 입고', '잔여 적음', '품절', '재입고 예정', '싱글 카드']

  // ?shopId= 변경 시 동기화 (MapPage 의 수정하기 버튼)
  useEffect(() => {
    const q = params.get('shopId')
    if (q) setShopId(q)
  }, [params])

  // 기존 매장 → DB row 보장 (이미 있으면 SELECT, 없으면 INSERT)
  async function upsertExistingShop(): Promise<string | null> {
    if (!open) return null
    const { data: existing, error: selErr } = await supabase
      .from('shops')
      .select('id')
      .eq('name', open.name)
      .eq('lat', open.lat)
      .eq('lng', open.lng)
      .maybeSingle()
    if (selErr) {
      console.error('[shop select]', selErr)
    }
    if (existing) return existing.id

    const { data: inserted, error } = await supabase
      .from('shops')
      .insert({
        name: open.name,
        type: TYPE_DB_MAP[open.type] ?? 'cardshop',
        addr: open.addr,
        lat: open.lat,
        lng: open.lng,
        verified: open.type === '공식',
        created_by: user?.id ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.error('[shop insert]', error)
      return null
    }
    return inserted.id
  }

  // 새 매장 INSERT
  async function createNewShop(): Promise<string | null> {
    const { data, error } = await supabase
      .from('shops')
      .insert({
        name: newName.trim(),
        type: TYPE_DB_MAP[newType] ?? 'cardshop',
        addr: newAddr.trim() || '주소 미상',
        lat: newCoord.lat,
        lng: newCoord.lng,
        verified: false,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.error('[new shop insert]', error)
      setErr(`매장 등록 실패: ${error.message}`)
      return null
    }
    return data.id
  }

  async function handleSubmit() {
    if (!user) {
      setErr('로그인이 필요해요.')
      return
    }
    if (body.trim().length < 5) {
      setErr('본문을 5자 이상 써주세요.')
      return
    }
    if (placeMode === 'new' && newName.trim().length < 2) {
      setErr('새 매장 이름을 2자 이상 입력해주세요.')
      return
    }
    if (placeMode === 'existing' && !open) {
      setErr('장소를 선택해주세요.')
      return
    }
    setErr(null)
    setSubmitting(true)
    try {
      const shopUuid =
        placeMode === 'new' ? await createNewShop() : await upsertExistingShop()
      if (!shopUuid) {
        if (!err) setErr('매장 정보를 저장하지 못했어요.')
        return
      }
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        shop_id: shopUuid,
        category: category === '소식' ? 'news' : 'ask',
        body: body.trim(),
        tags: category === '소식' && stockTag ? [stockTag] : [],
      })
      if (error) {
        console.error('[post insert]', error)
        setErr(`등록 실패: ${error.message}`)
        return
      }
      setShowSuccess(true)
      // 폼 리셋 — 같은 페이지에서 다음 글 바로 쓸 수 있게
      setBody('')
      setStock('')
      if (placeMode === 'new') {
        setNewName('')
        setNewAddr('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const mapCenter = useMemo<LatLng>(() => {
    if (placeMode === 'new') return newCoord
    if (open) return { lat: open.lat, lng: open.lng }
    return NEW_PIN_DEFAULT
  }, [placeMode, open, newCoord])

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
          padding: '14px 16px 12px',
          borderBottom: '2px solid #111',
          background: 'var(--paper-2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={() => navigate('/')} width={28} height={24} />
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: gbStyles.fontEn,
            }}
          >
            POST
          </div>
          <div style={{ flex: 1 }} />
          <PixelButton
            sm
            color="#111"
            bg="var(--red)"
            fg="#FAFAF7"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록 ▶'}
          </PixelButton>
        </div>
        <div style={{ fontSize: 10, marginTop: 6, opacity: 0.6, letterSpacing: 1 }}>
          ※ 매장 소식 / 질문을 남겨보세요
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
        }}
      >
        {/* 1. 장소 선택 */}
        <div>
          <SectionLabel n="01" label="장소 / PLACE" />
          <PixelBorder color="#111" bg="var(--paper)" padding={0} style={{ marginBottom: 8 }}>
            <div
              style={{
                position: 'relative',
                height: 160,
                overflow: 'hidden',
                background: '#EEECE2',
              }}
            >
              <KakaoMap
                center={mapCenter}
                level={placeMode === 'new' ? 5 : 4}
                interactive={placeMode === 'new'}
                simplePins
                shops={placeMode === 'existing' && open ? [open] : []}
                onIdle={
                  placeMode === 'new'
                    ? (c) => setNewCoord(c)
                    : undefined
                }
              />
              {/* 새 장소 모드: 지도 정중앙 고정 핀 (CSS overlay) */}
              {placeMode === 'new' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -100%)',
                    pointerEvents: 'none',
                    fontSize: 26,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 1px 0 #111)',
                  }}
                >
                  📍
                </div>
              )}
              {placeMode === 'new' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    right: 6,
                    fontSize: 9,
                    padding: '3px 6px',
                    background: 'rgba(255,255,255,0.85)',
                    border: '2px solid #111',
                    textAlign: 'center',
                    fontFamily: gbStyles.fontEn,
                  }}
                >
                  지도를 움직여 핀 위치를 정해주세요
                </div>
              )}
            </div>
          </PixelBorder>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <ModeToggle active={placeMode === 'existing'} onClick={() => setPlace('existing')}>
              이미 있음
            </ModeToggle>
            <ModeToggle active={placeMode === 'new'} onClick={() => setPlace('new')}>
              새 장소
            </ModeToggle>
          </div>

          {placeMode === 'existing' ? (
            <PixelBorder color="#111" bg="var(--paper-2)" padding={0}>
              <button
                onClick={() => setPicker((o) => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: gbStyles.font,
                  textAlign: 'left',
                }}
              >
                <TypePin type={open?.type ?? '카드샵'} size={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{open?.name ?? '매장 선택'}</div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.7,
                      fontFamily: gbStyles.fontEn,
                    }}
                  >
                    {open ? `${open.type} · ${open.addr}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 6px',
                    border: '2px solid #111',
                    background: 'var(--paper)',
                  }}
                >
                  변경 ▼
                </span>
              </button>
              {pickerOpen && (
                <div style={{ borderTop: '2px solid #111' }}>
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'var(--paper)',
                      borderBottom: '1px dashed rgba(0,0,0,0.2)',
                    }}
                  >
                    <PixelBorder color="#111" bg="var(--paper)" padding={0}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 8px',
                        }}
                      >
                        <span style={{ fontSize: 11, opacity: 0.6 }}>Q</span>
                        <input
                          autoFocus
                          value={pickerQ}
                          onChange={(e) => setPickerQ(e.target.value)}
                          placeholder="매장 이름 / 주소 검색"
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontFamily: gbStyles.font,
                            fontSize: 11,
                          }}
                        />
                        {pickerQ && (
                          <button
                            onClick={() => setPickerQ('')}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </PixelBorder>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {(() => {
                      const list = pickerQ
                        ? SHOPS.filter(
                            (s) =>
                              s.name.includes(pickerQ) ||
                              s.addr.includes(pickerQ) ||
                              s.type.includes(pickerQ),
                          )
                        : SHOPS.slice(0, 50)
                      if (list.length === 0)
                        return (
                          <div
                            style={{
                              padding: 16,
                              textAlign: 'center',
                              fontSize: 11,
                              color: 'var(--ink-2)',
                            }}
                          >
                            검색 결과가 없어요. <br />
                            「새 장소」로 등록해보세요.
                          </div>
                        )
                      return list.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setShopId(s.id)
                            setPicker(false)
                            setPickerQ('')
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            background: s.id === shopId ? '#D9D7CF' : 'var(--paper)',
                            color: '#111',
                            border: 'none',
                            borderBottom: '1px dashed rgba(0,0,0,0.15)',
                            fontFamily: gbStyles.font,
                            fontSize: 11,
                          }}
                        >
                          <TypePin type={s.type} size={12} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 11,
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
                                fontSize: 9,
                                opacity: 0.65,
                                fontFamily: gbStyles.fontEn,
                              }}
                            >
                              {s.addr}
                            </div>
                          </div>
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </PixelBorder>
          ) : (
            <PixelBorder color="#111" bg="var(--paper-2)" padding={10}>
              <Field label="이름">
                <PixelInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 40))}
                  placeholder="예) 카드매니아 강남점"
                />
              </Field>
              <Field label="주소">
                <PixelInput
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value.slice(0, 80))}
                  placeholder="(선택) 도로명 주소"
                />
              </Field>
              <Field label="분류">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {SHOP_TYPES.map((t) => {
                    const on = newType === t
                    return (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        style={{
                          fontSize: 9,
                          padding: '3px 6px',
                          border: '2px solid #111',
                          background: on ? '#111' : 'var(--paper)',
                          color: on ? '#FAFAF7' : '#111',
                          letterSpacing: 1,
                          cursor: 'pointer',
                          fontFamily: gbStyles.font,
                        }}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.6,
                  marginTop: 6,
                  fontFamily: gbStyles.fontEn,
                }}
              >
                좌표: {newCoord.lat.toFixed(5)}, {newCoord.lng.toFixed(5)}
              </div>
            </PixelBorder>
          )}
        </div>

        {/* 2. 카테고리 */}
        <div>
          <SectionLabel n="02" label="카테고리 / TYPE" />
          <div style={{ display: 'flex', gap: 8 }}>
            <CategoryCard
              active={category === '소식'}
              onClick={() => setCat('소식')}
              icon="mega"
              title="소식"
              en="news"
              sub="신상 입고 / 재고 알림"
            />
            <CategoryCard
              active={category === '질문'}
              onClick={() => setCat('질문')}
              icon="card"
              title="질문"
              en="ask"
              sub="다른 트레이너에게"
            />
          </div>
        </div>

        {/* 3. 빠른 태그 (only for 소식) */}
        {category === '소식' && (
          <div>
            <SectionLabel n="03" label="빠른 태그 / TAG" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stockTags.map((t) => {
                const on = stockTag === t
                return (
                  <button
                    key={t}
                    onClick={() => setStock(on ? '' : t)}
                    style={{
                      fontSize: 10,
                      padding: '4px 8px',
                      border: '2px solid #111',
                      background: on ? 'var(--red)' : 'var(--paper)',
                      color: on ? '#FAFAF7' : '#111',
                      cursor: 'pointer',
                      fontFamily: gbStyles.font,
                      letterSpacing: 1,
                    }}
                  >
                    {on ? '☑ ' : '+ '}
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 4. 본문 */}
        <div>
          <SectionLabel n={category === '소식' ? '04' : '03'} label="내용 / BODY" />
          <PixelBorder color="#111" bg="var(--paper)" padding={0}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 280))}
              placeholder={
                category === '소식'
                  ? '예) 오늘 14시쯤 신상 박스 12개 입고됐어요. 1인 2박스 제한이래요.'
                  : '예) 자판기 #14 재입고 언제쯤일까요?'
              }
              style={{
                width: '100%',
                minHeight: 90,
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                padding: 10,
                boxSizing: 'border-box',
                fontFamily: gbStyles.font,
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--ink)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderTop: '2px solid #111',
                padding: '4px 8px',
                background: 'var(--paper-2)',
                gap: 8,
              }}
            >
              <PixelMiniBtn>📷 사진</PixelMiniBtn>
              <PixelMiniBtn>@ 매장태그</PixelMiniBtn>
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 9,
                  color: 'var(--ink-2)',
                  fontFamily: gbStyles.fontEn,
                }}
              >
                {body.length}/280
              </span>
            </div>
          </PixelBorder>
        </div>

        {err && (
          <div
            style={{
              padding: '8px 10px',
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

        <div style={{ height: 8 }} />
      </div>

      <GBTabBar active="community" />

      {/* 등록 성공 모달 — 탭바는 안 가리도록 bottom 여백 + 사용자 직접 닫기 */}
      {showSuccess && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 60, // GBTabBar 영역 비워두기
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setShowSuccess(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PixelBorder color="#111" bg="var(--paper)" padding={0}>
              <div
                style={{
                  padding: '24px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 240,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    border: '3px solid #111',
                    background: '#1a8a3e',
                    color: '#FAFAF7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 38,
                    fontWeight: 700,
                    boxShadow: '3px 3px 0 0 #111',
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 1,
                    fontFamily: gbStyles.fontEn,
                    color: '#1a8a3e',
                  }}
                >
                  등록 완료!
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.5 }}>
                  아래 탭바에서 커뮤니티로 이동하거나
                  <br />
                  계속 글을 쓸 수 있어요.
                </div>
                <div style={{ marginTop: 4 }}>
                  <PixelButton
                    sm
                    color="#111"
                    bg="var(--paper)"
                    onClick={() => setShowSuccess(false)}
                  >
                    확인
                  </PixelButton>
                </div>
              </div>
            </PixelBorder>
          </div>
        </div>
      )}
    </div>
  )
}
