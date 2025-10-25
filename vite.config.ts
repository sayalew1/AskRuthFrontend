import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v2/askruth/feed': {
        target: 'https://ai-message-web.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      '/api/v2/askruth/story': {
        target: 'https://ai-message-web.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      '/api/v2/askruth/campaign-filters': {
        target: 'https://ai-message-web.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
