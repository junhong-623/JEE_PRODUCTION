import puppeteer from 'puppeteer'
import sharp from 'sharp'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(join(here, 'reel-cards.html')).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  for (const name of ['opening', 'closing']) {
    const element = await page.$(`#${name}`)
    if (!element) throw new Error(`Missing card: ${name}`)
    const image = await element.screenshot()
    await sharp(image).flatten({ background: '#ffffff' }).jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(join(here, `${name}.jpg`))
  }
} finally {
  await browser.close()
}
