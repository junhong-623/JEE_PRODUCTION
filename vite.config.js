import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@firebase') || id.includes('/firebase/')) return 'firebase-vendor'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/react-helmet-async/') ||
            id.includes('/scheduler/')
          ) return 'react-vendor'
          return undefined
        },
      },
    },
  },
  server: {
    port: 3000,
  },
})
