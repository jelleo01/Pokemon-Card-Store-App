// Minimal Kakao Maps SDK type declarations.
// SDK is loaded as a global script in main.tsx; this file just teaches
// TypeScript about the bits we use. Anything not declared here can be
// reached through (window.kakao as any).

export {}

declare global {
  interface Window {
    kakao: typeof kakao
  }

  namespace kakao.maps {
    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setCenter(latlng: LatLng): void
      getCenter(): LatLng
      setLevel(level: number): void
      getLevel(): number
      setDraggable(draggable: boolean): void
      setZoomable(zoomable: boolean): void
      relayout(): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions)
      setMap(map: Map | null): void
      setPosition(position: LatLng): void
      getPosition(): LatLng
    }

    interface MapOptions {
      center: LatLng
      level: number
      draggable?: boolean
      scrollwheel?: boolean
      disableDoubleClick?: boolean
      disableDoubleClickZoom?: boolean
    }

    interface CustomOverlayOptions {
      position: LatLng
      content: string | HTMLElement
      xAnchor?: number
      yAnchor?: number
      zIndex?: number
      clickable?: boolean
    }

    function load(callback: () => void): void

    namespace services {
      class Geocoder {
        addressSearch(
          addr: string,
          cb: (result: GeocodeAddressResult[], status: string) => void,
        ): void
        coord2RegionCode(
          lng: number,
          lat: number,
          cb: (result: RegionCodeResult[], status: string) => void,
        ): void
      }

      class Places {
        keywordSearch(
          query: string,
          cb: (result: PlaceSearchResult[], status: string, pagination: unknown) => void,
          options?: PlaceSearchOptions,
        ): void
      }

      interface PlaceSearchOptions {
        location?: LatLng
        radius?: number
        size?: number
        page?: number
      }

      interface PlaceSearchResult {
        id: string
        place_name: string
        category_name: string
        address_name: string
        road_address_name: string
        phone: string
        x: string // lng
        y: string // lat
        place_url: string
      }

      interface GeocodeAddressResult {
        address_name: string
        x: string // lng
        y: string // lat
      }

      interface RegionCodeResult {
        region_type: 'B' | 'H'
        region_1depth_name: string
        region_2depth_name: string
        region_3depth_name: string
      }

      const Status: { OK: string; ZERO_RESULT: string; ERROR: string }
    }
  }
}
