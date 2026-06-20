import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jelleo01.pokemonmap',
  appName: '트레이너 카드샵 맵',
  webDir: 'dist',
  server: {
    iosScheme: 'http',
    hostname: 'localhost',
    allowNavigation: ['*.kakao.com', '*.daumcdn.net', '*.supabase.co'],
  },
  ios: {
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
