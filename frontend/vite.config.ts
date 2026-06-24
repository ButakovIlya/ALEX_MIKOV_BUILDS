import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

declare const process: { env: Record<string, string | undefined> }

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'
const storageProxyTarget = process.env.VITE_STORAGE_PROXY_TARGET ?? 'http://localhost:9000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/storage': {
        target: storageProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage/, ''),
      },
    },
  },
})
