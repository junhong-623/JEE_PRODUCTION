import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'jsave-root-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html') req.url = '/jsave.html'
          next()
        })
      },
    },
  ],
  publicDir: 'public-jsave',
  build: {
    outDir: 'dist-jsave',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'jsave.html') },
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
    port: 3001,
  },
})
