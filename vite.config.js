import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/suwayomi': {
        target: 'http://127.0.0.1:4567',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/suwayomi/, ''),
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
