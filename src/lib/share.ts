import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

// Public HTTPS links work outside the native app and on GitHub Pages without
// relying on a server-side route rewrite. Never share localhost from iOS.
const DEFAULT_APP_URL = 'https://jelleo01.github.io/Pokemon-Card-Store-App/'
export function shareUrl(placeId?: string): string {
  const url = new URL(import.meta.env.VITE_PUBLIC_APP_URL || DEFAULT_APP_URL)
  if (url.protocol !== 'https:') throw new Error('공유 주소는 HTTPS여야 해요.')
  if (placeId) url.searchParams.set('place', placeId)
  return url.toString()
}

export async function shareApp(placeId?: string, title = '트레이너 카드샵 맵'): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = shareUrl(placeId)
  const text = placeId ? `${title}의 포켓몬 카드 소식을 확인해 보세요!` : '주변 포켓몬 카드 매장을 찾고 소식을 공유해 보세요!'
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url, dialogTitle: '공유' })
      return 'shared'
    }
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || /cancel/i.test(error.message))) return 'cancelled'
    throw error
  }
  if (!navigator.clipboard) throw new Error('링크를 복사해 공유해 주세요.')
  await navigator.clipboard.writeText(url)
  return 'copied'
}
