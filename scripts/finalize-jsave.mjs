import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

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

const builtHtmlPath = resolve(outputDirectory, 'jsave.html')
const builtHtml = readFileSync(builtHtmlPath, 'utf8')

for (const [language, page] of Object.entries(localePages)) {
  const localeDirectory = resolve(outputDirectory, language)
  mkdirSync(localeDirectory, { recursive: true })
  writeFileSync(resolve(localeDirectory, 'index.html'), localizedHtml(builtHtml, language, page))
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

console.log(`✓ JSave localized pages and precache manifest generated (${assets.length} files)`)
