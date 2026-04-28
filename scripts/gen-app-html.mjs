/**
 * Generates per-app HTML entry points from dist/index.html.
 * Each app gets its own HTML file with the correct manifest link baked in,
 * so Chrome reads the right PWA manifest before JavaScript runs.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const DIST = 'dist'

const APPS = [
  {
    name: 'jsave',
    out: 'jsave.html',
    manifest: '/jsave/manifest.json',
    themeColor: '#10b981',
    title: 'JSave — J-Save, J-Joy',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  },
  {
    name: 'jsave-intro',
    out: 'jsave-intro.html',
    manifest: '/jsave/manifest.json',
    themeColor: '#10b981',
    title: 'JSave — J-Save, J-Joy',
  },
  // Add more apps here as needed
]

const html = readFileSync(join(DIST, 'index.html'), 'utf8')

for (const app of APPS) {
  let out = html
    .replace(
      /(<link[^>]+data-app-manifest[^>]+href=")[^"]*(")/,
      `$1${app.manifest}$2`
    )
    .replace(
      /(<meta[^>]+name="theme-color"[^>]+content=")[^"]*(")/,
      `$1${app.themeColor}$2`
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${app.title}</title>`)

  if (app.viewport) {
    out = out.replace(
      /(<meta[^>]+name="viewport"[^>]+content=")[^"]*(")/,
      `$1${app.viewport}$2`
    )
  }

  writeFileSync(join(DIST, app.out), out, 'utf8')
  console.log(`[gen-app-html] wrote dist/${app.out} (manifest: ${app.manifest})`)
}
