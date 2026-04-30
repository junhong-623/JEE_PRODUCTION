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
    },
  },
  server: {
    port: 3001,
  },
})
