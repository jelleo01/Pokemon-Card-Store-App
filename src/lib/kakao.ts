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

// 좌표 근처에서 키워드 검색. radius 단위 미터. 거리 가까운 순으로 반환.
export async function searchPlacesNear(
  query: string,
  near: LatLng,
  radius = 200,
  size = 10,
): Promise<KakaoPlace[]> {
  if (!query.trim()) return []
  await loadKakao()
  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    const location = new kakao.maps.LatLng(near.lat, near.lng)
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
      { location, radius, size },
    )
  })
}

// kakao Places categorySearch — 카테고리 코드 기반으로 좌표 근처 장소 검색.
// 브랜드 매장(GS25, CU 등 편의점) 같이 동/구 키워드로는 안 잡히는 장소들을 잡으려고.
async function categorySearchNear(
  code: string,
  near: LatLng,
  radius: number,
): Promise<KakaoPlace[]> {
  await loadKakao()
  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    const location = new kakao.maps.LatLng(near.lat, near.lng)
    places.categorySearch(
      code,
      (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(
            result.map((d) => ({
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
      { location, radius },
    )
  })
}

// 탭 좌표 근처에 등록된 카카오 장소들을 찾아 거리순으로 반환.
// 두 가지 검색을 병렬로 돌려 합침:
//   1) 동/구 이름을 키워드로 keywordSearch — 카드샵, 식당 등 일반 장소
//   2) 흔한 카테고리 코드 categorySearch — 편의점/카페/대형마트 등 브랜드 매장
// id 기준 dedupe + haversine 거리순 정렬.
export async function findPlacesAt(at: LatLng, radius = 40): Promise<KakaoPlace[]> {
  const region = await reverseGeocode(at.lat, at.lng)
  const keyword = region?.dong || region?.district || region?.city || ''

  const tasks: Promise<KakaoPlace[]>[] = []
  if (keyword) tasks.push(searchPlacesNear(keyword, at, radius, 15))
  // CS2 편의점 / FD6 음식점 / CE7 카페 / MT1 대형마트 / BK9 은행 / HP8 병원 /
  // PM9 약국 / CT1 문화시설 / OL7 주유소 / AT4 관광명소 / SW8 지하철역
  for (const code of ['CS2', 'FD6', 'CE7', 'MT1', 'BK9', 'HP8', 'PM9', 'CT1', 'OL7', 'AT4', 'SW8']) {
    tasks.push(categorySearchNear(code, at, radius))
  }

  const results = await Promise.all(tasks)
  const seen = new Set<string>()
  const merged: KakaoPlace[] = []
  for (const list of results) {
    for (const p of list) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      merged.push(p)
    }
  }
  return merged
    .map((p) => ({ p, d: haversine(at, { lat: p.lat, lng: p.lng }) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.p)
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
