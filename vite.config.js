import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // مهم جداً ليتمكن Docker من الوصول للسيرفر
    port: 5173,
    watch: {
      usePolling: true, // ضروري إذا كنت تستخدم Windows وتريد انعكاس التغييرات فوراً داخل Docker
    },
  },
})