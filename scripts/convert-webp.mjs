/**
 * Convert content images to WebP.
 * Run once: node scripts/convert-webp.mjs
 *
 * Skips PWA icons (must stay PNG for manifest).
 * Keeps originals in place — WebP files sit alongside them.
 */

import sharp from 'sharp'
import { readdirSync, statSync } from 'node:fs'
import { join, extname, basename, dirname } from 'node:path'

const SKIP = [
  'public/icon',
  'public/matetrip/icons',
  'public/matetrip-admin',
]

const TARGETS = [
  'public/og-image.png',
  'public/mall/screenshot/shop.jpeg',
  'public/mall/screenshot/product.jpeg',
  'public/mall/screenshot/cart.jpeg',
  'public/matetrip/screen-chat.png',
  'public/matetrip/screen-gallery.png',
  'public/matetrip/screen-hero.png',
  'public/matetrip/screen-plan.png',
  'public/matetrip/screen-receipts.png',
  'public/matetrip/screen-report-export.png',
  'public/matetrip/screen-report-person.png',
  'public/matetrip/screen-report-region.png',
  'public/matetrip/screen-summary.png',
  'public/matetrip/screen-trips.png',
]

let saved = 0

for (const rel of TARGETS) {
  const src = join('public', rel.replace(/^public\//, ''))
  const out = join(dirname(src), basename(src, extname(src)) + '.webp')

  try {
    const info = await sharp(src)
      .webp({ quality: 82 })
      .toFile(out)

    const origSize = statSync(src).size
    const saving = Math.round((1 - info.size / origSize) * 100)
    saved += origSize - info.size
    console.log(`✓ ${rel}  →  ${(info.size / 1024).toFixed(0)}KB  (${saving}% smaller)`)
  } catch (err) {
    console.error(`✗ ${rel}: ${err.message}`)
  }
}

console.log(`\nTotal saved: ${(saved / 1024).toFixed(0)}KB`)
