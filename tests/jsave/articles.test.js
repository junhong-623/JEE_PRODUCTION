import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../../src/jsave/data/articles'
import { ARTICLE_SUMMARIES, articleHref, articleRoute } from '../../src/jsave/data/articleRoutes'

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

describe('JSave long-form guides', () => {
  it('publishes three substantial bilingual articles', () => {
    expect(ARTICLES).toHaveLength(3)
    expect(ARTICLE_SUMMARIES).toHaveLength(3)

    for (const article of ARTICLES) {
      for (const language of ['en', 'zh']) {
        const copy = article.locales[language]
        const articleText = copy.sections
          .flatMap(section => [section.title, ...section.paragraphs, ...(section.list || [])])
          .join(' ')

        expect(copy.title).toBeTruthy()
        expect(copy.deck.length).toBeGreaterThan(language === 'zh' ? 45 : 150)
        expect(copy.sections.length).toBeGreaterThanOrEqual(7)
        expect(copy.sources.length).toBeGreaterThanOrEqual(2)
        expect(articleText.length).toBeGreaterThan(language === 'zh' ? 1600 : 4500)
        expect(ARTICLE_SUMMARIES.find(item => item.slug === article.slug)).toMatchObject({
          image: article.image,
          locales: { [language]: { title: copy.title, deck: copy.deck } },
        })
      }
    }
  })

  it('matches only localized known article routes', () => {
    expect(articleRoute('/zh/articles/malaysia-daily-budget/')).toEqual({
      language: 'zh',
      slug: 'malaysia-daily-budget',
    })
    expect(articleRoute('/en/articles/not-a-guide/')).toBeNull()
    expect(articleHref('offline-expense-tracking', 'en')).toBe('/en/articles/offline-expense-tracking/')
  })

  it('lists every localized article in the sitemap and llms guide', () => {
    const sitemap = read('public-jsave/sitemap.xml')
    const llms = read('public-jsave/llms.txt')

    for (const article of ARTICLES) {
      for (const language of ['en', 'zh']) {
        expect(sitemap).toContain(`https://jsave.jeeprod.com${articleHref(article.slug, language)}`)
      }
      expect(llms).toContain(`articles/${article.slug}/`)
    }
  })
})
