import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',   // IPv4 와일드카드 명시 (Windows에서 'true'면 IPv6만 잡히는 경우 있음)
    port: 5173,
    allowedHosts: true, // ngrok 임의 도메인 허용
  },
})
