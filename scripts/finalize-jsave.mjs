import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { ARTICLES } from '../src/jsave/data/articles.js'
import { ARTICLE_SUMMARIES, articleHref, guidesHref } from '../src/jsave/data/articleRoutes.js'

const outputDirectory = resolve('dist-jsave')

const localePages = {
  en: {
    title: 'JSave — Offline Expense Tracker &amp; AA Bill Splitter for Malaysia',
    description: 'Track expenses offline, split AA bills, plan budgets and savings goals, calculate cost per day, and export CSV with JSave.',
    url: 'https://jsave.jeeprod.com/en/',
    fallback: `
      <main id="jsave-seo-fallback">
        <header>
          <p class="seo-eyebrow">Personal finance · Made in Kuala Lumpur</p>
          <h1>Offline expense tracking and AA bill splitting, without the noise.</h1>
          <p>JSave is a focused personal finance web app for everyday life in Malaysia. Record spending in seconds, understand a practical daily budget, split shared bills accurately, and keep moving toward savings goals—without connecting a bank account.</p>
          <a class="seo-cta" href="/en/">Open JSave for free</a>
        </header>
        <section>
          <h2>A calmer way to understand your money</h2>
          <p>JSave keeps the daily loop deliberately small: record, review and adjust. Your ledger remains available offline, queued changes sync when the connection returns, and every account keeps its own isolated cache.</p>
          <ul>
            <li>Fast income, expense and transfer records</li>
            <li>Daily and monthly budget feedback</li>
            <li>Equal or custom AA bill splitting</li>
            <li>Repayment tracking without distorted spending</li>
            <li>Multiple savings goals and quick deposits</li>
            <li>True item cost per day and item groups</li>
            <li>Calendar and category reports</li>
            <li>Spreadsheet-ready CSV export</li>
          </ul>
        </section>
        <section>
          <h2>Built for real Malaysian routines</h2>
          <p>Use MYR accounts for cash, banks and savings. Pay for a table, divide the bill equally or assign custom amounts, then record repayments while counting only your own share as personal spending. JSave is a progressive web app, so it can be installed from a modern browser on a phone or computer.</p>
        </section>
        <section>
          <h2>Frequently asked questions</h2>
          <h3>Can JSave work offline?</h3><p>Yes. Add and review records offline; queued changes synchronize after your connection returns.</p>
          <h3>Does it need my bank password?</h3><p>No. JSave is manual-entry by design and never asks for bank login credentials.</p>
          <h3>Can I take my data elsewhere?</h3><p>Yes. Export your transactions as a clean CSV file whenever you choose.</p>
        </section>
        <footer><p>JSave is designed and built by <a href="https://www.jeeprod.com/">Jee Production</a> in Kuala Lumpur, Malaysia.</p></footer>
      </main>`,
  },
  zh: {
    title: 'JSave（J省）— 马来西亚离线记账与 AA 分账工具',
    description: 'JSave 是为马来西亚日常生活设计的个人理财工具：离线记账、AA 分账、预算反馈、储蓄目标、物品日均成本与 CSV 导出。',
    url: 'https://jsave.jeeprod.com/zh/',
    fallback: `
      <main id="jsave-seo-fallback">
        <header>
          <p class="seo-eyebrow">个人理财 · 吉隆坡制作</p>
          <h1>离线记账与 AA 分账，重要的都有，多余的没有。</h1>
          <p>JSave（J省）是一款为马来西亚日常生活设计的个人理财网页应用。几秒内记下一笔支出，掌握今天还能花多少，准确分摊共同账单，并一步步完成储蓄目标——无需连接银行账户。</p>
          <a class="seo-cta" href="/zh/">免费打开 JSave</a>
        </header>
        <section>
          <h2>更平静地看清自己的钱</h2>
          <p>JSave 把日常流程保持得很简单：记录、查看、调整。没有网络时仍可记账和查看资料；连接恢复后，待同步的修改会可靠上传，每个账号的离线缓存也彼此隔离。</p>
          <ul>
            <li>快速记录收入、支出与转账</li>
            <li>每日与每月预算反馈</li>
            <li>平均或自定义金额的 AA 分账</li>
            <li>追踪还款，只计算自己的实际支出</li>
            <li>多个储蓄目标与快速存入</li>
            <li>物品日均成本与物品组合</li>
            <li>日历及分类报告</li>
            <li>随时导出 CSV</li>
          </ul>
        </section>
        <section>
          <h2>为真实的马来西亚生活设计</h2>
          <p>用 MYR 管理现金、银行与储蓄账户。聚餐时可以先付款，再选择平均分账或为每个人指定金额；收到还款后，报告只把你自己的份额算作个人支出。JSave 是渐进式网页应用，可从现代浏览器安装到手机或电脑。</p>
        </section>
        <section>
          <h2>常见问题</h2>
          <h3>没有网络也能使用吗？</h3><p>可以。你可以离线新增和查看记录，网络恢复后，排队中的修改会自动同步。</p>
          <h3>需要提供银行密码吗？</h3><p>不需要。JSave 采用主动手动记录，不会索取银行登录资料。</p>
          <h3>资料可以带走吗？</h3><p>可以。你随时都能从设置导出适合电子表格使用的 CSV 文件。</p>
        </section>
        <footer><p>JSave 由马来西亚吉隆坡的 <a href="https://www.jeeprod.com/">Jee Production</a> 设计与开发。</p></footer>
      </main>`,
  },
}

