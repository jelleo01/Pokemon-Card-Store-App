# 카카오맵 통합 가이드

## 1. API 키 발급
1. [developers.kakao.com](https://developers.kakao.com) 가입
2. 내 애플리케이션 → 새 애플리케이션 → 앱 생성
3. **JavaScript 키** 복사 → `.env.local` 의 `VITE_KAKAO_MAP_KEY` 에 저장
4. **플랫폼** 등록:
   - Web 플랫폼 추가
   - 사이트 도메인: `http://localhost:5173`, 배포 도메인 (예: `https://yourapp.com`)
5. **카카오맵 API 활성화**:
   - 제품 → 카카오맵 → 활성화 ON

## 2. SDK 로드

`index.html` 의 `<head>` 에 추가:
```html
<script
  type="text/javascript"
  src="//dapi.kakao.com/v2/maps/sdk.js?appkey=%VITE_KAKAO_MAP_KEY%&autoload=false&libraries=services,clusterer"
></script>
```

> **주의**: `autoload=false` 로 두고 React에서 명시적으로 `kakao.maps.load()` 호출. `libraries=services` 가 있어야 Geocoder/Places 사용 가능.

Vite는 `%VARNAME%` 치환 안 함 → 대신:
```ts
// src/main.tsx 진입점에서 동적 로드
const script = document.createElement('script');
script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;
script.async = true;
document.head.appendChild(script);
```

## 3. 타입 정의 (`src/types/kakao.d.ts`)
```ts
declare global {
  interface Window {
    kakao: typeof kakao;
  }
  namespace kakao.maps {
    class Map { constructor(container: HTMLElement, options: MapOptions); setCenter(latlng: LatLng): void; setLevel(level: number): void; }
    class LatLng { constructor(lat: number, lng: number); }
    class Marker { constructor(options: MarkerOptions); setMap(map: Map | null): void; }
    class CustomOverlay { constructor(options: any); setMap(map: Map | null): void; }
    interface MapOptions { center: LatLng; level: number; }
    interface MarkerOptions { position: LatLng; map?: Map; }
    function load(callback: () => void): void;
    namespace services {
      class Geocoder {
        addressSearch(addr: string, cb: (result: any[], status: string) => void): void;
        coord2RegionCode(lng: number, lat: number, cb: (result: any[], status: string) => void): void;
      }
      const Status: { OK: string; ZERO_RESULT: string; ERROR: string };
    }
  }
}
export {};
```

## 4. Map 컴포넌트 패턴 (`src/components/shop/KakaoMap.tsx`)

```tsx
import { useEffect, useRef } from 'react';
import type { Shop } from '@/types';

interface Props {
  center: { lat: number; lng: number };
  shops: Shop[];
  onPinClick?: (shop: Shop) => void;
}

export function KakaoMap({ center, shops, onPinClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);

  useEffect(() => {
    if (!window.kakao || !ref.current) return;
    window.kakao.maps.load(() => {
      mapRef.current = new kakao.maps.Map(ref.current!, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
      });
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = shops.map((s, i) => {
      const html = `
        <div class="pixel-pin" data-type="${s.type}">
          <span class="pin-num">#${String(i + 1).padStart(3, '0')}</span>
          <span class="pin-name">${s.name}</span>
        </div>`;
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(s.lat, s.lng),
        content: html,
        yAnchor: 1,
      });
      overlay.setMap(mapRef.current);
      return overlay;
    });
  }, [shops]);

  return <div ref={ref} className="w-full h-full" />;
}
```

> 픽셀 스타일 핀은 `CustomOverlay` 로 임의 HTML 삽입 가능. Marker는 이미지 핀이라 픽셀 보더 표현 어려움.

## 5. Geocoding (주소 → 좌표)

```ts
export function geocode(addr: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else {
        resolve(null);
      }
    });
  });
}
```

## 6. Reverse geocoding (좌표 → 시/구/동)

```ts
export function reverseGeocode(lat: number, lng: number): Promise<{ city: string; district: string; dong: string } | null> {
  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const r = result.find((x: any) => x.region_type === 'H') || result[0];
        resolve({
          city: r.region_1depth_name,       // "서울특별시"
          district: r.region_2depth_name,   // "강남구"
          dong: r.region_3depth_name,       // "역삼동"
        });
      } else {
        resolve(null);
      }
    });
  });
}
```

## 7. 길찾기 (외부 링크)

카카오맵 길찾기 URL — 별도 API 키 필요 없음:
```ts
export function getDirectionsUrl(shop: Shop) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(shop.name)},${shop.lat},${shop.lng}`;
}
```

GO ▶ 버튼:
```tsx
<a href={getDirectionsUrl(shop)} target="_blank" rel="noreferrer">GO ▶</a>
```

## 8. 거리 계산 (Haversine)

```ts
export function haversine(a: {lat:number; lng:number}, b: {lat:number; lng:number}) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));   // km
}
```

또는 Supabase의 `shops_near(lat, lng)` RPC 사용 (서버 계산).

## 9. Geolocation (현재 위치)

```ts
export function getCurrentPosition(): Promise<{lat:number; lng:number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject('지원 안함');
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

권한 거부 시 → `LocationSearchPage` 에서 수동 선택 fallback.

## 10. Lovable에서 사용
1. 채팅에 "Add Kakao Map SDK to index.html" 요청 → Lovable이 `<script>` 태그 삽입
2. 카카오맵 API 키는 Lovable의 Secrets 메뉴에서 추가 (`VITE_KAKAO_MAP_KEY`)
3. 위 KakaoMap 컴포넌트 코드를 채팅에 붙여넣기 → Lovable이 통합
4. 도메인 등록: Lovable의 preview URL (예: `https://abc-123.lovableproject.com`) 도 카카오 개발자센터의 플랫폼 도메인에 추가해야 함

## 11. Troubleshooting
| 증상 | 원인 / 해결 |
|---|---|
| `kakao is not defined` | SDK 로드 전에 호출. `kakao.maps.load(()=>{})` 안에서 사용. |
| 지도 회색 | 도메인 미등록. 카카오 개발자센터 → 플랫폼 → Web 도메인 추가. |
| Geocoder 동작 안 함 | `libraries=services` 가 SDK URL에 빠짐. |
| 핀 위치 어긋남 | `LatLng(lat, lng)` 순서 vs `coord2RegionCode(lng, lat)` 순서 헷갈림 주의. |
| 모바일에서 핀치줌 막힘 | `index.html` `<meta viewport>` 의 `user-scalable=no` 제거. |

## 12. 비용
- 카카오맵 무료 한도: **일 30만 건** (거의 모든 MVP 충분)
- Geocoding API: **일 30만 건 무료**, 초과 시 정지
- 무료 한도 초과 시 사전 등록한 카드로 자동 결제 (월 약 ₩100,000부터)
