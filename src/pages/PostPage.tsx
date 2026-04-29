import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { SHOPS, SHOP_TYPES } from '@/lib/data'
import { gbStyles } from '@/lib/gbStyles'
import type { LatLng } from '@/lib/kakao'

const NEW_PIN_DEFAULT: LatLng = { lat: 37.5009, lng: 127.0367 }

type PlaceMode = 'existing' | 'new'
type Category = '소식' | '질문'

export default function PostPage() {
  const navigate = useNavigate()
  const [placeMode, setPlace] = useState<PlaceMode>('existing')
  const [shopId, setShopId] = useState('PC-001')
  const [category, setCat] = useState<Category>('소식')
  const [stockTag, setStock] = useState('')
  const [body, setBody] = useState('')
  const [pickerOpen, setPicker] = useState(false)
  const [pickerQ, setPickerQ] = useState('')

  const open = SHOPS.find((s) => s.id === shopId)!
  const stockTags = ['신상 박스 입고', '잔여 적음', '품절', '재입고 예정', '싱글 카드']

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
          <PixelButton sm color="#111" bg="var(--red)" fg="#FAFAF7">
            등록 ▶
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
                height: 100,
                overflow: 'hidden',
                background: '#EEECE2',
              }}
            >
              <KakaoMap
                center={
                  placeMode === 'existing' && open
                    ? { lat: open.lat, lng: open.lng }
                    : NEW_PIN_DEFAULT
                }
                level={4}
                interactive={false}
                simplePins
                shops={placeMode === 'existing' && open ? [open] : []}
                newPin={placeMode === 'new' ? NEW_PIN_DEFAULT : null}
              />
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
                <TypePin type={open.type} size={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{open.name}</div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.7,
                      fontFamily: gbStyles.fontEn,
                    }}
                  >
                    {open.dist}km · {open.type} · {open.addr}
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
                        : SHOPS
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
                          <span
                            style={{
                              fontSize: 9,
                              opacity: 0.7,
                              fontFamily: gbStyles.fontEn,
                            }}
                          >
                            {s.dist}km
                          </span>
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
                <PixelInput placeholder="예) 카드매니아 강남점" />
              </Field>
              <Field label="주소">
                <PixelInput placeholder="지도에서 ▶ 핀 위치 지정" />
              </Field>
              <Field label="분류">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {SHOP_TYPES.map((t, i) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 9,
                        padding: '3px 6px',
                        border: '2px solid #111',
                        background: i === 3 ? '#111' : 'var(--paper)',
                        color: i === 3 ? '#FAFAF7' : '#111',
                        letterSpacing: 1,
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Field>
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
              onChange={(e) => setBody(e.target.value)}
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

        <div style={{ height: 8 }} />
      </div>

      <GBTabBar active="community" />
    </div>
  )
}
