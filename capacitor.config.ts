import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jelleo01.pokemonmap',
  appName: '트레이너 카드샵 맵',
  webDir: 'dist',
  server: {
    iosScheme: 'http',
    // iOS 와 같은 origin(http://localhost) — Kakao 지도 도메인 등록 공유
    androidScheme: 'http',
    hostname: 'localhost',
    allowNavigation: ['*.kakao.com', '*.daumcdn.net', '*.supabase.co'],
  },
  ios: {
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#FAFAF7',
  },
  android: {
    backgroundColor: '#FAFAF7',
    // apple-sign-in 플러그인은 iOS 전용으로 사용 (Android 는 OAuth 브라우저 플로우)
    includePlugins: ['@capacitor/app', '@capacitor/browser', '@capacitor/share'],
  },
};

export default config;
