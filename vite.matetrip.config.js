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
    },
  },
  server: {
    port: 3002,
  },
})
