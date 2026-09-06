import { useEffect, useMemo, useState } from 'react'
import { ARTICLES, getArticle } from '../data/articles'
import { articleHref } from '../data/articleRoutes'
import './ArticlePage.css'

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <span className="ja-reading-progress" style={{ transform: `scaleX(${progress})` }} />
}

export default function ArticlePage({ slug, language }) {
  const article = getArticle(slug)
  const locale = language === 'zh' ? 'zh' : 'en'
  const copy = article?.locales[locale]
  const zh = locale === 'zh'
  const otherLanguage = zh ? 'en' : 'zh'
  const publishedLabel = useMemo(() => new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-MY', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${article?.publishedAt || '2026-09-06'}T00:00:00+08:00`)), [article?.publishedAt, zh])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!article || !copy) return null

  return (
    <main className="ja-root">
      <ReadingProgress />
      <nav className="ja-nav" aria-label={zh ? '文章导航' : 'Article navigation'}>
        <div className="ja-nav-inner">
          <a className="ja-brand" href={`/${locale}/`} aria-label={zh ? '返回 JSave 首页' : 'Back to JSave home'}><span>J</span><b>JSave</b></a>
          <div className="ja-nav-actions">
            <a className="ja-language" href={articleHref(slug, otherLanguage)} hrefLang={otherLanguage}>{zh ? 'EN' : '中文'}</a>
            <a className="ja-open" href={`/${locale}/`}>{zh ? '打开 JSave' : 'Open JSave'}<ArrowIcon /></a>
          </div>
        </div>
      </nav>

      <article>
        <header className="ja-hero">
          <div className="ja-hero-copy">
            <a className="ja-back" href={`/${locale}/#guides`}>← {zh ? '返回 JSave 指南' : 'Back to JSave guides'}</a>
            <p className="ja-kicker">{copy.category}</p>
            <h1>{copy.title}</h1>
            <p className="ja-deck">{copy.deck}</p>
            <div className="ja-byline"><span>Jee Production</span><i /> <time dateTime={article.publishedAt}>{publishedLabel}</time><i /> <span>{copy.readingTime}</span></div>
          </div>
          <figure className="ja-hero-media">
            <img src={article.image} alt={copy.imageAlt} width="1600" height="1067" fetchPriority="high" />
          </figure>
        </header>

        <div className="ja-layout">
          <aside className="ja-toc">
            <p>{zh ? '本文内容' : 'In this guide'}</p>
            <ol>{copy.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}</ol>
          </aside>

          <div className="ja-content">
            <section className="ja-takeaways" aria-labelledby="takeaways-title">
              <p>{zh ? '摘要' : 'Summary'}</p>
              <h2 id="takeaways-title">{copy.takeawaysTitle}</h2>
              <ul>{copy.takeaways.map(item => <li key={item}>{item}</li>)}</ul>
            </section>

            {copy.sections.map((section, index) => (
              <section className="ja-section" id={`section-${index + 1}`} key={section.title}>
                <div className="ja-section-number">{String(index + 1).padStart(2, '0')}</div>
                <h2>{section.title}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.list && <ul>{section.list.map(item => <li key={item}>{item}</li>)}</ul>}
                {section.callout && <aside className="ja-callout"><span>{zh ? '重点' : 'Key idea'}</span><h3>{section.callout.title}</h3><p>{section.callout.body}</p></aside>}
                {section.table && <div className="ja-table-wrap"><table><thead><tr>{section.table.headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, cellIndex) => <td key={`${row[0]}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
              </section>
            ))}

            <section className="ja-sources" aria-labelledby="sources-title">
              <p>{zh ? '参考资料' : 'References'}</p>
              <h2 id="sources-title">{copy.sourcesTitle}</h2>
              <ol>{copy.sources.map(source => <li key={source.url}><a href={source.url} target={source.url.startsWith('http') ? '_blank' : undefined} rel={source.url.startsWith('http') ? 'noopener noreferrer' : undefined}>{source.label}<ArrowIcon /></a><span>{source.note}</span></li>)}</ol>
              {copy.disclaimer && <small>{copy.disclaimer}</small>}
            </section>
          </div>
        </div>
      </article>

      <section className="ja-more" aria-labelledby="more-guides-title">
        <div className="ja-more-heading"><p>{zh ? '继续阅读' : 'Keep reading'}</p><h2 id="more-guides-title">{zh ? '把金钱看得更清楚。' : 'See your money more clearly.'}</h2></div>
        <div className="ja-more-grid">
          {ARTICLES.filter(item => item.slug !== slug).map(item => {
            const related = item.locales[locale]
            return <a href={articleHref(item.slug, locale)} key={item.slug}><img src={item.image} alt="" loading="lazy" width="1600" height="1067" /><span>{related.category}</span><h3>{related.title}</h3><p>{related.deck}</p><b>{zh ? '阅读文章' : 'Read guide'}<ArrowIcon /></b></a>
          })}
        </div>
      </section>

      <section className="ja-cta">
        <p>{zh ? '把今天的一笔，变成清楚的长期习惯。' : 'Turn today’s transaction into a clearer long-term habit.'}</p>
        <h2>{zh ? '花得清楚，存得从容。' : 'Spend clearly. Save calmly.'}</h2>
        <a href={`/${locale}/`}>{zh ? '免费打开 JSave' : 'Open JSave for free'}<ArrowIcon /></a>
      </section>

      <footer className="ja-footer"><a className="ja-brand" href={`/${locale}/`}><span>J</span><b>JSave</b></a><p>© 2026 JSave · <a href="https://www.jeeprod.com/" target="_blank" rel="noopener noreferrer">Jee Production</a></p></footer>
    </main>
  )
}
