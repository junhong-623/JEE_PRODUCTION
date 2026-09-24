import puppeteer from 'puppeteer'
import sharp from 'sharp'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(join(here, 'launch-carousel.html')).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  for (let index = 1; index <= 5; index += 1) {
    const slide = await page.$(`#slide-${index}`)
    if (!slide) throw new Error(`Missing slide ${index}`)
    const screenshot = await slide.screenshot()
    await sharp(screenshot)
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(join(here, `launch-${String(index).padStart(2, '0')}.jpg`))
  }
} finally {
  await browser.close()
}
