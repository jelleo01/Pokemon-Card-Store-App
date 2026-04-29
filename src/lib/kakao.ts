// Kakao Maps SDK helpers — geocode / reverseGeocode / haversine /
// directions URL / geolocation. The SDK script tag is injected in
// main.tsx; loadKakao() resolves once kakao.maps.load() has fired so
// callers don't have to deal with the autoload=false dance themselves.

import type { Shop } from '@/lib/data'

export interface LatLng {
  lat: number
  lng: number
}

export interface KakaoRegion {
  city: string
  district: string
  dong: string
}

let loadPromise: Promise<void> | null = null

export function loadKakao(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const tryLoad = (attempt = 0) => {
      const k = (window as unknown as { kakao?: typeof kakao }).kakao
      if (k && k.maps && typeof k.maps.load === 'function') {
        k.maps.load(() => resolve())
        return
      }
      if (attempt > 100) {
        reject(new Error('Kakao Maps SDK did not load. Check VITE_KAKAO_MAP_KEY and that localhost is registered in Kakao developer console.'))
        return
      }
      setTimeout(() => tryLoad(attempt + 1), 50)
    }
    tryLoad()
  })

  return loadPromise
}

export async function geocode(addr: string): Promise<LatLng | null> {
  await loadKakao()
  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) })
      } else {
        resolve(null)
      }
    })
  })
}

export interface KakaoPlace {
  id: string
  name: string
  addr: string
  category: string
  lat: number
  lng: number
}

export async function searchPlaces(query: string, size = 10): Promise<KakaoPlace[]> {
  if (!query.trim()) return []
  await loadKakao()
  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    places.keywordSearch(
      query,
      (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(
            result.slice(0, size).map((d) => ({
              id: d.id,
              name: d.place_name,
              addr: d.road_address_name || d.address_name || '',
              category: d.category_name || '',
              lat: parseFloat(d.y),
              lng: parseFloat(d.x),
            })),
          )
        } else {
          resolve([])
        }
      },
      { size },
    )
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<KakaoRegion | null> {
  await loadKakao()
  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.coord2RegionCode(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const r = result.find((x) => x.region_type === 'H') || result[0]
        if (!r) {
          resolve(null)
          return
        }
        resolve({
          city: r.region_1depth_name,
          district: r.region_2depth_name,
          dong: r.region_3depth_name,
        })
      } else {
        resolve(null)
      }
    })
  })
}

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function getDirectionsUrl(shop: Pick<Shop, 'name' | 'lat' | 'lng'>): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(shop.name)},${shop.lat},${shop.lng}`
}

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보 지원이 없어요.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || '위치 권한이 거부됐어요.')),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}
