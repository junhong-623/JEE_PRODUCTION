import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
