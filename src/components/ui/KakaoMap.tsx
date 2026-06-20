// Kakao Maps wrapper. Renders a real map with pixel-styled CustomOverlay
// pins. Click handling is delegated through the container so the SDK's
// gap (no native CustomOverlay click event) doesn't matter.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { Shop } from '@/lib/data'
import type { LatLng } from '@/lib/kakao'
import { loadKakao } from '@/lib/kakao'
import {
  mePinHtml,
  newPinHtml,
  selectedShopPinHtml,
  shopPinHtml,
} from '@/lib/mapMarkers'

export interface KakaoMapHandle {
  zoomIn: () => void
  zoomOut: () => void
  panTo: (latlng: LatLng) => void
  setCenter: (latlng: LatLng) => void
  relayout: () => void
}

interface KakaoMapProps {
  center: LatLng
  level?: number
  shops?: Shop[]
  openId?: string | null
  me?: LatLng | null
  newPin?: LatLng | null
  interactive?: boolean
  /** When true, pins are simple labels (no TypePin), used for PostPage minimap */
  simplePins?: boolean
  onPinClick?: (id: string) => void
  onMeClick?: () => void
  /** Fired after the user finishes panning/zooming. Use to read map center. */
  onIdle?: (center: LatLng) => void
  /** Fired when the user taps an empty area of the map (not on a pin). */
  onMapClick?: (latlng: LatLng) => void
  style?: CSSProperties
}

const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  {
    center,
    level = 4,
    shops,
    openId,
    me,
    newPin,
    interactive = true,
    simplePins = false,
    onPinClick,
    onMeClick,
    onIdle,
    onMapClick,
    style,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const shopOverlaysRef = useRef<kakao.maps.CustomOverlay[]>([])
  const meOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null)
  const newOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null)
  const [mapErr, setMapErr] = useState<string | null>(null)

  // Init map once
  useEffect(() => {
    let cancelled = false
    let initTid: ReturnType<typeof setTimeout>

    loadKakao()
      .then(() => {
        if (cancelled) return
        // Defer to a new task (not just a microtask) so iOS WKWebView finishes
        // CSS layout — especially important when the map is inside overflow:auto.
        initTid = setTimeout(() => {
          if (cancelled || !containerRef.current) return
          const el = containerRef.current
          const map = new kakao.maps.Map(el, {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level,
          })
          map.setDraggable(interactive)
          map.setZoomable(interactive)
          mapRef.current = map
          // Single early relayout so Kakao re-measures the container.
          // Must fire before GPS can return (~500ms+) to avoid tile flicker.
          requestAnimationFrame(() => { if (mapRef.current) map.relayout() })
        }, 0)
      })
      .catch((err) => {
        console.error('[KakaoMap]', err)
        if (!cancelled) setMapErr(String(err?.message || '카카오 지도를 불러오지 못했어요.\n카카오 개발자 콘솔 → 앱 → 플랫폼 → Web에 http://localhost 를 등록해주세요.'))
      })
    return () => {
      cancelled = true
      clearTimeout(initTid)
      shopOverlaysRef.current.forEach((o) => o.setMap(null))
      shopOverlaysRef.current = []
      meOverlayRef.current?.setMap(null)
      meOverlayRef.current = null
      newOverlayRef.current?.setMap(null)
      newOverlayRef.current = null
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflect prop changes that should re-center the map (e.g. PostPage minimap
  // changing selected shop).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng))
  }, [center.lat, center.lng])

  // interactive prop 동적 반영 (PostPage 의 placeMode 토글).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setDraggable(interactive)
    map.setZoomable(interactive)
  }, [interactive])

  // 지도가 멈춘 시점에 중심 좌표 콜백 — 새 장소 모드용.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onIdle) return
    const handler = () => {
      const c = map.getCenter()
      onIdle({ lat: c.getLat(), lng: c.getLng() })
    }
    kakao.maps.event.addListener(map, 'idle', handler)
    return () => {
      kakao.maps.event.removeListener(map, 'idle', handler)
    }
  }, [onIdle])

  // 빈 공간 탭 → lat/lng 전달 (새 장소 핀 배치용).
  // CustomOverlay 가 clickable=true 인 경우 그 핀을 탭하면 'click' 이 안 뜸.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return
    const handler = (...args: unknown[]) => {
      const e = args[0] as kakao.maps.MouseEvent
      onMapClick({ lat: e.latLng.getLat(), lng: e.latLng.getLng() })
    }
    kakao.maps.event.addListener(map, 'click', handler)
    return () => {
      kakao.maps.event.removeListener(map, 'click', handler)
    }
  }, [onMapClick])

  // Shop pins
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    shopOverlaysRef.current.forEach((o) => o.setMap(null))
    shopOverlaysRef.current = []
    if (!shops || shops.length === 0) return
    shopOverlaysRef.current = shops.map((s) => {
      const html = simplePins
        ? selectedShopPinHtml(s)
        : shopPinHtml(s, openId === s.id)
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(s.lat, s.lng),
        content: html,
        yAnchor: 1,
        clickable: true,
      })
      overlay.setMap(map)
      return overlay
    })
  }, [shops, openId, simplePins])

  // 내 위치 marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    meOverlayRef.current?.setMap(null)
    meOverlayRef.current = null
    if (!me) return
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(me.lat, me.lng),
      content: mePinHtml(),
      zIndex: 5,
    })
    overlay.setMap(map)
    meOverlayRef.current = overlay
  }, [me?.lat, me?.lng])

  // NEW marker (PostPage new-place mode)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    newOverlayRef.current?.setMap(null)
    newOverlayRef.current = null
    if (!newPin) return
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(newPin.lat, newPin.lng),
      content: newPinHtml(),
      // 컨텐츠 wrapper(0×0)의 origin이 정확히 lat/lng에 오도록 anchor를 좌상단으로.
      xAnchor: 0,
      yAnchor: 0,
      zIndex: 5,
    })
    overlay.setMap(map)
    newOverlayRef.current = overlay
  }, [newPin?.lat, newPin?.lng])

  // Imperative controls for MapControl buttons
  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const m = mapRef.current
        if (!m) return
        m.setLevel(Math.max(1, m.getLevel() - 1))
      },
      zoomOut: () => {
        const m = mapRef.current
        if (!m) return
        m.setLevel(Math.min(14, m.getLevel() + 1))
      },
      setCenter: (latlng) => {
        mapRef.current?.setCenter(new kakao.maps.LatLng(latlng.lat, latlng.lng))
      },
      panTo: (latlng) => {
        mapRef.current?.setCenter(new kakao.maps.LatLng(latlng.lat, latlng.lng))
      },
      relayout: () => {
        mapRef.current?.relayout()
      },
    }),
    [],
  )

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement
    // me marker 우선 — me 클릭 시 panTo 같은 동작
    if (onMeClick && el.closest('[data-me]')) {
      onMeClick()
      return
    }
    if (!onPinClick) return
    const shop = el.closest('[data-shop-id]')
    if (!shop) return
    const id = shop.getAttribute('data-shop-id')
    if (id) onPinClick(id)
  }

  if (mapErr) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEECE2', ...style }}>
        <div style={{ textAlign: 'center', padding: 16, fontSize: 11, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{mapErr}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  )
})

export default KakaoMap
