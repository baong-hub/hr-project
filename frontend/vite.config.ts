import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:5082',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5082',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5082',
        changeOrigin: true,
      },
      '/recordings': {
        target: 'http://localhost:5082',
        changeOrigin: true,
      }
    }
  }
})
