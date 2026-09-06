import { useEffect, useRef, useState } from 'react'
import { ARTICLE_SUMMARIES, articleHref, guidesHref } from '../data/articleRoutes'
import './GuidesPage.css'

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <Tag {...props} ref={ref} className={`jg-reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ '--jg-delay': `${delay}ms` }}>{children}</Tag>
}

export default function GuidesPage({ language }) {
  const locale = language === 'zh' ? 'zh' : 'en'
  const zh = locale === 'zh'
  const otherLanguage = zh ? 'en' : 'zh'
  const readTimes = zh ? ['约 12 分钟', '约 14 分钟', '约 11 分钟'] : ['12 min read', '14 min read', '11 min read']

  useEffect(() => window.scrollTo(0, 0), [])

  return (
    <main className="jg-root">
      <nav className="jg-nav" aria-label={zh ? '指南导航' : 'Guides navigation'}>
        <div className="jg-nav-inner">
          <a className="jg-brand" href={`/${locale}/`} aria-label={zh ? '返回 JSave 首页' : 'Back to JSave home'}><span>J</span><b>JSave</b></a>
          <div className="jg-nav-actions">
            <a className="jg-language" href={guidesHref(otherLanguage)} hrefLang={otherLanguage}>{zh ? 'EN' : '中文'}</a>
            <a className="jg-open" href={`/${locale}/`}>{zh ? '打开 JSave' : 'Open JSave'}<ArrowIcon /></a>
          </div>
        </div>
      </nav>

      <header className="jg-hero">
        <div className="jg-hero-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="jg-hero-copy">
          <a href={`/${locale}/`}>← {zh ? '返回产品首页' : 'Back to product'}</a>
          <p>{zh ? 'JSave 指南' : 'JSave Guides'}</p>
          <h1>{zh ? <>把每天的金钱选择，<br /><span>想得更清楚。</span></> : <>Think more clearly about<br /><span>everyday money.</span></>}</h1>
          <div className="jg-hero-bottom"><p>{zh ? '不写空泛的省钱清单。这里认真解释离线资料、可执行预算，以及一款安静记账工具背后的取舍。' : 'No generic list of money hacks. These guides explain offline data, actionable budgets and the decisions behind a quieter expense tracker.'}</p><span>{zh ? '3 篇深度指南 · 中英文' : '3 in-depth guides · bilingual'}</span></div>
        </div>
      </header>

      <section className="jg-list" aria-labelledby="guide-list-title">
        <Reveal className="jg-list-heading"><p>{zh ? '全部文章' : 'All guides'}</p><h2 id="guide-list-title">{zh ? '从一个真实问题开始。' : 'Start with a real question.'}</h2></Reveal>
        <div className="jg-grid">
          {ARTICLE_SUMMARIES.map((article, index) => {
            const copy = article.locales[locale]
            return (
              <Reveal as="article" className={index === 0 ? 'is-featured' : ''} delay={index * 100} key={article.slug}>
                <a href={articleHref(article.slug, locale)}>
                  <div className="jg-image"><img src={article.image} alt="" width="1600" height="1067" loading={index === 0 ? 'eager' : 'lazy'} /><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <div className="jg-card-copy"><div><p>{copy.category}</p><span>{readTimes[index]}</span></div><h3>{copy.title}</h3><p>{copy.deck}</p><b>{zh ? '阅读完整指南' : 'Read the full guide'}<ArrowIcon /></b></div>
                </a>
              </Reveal>
            )
          })}
        </div>
      </section>

      <section className="jg-principle">
        <Reveal><p>{zh ? '编辑原则' : 'Editorial principle'}</p><blockquote>{zh ? '有来源的数字、有边界的建议，也诚实说明 JSave 适合什么、不适合什么。' : 'Numbers with sources, advice with boundaries, and an honest account of where JSave fits—and where it does not.'}</blockquote></Reveal>
      </section>

      <section className="jg-cta"><Reveal><p>{zh ? '读完，就从今天的一笔开始。' : 'Then begin with one transaction today.'}</p><h2>{zh ? '花得清楚，存得从容。' : 'Spend clearly. Save calmly.'}</h2><a href={`/${locale}/`}>{zh ? '免费打开 JSave' : 'Open JSave for free'}<ArrowIcon /></a></Reveal></section>
      <footer className="jg-footer"><a className="jg-brand" href={`/${locale}/`}><span>J</span><b>JSave</b></a><p>© 2026 JSave · <a href="https://www.jeeprod.com/" target="_blank" rel="noopener noreferrer">Jee Production</a></p></footer>
    </main>
  )
}
