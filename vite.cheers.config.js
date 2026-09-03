import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cheers-root-rewrite',
      configureServer(server) {
        // dev-only: 保存截图到 public-cheers/admin-guide/
        server.middlewares.use('/__save_screenshot', (req, res, next) => {
          if (req.method !== 'POST') return next()
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { name, dataUrl } = JSON.parse(body)
              if (!name || !dataUrl) {
                res.statusCode = 400
                return res.end('missing name or dataUrl')
              }
              const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
              const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
              const dir = resolve(__dirname, 'public-cheers/admin-guide')
              fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(resolve(dir, safeName), Buffer.from(base64, 'base64'))
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true, saved: safeName }))
            } catch (e) {
              res.statusCode = 500
              res.end('error: ' + e.message)
            }
          })
        })
        server.middlewares.use((req, _res, next) => {
          const url = req.url || ''
          // 仅处理无扩展名、且不是 Vite/HMR/API 的路径 → 重写到 cheers.html（SPA fallback）
          if (req.method === 'GET' &&
              !url.startsWith('/@') &&
              !url.startsWith('/__') &&
              !url.startsWith('/node_modules') &&
              !url.startsWith('/src') &&
              !url.includes('.') &&
              !url.includes('?')) {
            req.url = '/cheers.html'
          } else if (url === '/' || url === '/index.html') {
            req.url = '/cheers.html'
          }
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
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@firebase/auth') || id.includes('/firebase/auth')) return 'firebase-auth'
            if (
              id.includes('@firebase/analytics') ||
              id.includes('@firebase/installations') ||
              id.includes('/firebase/analytics')
            ) return 'firebase-analytics'
            if (id.includes('firebase')) return 'firebase'
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('react-helmet-async') ||
              /node_modules\/react\//.test(id)
            ) return 'react-vendor'
          }
        },
      },
    },
  },
  server: {
    port: 3002,
  },
})
