import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Asegúrate de que este sea tu backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
