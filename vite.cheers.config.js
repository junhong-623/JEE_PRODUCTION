import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cheers-root-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html') req.url = '/cheers.html'
          next()
        })
      },
    },
  ],
  publicDir: 'public-cheers',
  build: {
    outDir: 'dist-cheers',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'cheers.html') },
    },
  },
  server: {
    port: 3002,
  },
})
