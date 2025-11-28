// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/me': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})