// Kakao Maps wrapper. Renders a real map with pixel-styled CustomOverlay
// pins. Click handling is delegated through the container so the SDK's
// gap (no native CustomOverlay click event) doesn't matter.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
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
    style,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const shopOverlaysRef = useRef<kakao.maps.CustomOverlay[]>([])
  const meOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null)
  const newOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null)

  // Init map once
  useEffect(() => {
    let cancelled = false
    loadKakao()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        })
        // 명시적으로 켜고 끔 — 카카오 SDK가 default true 라도 다른 곳에서
        // 의도치 않게 끄는 경우가 있어서 매번 호출.
        map.setDraggable(interactive)
        map.setZoomable(interactive)
        mapRef.current = map
        // Some browsers paint the canvas before our container has its final
        // size; relayout once after the next frame to avoid blank tiles.
        requestAnimationFrame(() => map.relayout())
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[KakaoMap]', err)
      })
    return () => {
      cancelled = true
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