function localizedHtml(source, language, page) {
  return source
    .replace('<html lang="en">', `<html lang="${language}">`)
    .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${page.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${page.url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${page.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${page.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${page.url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${page.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${page.description}" />`)
    .replace(/<main id="jsave-seo-fallback">[\s\S]*?<\/main>/, page.fallback.trim())
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderArticleFallback(article, language) {
  const copy = article.locales[language]
  const zh = language === 'zh'
  const sectionMarkup = copy.sections.map((section, index) => `
    <section id="section-${index + 1}">
      <p class="seo-eyebrow">${String(index + 1).padStart(2, '0')}</p>
      <h2>${escapeHtml(section.title)}</h2>
      ${section.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
      ${section.list ? `<ul>${section.list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      ${section.callout ? `<aside><h3>${escapeHtml(section.callout.title)}</h3><p>${escapeHtml(section.callout.body)}</p></aside>` : ''}
      ${section.table ? `<div class="seo-table"><table><thead><tr>${section.table.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    </section>`).join('\n')

  return `
    <main id="jsave-seo-fallback" class="seo-article">
      <header>
        <a href="/${language}/">← ${zh ? '返回 JSave 首页' : 'Back to JSave home'}</a>
        <p class="seo-eyebrow">${escapeHtml(copy.category)} · JSave</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p>${escapeHtml(copy.deck)}</p>
        <p>${escapeHtml(copy.readingTime)} · Jee Production · ${article.publishedAt}</p>
        <img src="${article.image}" alt="${escapeHtml(copy.imageAlt)}" width="1600" height="1067" />
      </header>
      <section class="seo-summary">
        <h2>${escapeHtml(copy.takeawaysTitle)}</h2>
        <ul>${copy.takeaways.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>
      ${sectionMarkup}
      <section>
        <h2>${escapeHtml(copy.sourcesTitle)}</h2>
        <ul>${copy.sources.map(source => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a> — ${escapeHtml(source.note)}</li>`).join('')}</ul>
        ${copy.disclaimer ? `<p>${escapeHtml(copy.disclaimer)}</p>` : ''}
      </section>
      <footer><p>© 2026 JSave · <a href="https://www.jeeprod.com/">Jee Production</a></p></footer>
    </main>`
}

function articleHtml(source, article, language) {
  const copy = article.locales[language]
  const url = `https://jsave.jeeprod.com${articleHref(article.slug, language)}`
  const image = `https://jsave.jeeprod.com${article.image}`
  const alternate = otherLanguage => `https://jsave.jeeprod.com${articleHref(article.slug, otherLanguage)}`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: copy.title,
    description: copy.deck,
    image,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: language === 'zh' ? 'zh-CN' : 'en-MY',
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Jee Production', url: 'https://www.jeeprod.com/' },
    publisher: { '@type': 'Organization', name: 'Jee Production', url: 'https://www.jeeprod.com/' },
  }

  const articleSource = source.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')

  return localizedHtml(articleSource, language === 'zh' ? 'zh-CN' : 'en-MY', {
    title: `${escapeHtml(copy.title)} · JSave`,
    description: escapeHtml(copy.deck),
    url,
    fallback: renderArticleFallback(article, language),
  })
    .replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="article" />')
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${escapeHtml(copy.imageAlt)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${image}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${alternate('en')}" />`)
    .replace(/<link rel="alternate" hreflang="zh" href="[^"]*" \/>/, `<link rel="alternate" hreflang="zh" href="${alternate('zh')}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/, `<link rel="alternate" hreflang="x-default" href="${alternate('en')}" />`)
    .replace('</head>', `<meta property="article:published_time" content="${article.publishedAt}" /><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
}

function renderGuidesFallback(language) {
  const zh = language === 'zh'
  return `
    <main id="jsave-seo-fallback" class="seo-article">
      <header>
        <a href="/${language}/">← ${zh ? '返回 JSave 首页' : 'Back to JSave home'}</a>
        <p class="seo-eyebrow">JSave ${zh ? '指南' : 'Guides'}</p>
        <h1>${zh ? '把每天的金钱选择，想得更清楚。' : 'Think more clearly about everyday money.'}</h1>
        <p>${zh ? '不写空泛的省钱清单。这里认真解释离线资料、可执行预算，以及一款安静记账工具背后的取舍。' : 'No generic list of money hacks. These guides explain offline data, actionable budgets and the decisions behind a quieter expense tracker.'}</p>
      </header>
      <section>
        <h2>${zh ? '全部指南' : 'All guides'}</h2>
        ${ARTICLE_SUMMARIES.map((article, index) => {
          const copy = article.locales[language]
          return `<article><p class="seo-eyebrow">${String(index + 1).padStart(2, '0')} · ${escapeHtml(copy.category)}</p><h3><a href="${articleHref(article.slug, language)}">${escapeHtml(copy.title)}</a></h3><p>${escapeHtml(copy.deck)}</p></article>`
        }).join('\n')}
      </section>
      <footer><p>© 2026 JSave · <a href="https://www.jeeprod.com/">Jee Production</a></p></footer>
    </main>`
}

function guidesHtml(source, language) {
  const zh = language === 'zh'
  const url = `https://jsave.jeeprod.com${guidesHref(language)}`
  const title = zh ? 'JSave 指南 — 马来西亚个人预算与可靠记账' : 'JSave Guides — Practical budgeting and reliable money tracking'
  const description = zh ? '阅读 JSave 深度指南：可靠离线记账、马来西亚每日预算，以及 JSave 与一般记账 App 的差异。' : 'Read in-depth JSave guides about reliable offline tracking, practical daily budgets in Malaysia and choosing an expense tracker.'
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    inLanguage: zh ? 'zh-CN' : 'en-MY',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: ARTICLE_SUMMARIES.map((article, index) => ({
        '@type': 'ListItem', position: index + 1,
        url: `https://jsave.jeeprod.com${articleHref(article.slug, language)}`,
        name: article.locales[language].title,
      })),
    },
  }
  const guideSource = source.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  return localizedHtml(guideSource, zh ? 'zh-CN' : 'en-MY', {
    title: escapeHtml(title), description: escapeHtml(description), url,
    fallback: renderGuidesFallback(language),
  })
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="https://jsave.jeeprod.com${ARTICLE_SUMMARIES[0].image}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="https://jsave.jeeprod.com${ARTICLE_SUMMARIES[0].image}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="https://jsave.jeeprod.com${guidesHref('en')}" />`)
    .replace(/<link rel="alternate" hreflang="zh" href="[^"]*" \/>/, `<link rel="alternate" hreflang="zh" href="https://jsave.jeeprod.com${guidesHref('zh')}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/, `<link rel="alternate" hreflang="x-default" href="https://jsave.jeeprod.com${guidesHref('en')}" />`)
    .replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
}

const builtHtmlPath = resolve(outputDirectory, 'jsave.html')
const builtHtml = readFileSync(builtHtmlPath, 'utf8')

for (const [language, page] of Object.entries(localePages)) {
  const localeDirectory = resolve(outputDirectory, language)
  mkdirSync(localeDirectory, { recursive: true })
  writeFileSync(resolve(localeDirectory, 'index.html'), localizedHtml(builtHtml, language, page))
}

for (const article of ARTICLES) {
  for (const language of ['en', 'zh']) {
    const articleDirectory = resolve(outputDirectory, language, 'articles', article.slug)
    mkdirSync(articleDirectory, { recursive: true })
    writeFileSync(resolve(articleDirectory, 'index.html'), articleHtml(builtHtml, article, language))
  }
}

for (const language of ['en', 'zh']) {
  const guidesDirectory = resolve(outputDirectory, language, 'guides')
  mkdirSync(guidesDirectory, { recursive: true })
  writeFileSync(resolve(guidesDirectory, 'index.html'), guidesHtml(builtHtml, language))
}

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = resolve(directory, entry.name)
    return entry.isDirectory() ? filesIn(absolute) : [absolute]
  })
}

const excluded = new Set(['sw.js', 'precache-manifest.json'])
const assets = filesIn(outputDirectory)
  .filter(file => statSync(file).isFile())
  .map(file => relative(outputDirectory, file).replaceAll('\\', '/'))
  .filter(file => !excluded.has(file))
  .map(file => `/${file}`)
  .sort()

writeFileSync(
  resolve(outputDirectory, 'precache-manifest.json'),
  `${JSON.stringify({ assets }, null, 2)}\n`,
)

console.log(`✓ JSave localized pages, ${ARTICLES.length * 2} article pages, 2 guide indexes and precache manifest generated (${assets.length} files)`)
