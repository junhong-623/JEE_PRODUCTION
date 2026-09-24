import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '../../public-jsave/icons/icon-512.png')
const output = resolve(here, 'jsave-instagram-avatar.png')

await mkdir(here, { recursive: true })

const size = 1080
const logoSize = 730
// The existing app icon has a checkerboard baked into its pale background.
// Keep only its green logo by measuring its green chroma, then recolor it white.
const { data, info } = await sharp(source).resize(logoSize, logoSize).raw().toBuffer({ resolveWithObject: true })
const pixels = Buffer.alloc(logoSize * logoSize * 4)
for (let sourceOffset = 0, targetOffset = 0; sourceOffset < data.length; sourceOffset += info.channels, targetOffset += 4) {
  const red = data[sourceOffset]
  const green = data[sourceOffset + 1]
  const alpha = Math.max(0, Math.min(255, (green - red - 2) * 4))
  pixels[targetOffset] = 255
  pixels[targetOffset + 1] = 255
  pixels[targetOffset + 2] = 255
  pixels[targetOffset + 3] = alpha
}
const whiteLogo = await sharp(pixels, { raw: { width: logoSize, height: logoSize, channels: 4 } }).png().toBuffer()

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="glow" cx="35%" cy="22%" r="80%">
      <stop offset="0" stop-color="#168562"/>
      <stop offset=".58" stop-color="#087f5b"/>
      <stop offset="1" stop-color="#07543f"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <circle cx="540" cy="540" r="506" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="2"/>
</svg>`)

await sharp(background)
  .composite([{ input: whiteLogo, left: (size - logoSize) / 2, top: (size - logoSize) / 2 }])
  .png()
  .toFile(output)

console.log(output)
