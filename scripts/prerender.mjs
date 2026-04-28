/**
 * Prerender script — saves fully-rendered HTML for key static pages.
 * Run after `vite build`: node scripts/prerender.mjs
 *
 * Pages prerendered:
 *   /              → dist/index.html (overwrite with rendered version)
 *   /mall/intro    → dist/mall/intro/index.html
 *   /matetrip/intro → dist/matetrip/intro/index.html
 */

import puppeteer from 'puppeteer'
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROUTES = ['/', '/mall/intro', '/matetrip/intro', '/matetrip']
const PORT   = 4173   // vite preview default port
const DIST   = 'dist'

// ── 1. Start vite preview server ──────────────────────────────────────────
console.log('Starting preview server...')
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
  shell: true,
  stdio: 'pipe',
})
server.stderr.on('data', d => process.stdout.write(d))

// Give the server 3 seconds to boot
await new Promise(r => setTimeout(r, 3000))

// ── 2. Launch Puppeteer ───────────────────────────────────────────────────
console.log('Launching browser...')
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

// ── 3. Render each route ──────────────────────────────────────────────────
for (const route of ROUTES) {
  console.log(`\nRendering ${route} ...`)
  const page = await browser.newPage()

  try {
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'load',
      timeout: 30000,
    })

    // Wait for React + Firebase data to finish rendering
    await new Promise(r => setTimeout(r, 5000))

    let html = await page.content()

    // Replace any localhost references with root-relative paths
    html = html.replace(/http:\/\/localhost:\d+\//g, '/')

    // Save to dist
    const outDir = join(DIST, route === '/' ? '' : route)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8')

    console.log(`✓ Saved → ${join(outDir, 'index.html')}`)
  } catch (err) {
    console.error(`✗ Failed to render ${route}:`, err.message)
  } finally {
    await page.close()
  }
}

// ── 4. Clean up ───────────────────────────────────────────────────────────
await browser.close()
server.kill()
console.log('\nPrerendering complete!')
