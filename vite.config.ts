import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `npm run dev:server` menjalankan API di :3001; di produksi keduanya satu domain (Vercel).
  server: { proxy: { '/api': 'http://localhost:3001' } },
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
})
