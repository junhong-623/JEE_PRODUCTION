import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'matetrip-root-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html') req.url = '/matetrip.html'
          next()
        })
      },
    },
  ],
  publicDir: 'public-matetrip',
  build: {
    outDir: 'dist-matetrip',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'matetrip.html') },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@firebase') || id.includes('/firebase/')) return 'firebase-vendor'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) return 'react-vendor'
          return undefined
        },
      },
    },
  },
  server: {
    port: 3002,
  },
})
