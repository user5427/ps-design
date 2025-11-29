// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || env.PORT || '4000'
  const backendHost = env.VITE_BACKEND_HOST || 'localhost'
  const backendProtocol = env.VITE_BACKEND_PROTOCOL || 'http'
  const backendTarget = `${backendProtocol}://${backendHost}:${backendPort}`

  return defineConfig({
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
    ],
    server: {
      proxy: {
        '/auth': { target: backendTarget, changeOrigin: true },
        '/me': { target: backendTarget, changeOrigin: true },
        '/api': { target: backendTarget, changeOrigin: true }
      }
    }
  })
}
