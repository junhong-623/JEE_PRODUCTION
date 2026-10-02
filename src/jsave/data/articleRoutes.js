export const ARTICLE_SUMMARIES = [
  {
    "slug": "item-installment-tracking",
    "image": "/j-save-installment-laptop.webp",
    "locales": {
      "zh": {
        "category": "物品与分期",
        "title": "买了分期物品，怎样看清已付与待付款？",
        "deck": "每月供款只是计划的一部分。把物品价格、首付、每期日期和实际付款放在一起，才能分清已经付了多少、未来还要付多少，以及账本里真正发生的支出。",
        "readingTime": "约 6 分钟"
      },
      "en": {
        "category": "Things and installments",
        "title": "How do you track what is paid and still due on an installment purchase?",
        "deck": "A monthly payment is only one part of the picture. Keep the item price, down payment, schedule and actual payments together so you can distinguish purchase cost, completed installments and the money that has really left your accounts.",
        "readingTime": "6 min read"
      }
    }
  },
  {
    "slug": "aa-bill-splitting",
    "image": "/j-save-everyday.webp",
    "locales": {
      "zh": {
        "category": "AA 分账",
        "title": "聚餐先付款，怎样只算自己的那份？",
        "deck": "帮整桌付款后，银行余额减少的是整张账单，自己的消费却只是其中一份。用 AA 分账保留完整账单、分配每个人的金额，并追踪还款，才不会把代垫误当成全部属于自己的支出。",
        "readingTime": "约 6 分钟"
      },
      "en": {
        "category": "AA bill splitting",
        "title": "How do you count only your share after paying for the table?",
        "deck": "When you pay a shared bill, the entire amount leaves your account but only one share is your personal consumption. Keep the full bill, each person’s allocation and repayments together so an advance for friends does not distort your spending.",
        "readingTime": "6 min read"
      }
    }
  },
  {
    "slug": "iphone-receipt-shortcut",
    "image": "/j-save-lifestyle.webp",
    "locales": {
      "zh": {
        "category": "截图快捷指令",
        "title": "一张付款截图，怎样核对后记进 JSave？",
        "deck": "付款后留下的一张截图，可以成为记账的起点。准备统一密钥、分享单笔收据、选择账户并核对金额和日期，确认后才保存；已支持的格式自动识别，其他收据可以补全资料。",
        "readingTime": "约 6 分钟"
      },
      "en": {
        "category": "Receipt shortcut",
        "title": "How do you review a payment screenshot before adding it to JSave?",
        "deck": "A payment screenshot can be the starting point for a ledger entry. Prepare a unified key, share one receipt, choose your accounts and review the details before saving. Supported formats are parsed automatically; unfamiliar receipts may need completion.",
        "readingTime": "6 min read"
      }
    }
  },
  {
    "slug": "offline-expense-tracking",
    "image": "/articles/offline-expense-tracking.webp",
    "locales": {
      "zh": {
        "category": "离线记账",
        "title": "没有网络时，怎样可靠记账？",
        "deck": "真正可靠的离线记账，不只是“页面还能打开”，而是每一笔修改都先安全落地、能看见同步状态，并在网络回来后只同步一次。",
        "readingTime": "约 12 分钟"
      },
      "en": {
        "category": "Offline money tracking",
        "title": "How can expense tracking remain reliable without internet?",
        "deck": "Reliable offline tracking means more than loading a screen. Every change should land safely on the device, expose an honest sync state, and reach the cloud exactly once when connectivity returns.",
        "readingTime": "12 min read"
      }
    }
  },
  {
    "slug": "malaysia-daily-budget",
    "image": "/articles/malaysia-daily-budget.webp",
    "locales": {
      "zh": {
        "category": "马来西亚预算",
        "title": "马来西亚用户，怎样安排真正可执行的每日预算？",
        "deck": "预算不该只是月底才发现超支的报表。先处理固定责任、储蓄与非每月开销，再把真正可动用的钱换算成今天的决定。",
        "readingTime": "约 14 分钟"
      },
      "en": {
        "category": "Budgeting in Malaysia",
        "title": "How should Malaysians build a daily budget that actually works?",
        "deck": "A budget should not be a report that announces overspending at month-end. Reserve fixed responsibilities, savings and non-monthly costs first, then translate genuinely flexible money into a decision for today.",
        "readingTime": "14 min read"
      }
    }
  },
  {
    "slug": "jsave-vs-expense-apps",
    "image": "/articles/jsave-vs-expense-apps.webp",
    "locales": {
      "zh": {
        "category": "产品选择",
        "title": "JSave 与一般记账 App 有什么不同？",
        "deck": "不是功能越多就越适合每天使用。JSave 选择手动、离线优先和清楚的数据出口，换取更少干扰与更明确的金钱意识。",
        "readingTime": "约 11 分钟"
      },
      "en": {
        "category": "Choosing a money tool",
        "title": "How is JSave different from a typical expense tracking app?",
        "deck": "More features do not automatically create a better daily tool. JSave chooses manual entry, offline-first behaviour and a clear data exit in exchange for less noise and more deliberate awareness.",
        "readingTime": "11 min read"
      }
    }
  }
]

export const ARTICLE_SLUGS = ARTICLE_SUMMARIES.map(article => article.slug)

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
