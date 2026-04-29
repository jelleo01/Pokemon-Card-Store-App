import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App'
import './styles/index.css'

const queryClient = new QueryClient()

// Kakao Maps SDK — dynamic load. Vite doesn't substitute %VARS% inside
// index.html, so we inject the script tag here. autoload=false means
// the runtime won't initialize until a component calls kakao.maps.load().
const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined
if (KAKAO_KEY && !document.getElementById('kakao-maps-sdk')) {
  const script = document.createElement('script')
  script.id = 'kakao-maps-sdk'
  script.async = true
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services,clusterer`
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
