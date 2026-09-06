import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

describe('JSave search discovery', () => {
  it('ships useful HTML before JavaScript runs', () => {
    const html = read('jsave.html')

    expect(html).toContain('<link rel="canonical" href="https://jsave.jeeprod.com/"')
    expect(html).toContain('id="jsave-seo-fallback"')
    expect(html).toContain('Offline expense tracking and AA bill splitting')
    expect(html).toContain('"@type": "SoftwareApplication"')
    expect(html).toContain('"@type": "FAQPage"')
  })

  it('publishes crawler rules for search while keeping training opt-out separate', () => {
    const robots = read('public-jsave/robots.txt')

    expect(robots).toMatch(/User-agent: OAI-SearchBot\s+Allow: \//)
    expect(robots).toMatch(/User-agent: GPTBot\s+Disallow: \//)
    expect(robots).toContain('Sitemap: https://jsave.jeeprod.com/sitemap.xml')
  })

  it('lists the default, English and Chinese search pages', () => {
    const sitemap = read('public-jsave/sitemap.xml')

    expect(sitemap).toContain('<loc>https://jsave.jeeprod.com/</loc>')
    expect(sitemap).toContain('<loc>https://jsave.jeeprod.com/en/</loc>')
    expect(sitemap).toContain('<loc>https://jsave.jeeprod.com/zh/</loc>')
    expect(sitemap).toContain('hreflang="x-default"')
    expect(sitemap).toContain('/en/articles/offline-expense-tracking/')
    expect(sitemap).toContain('/zh/articles/malaysia-daily-budget/')
    expect(sitemap).toContain('/en/articles/jsave-vs-expense-apps/')
  })

  it('redirects duplicate Jee Production routes to the canonical product site', () => {
    const firebase = JSON.parse(read('firebase.json'))
    const mainHosting = firebase.hosting.find(site => site.target === 'main')
    const redirects = Object.fromEntries(mainHosting.redirects.map(rule => [rule.source, rule]))

    for (const path of ['/jsave', '/jsave/', '/jsave-intro', '/jsave-intro/']) {
      expect(redirects[path]).toEqual({
        source: path,
        destination: 'https://jsave.jeeprod.com/',
        type: 301,
      })
    }
  })
})
