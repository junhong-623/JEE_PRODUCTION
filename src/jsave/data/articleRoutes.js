export const ARTICLE_SLUGS = [
  'offline-expense-tracking',
  'malaysia-daily-budget',
  'jsave-vs-expense-apps',
]

export const ARTICLE_SUMMARIES = [
  {
    slug: 'offline-expense-tracking',
    image: '/articles/offline-expense-tracking.webp',
    locales: {
      en: {
        category: 'Offline money tracking',
        title: 'How can expense tracking remain reliable without internet?',
        deck: 'Reliable offline tracking means more than loading a screen. Every change should land safely on the device, expose an honest sync state, and reach the cloud exactly once when connectivity returns.',
      },
      zh: {
        category: '离线记账',
        title: '没有网络时，怎样可靠记账？',
        deck: '真正可靠的离线记账，不只是“页面还能打开”，而是每一笔修改都先安全落地、能看见同步状态，并在网络回来后只同步一次。',
      },
    },
  },
  {
    slug: 'malaysia-daily-budget',
    image: '/articles/malaysia-daily-budget.webp',
    locales: {
      en: {
        category: 'Budgeting in Malaysia',
        title: 'How should Malaysians build a daily budget that actually works?',
        deck: 'A budget should not be a report that announces overspending at month-end. Reserve fixed responsibilities, savings and non-monthly costs first, then translate genuinely flexible money into a decision for today.',
      },
      zh: {
        category: '马来西亚预算',
        title: '马来西亚用户，怎样安排真正可执行的每日预算？',
        deck: '预算不该只是月底才发现超支的报表。先处理固定责任、储蓄与非每月开销，再把真正可动用的钱换算成今天的决定。',
      },
    },
  },
  {
    slug: 'jsave-vs-expense-apps',
    image: '/articles/jsave-vs-expense-apps.webp',
    locales: {
      en: {
        category: 'Choosing a money tool',
        title: 'How is JSave different from a typical expense tracking app?',
        deck: 'More features do not automatically create a better daily tool. JSave chooses manual entry, offline-first behaviour and a clear data exit in exchange for less noise and more deliberate awareness.',
      },
      zh: {
        category: '产品选择',
        title: 'JSave 与一般记账 App 有什么不同？',
        deck: '不是功能越多就越适合每天使用。JSave 选择手动、离线优先和清楚的数据出口，换取更少干扰与更明确的金钱意识。',
      },
    },
  },
]

export function articleRoute(pathname = window.location.pathname) {
  const match = pathname.match(/^\/(en|zh)\/articles\/([^/]+)\/?$/)
  if (!match || !ARTICLE_SLUGS.includes(match[2])) return null
  return { language: match[1], slug: match[2] }
}

export function articleHref(slug, language) {
  return `/${language}/articles/${slug}/`
}

export function guidesRoute(pathname = window.location.pathname) {
  const match = pathname.match(/^\/(en|zh)\/guides\/?$/)
  return match ? { language: match[1] } : null
}

export function guidesHref(language) {
  return `/${language}/guides/`
}
