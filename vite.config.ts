import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ai-message-web.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
