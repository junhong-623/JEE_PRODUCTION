import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Serves cheers.html for any SPA route (e.g. /products, /orders) so F5 works in dev
function cheersSpaFallback() {
  return {
    name: 'cheers-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        // Pass through: Vite internals, asset/file requests, other app HTML entries
        if (
          url.startsWith('/@') ||
          url.includes('.') ||
          url === '/' ||
          url.startsWith('/index') ||
          url.startsWith('/jsave') ||
          url.startsWith('/matetrip')
        ) return next()
        // Everything else is a Cheers SPA route → serve cheers.html
        req.url = '/cheers.html'
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), cheersSpaFallback()],
  server: {
    port: 3000,
  },
})
