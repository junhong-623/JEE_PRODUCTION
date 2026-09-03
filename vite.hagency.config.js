import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'hagency-root-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url || ''
          if (
            req.method === 'GET' &&
            !url.startsWith('/@') &&
            !url.startsWith('/node_modules') &&
            !url.startsWith('/src') &&
            !url.includes('.') &&
            !url.includes('?')
          ) req.url = '/hagency.html'
          else if (url === '/' || url === '/index.html') req.url = '/hagency.html'
          next()
        })
      },
    },
  ],
  publicDir: 'public-hagency',
  build: {
    outDir: 'dist-hagency',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'hagency.html') },
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
  server: { port: 3004 },
})
