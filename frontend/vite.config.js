import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',  // <--- importante para producción
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // solo para desarrollo local
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
