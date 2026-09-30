import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { IOSDevice } from '../jsave/components/IOSDevice'
import {
  PhoneAdd,
  PhoneDashboard,
  PhoneGoals,
  PhoneInsights,
  PhoneTransactions,
} from '../jsave/components/PhoneScreens'
import { JSAVE_BASE } from '../jsave/utils/basePath'
import { ARTICLE_SUMMARIES, articleHref, guidesHref } from '../jsave/data/articleRoutes'
import '../jsave/design-system.css'
import './JSaveIntro.css'

const COPY = {
  en: {
    nav: ['Overview', 'How it works', 'Installments', 'Product', 'Guides', 'Principles'],
    open: 'Open JSave', install: 'Install',
    eyebrow: 'Personal finance, without the noise',
    heroA: 'Spend clearly.', heroB: 'Save calmly.',
    heroBody: 'A focused money companion for everyday life in Malaysia. Record a purchase in seconds, understand your pace, and keep moving toward what matters.',
    start: 'Start free', explore: 'Explore the product',
    assurances: ['No bank connection', 'Works offline', 'English + 中文'],
    productKicker: 'A calmer daily habit',
    productTitle: ['Everything important.', 'Nothing distracting.'],
    productBody: 'JSave keeps the daily loop deliberately small: record, understand, adjust. No ads, noisy streaks, or pressure to connect a bank account.',
    journeyKicker: 'FROM MOMENT TO MONTH',
    journeyTitle: 'A receipt becomes a useful decision.',
    journeyBody: 'JSave connects the tiny action of recording today with a calmer view of the whole month. The information stays practical at every step.',
    journeySteps: [
      { title: 'Record', body: 'Capture the amount, category and account while the purchase is still fresh.' },
      { title: 'Review', body: 'See spending settle into a daily budget and a clear monthly pattern.' },
      { title: 'Adjust', body: 'Move at your own pace with simple feedback—not warnings designed to create anxiety.' },
      { title: 'Keep', body: 'Export a clean CSV whenever you need your records somewhere else.' },
    ],
    installmentsKicker: 'NEW · THINGS + INSTALLMENTS',
    installmentsTitle: 'Enjoy the purchase. Know every payment ahead.',
    installmentsBody: 'In JSave, a Thing can hold its installment plan alongside its purchase price. See the full picture: what it costs, what you have paid, and what is still coming.',
    installmentsPoints: [
      { title: 'Set up the plan', body: 'Enter a down payment, monthly amount or total, and the payment term.' },
      { title: 'See the true total', body: 'Compare all planned payments with the item price and review each due date.' },
      { title: 'Follow real progress', body: 'Link each payment to its transaction so paid and upcoming installments stay clear.' },
    ],
    installmentsPhotoOne: 'A laptop and notebook on a sunlit desk in Kuala Lumpur',
    installmentsPhotoTwo: 'A person holding a camera they use and value',
    installmentsExample: 'INTERACTIVE EXAMPLE', installmentsItem: 'My laptop',
    installmentsPrice: 'Item price', installmentsTerm: 'Payment term', installmentsMonths: 'months',
    installmentsPaid: 'payments made', installmentsProgress: 'Payment progress', installmentsNext: 'Per month', installmentsRemaining: 'Still to pay',
    installmentsRecord: 'Mark next paid', installmentsComplete: 'All payments made', installmentsCelebrated: 'Paid in full!', installmentsReset: 'Reset example', installmentsRetry: 'Try again',
    installmentsNote: 'Example assumes equal monthly payments, with no down payment or fees. Changes here are not saved; actual spending in JSave follows each recorded payment transaction.',
    shortcutKicker: 'TNG + CIMB · IPHONE SHORTCUT',
    shortcutTitle: 'From payment screenshot to JSave entry.',
    shortcutBody: 'Use one iPhone shortcut for supported TNG confirmations and CIMB transaction details. It reads the amount, date and payee, then lets you check the category and account before saving.',
    shortcutSteps: [
      { title: 'Capture', body: 'Share one supported TNG or CIMB transaction screenshot from Photos.' },
      { title: 'Check', body: 'Choose a category and review the amount, date, account and suggested note.' },
      { title: 'Save', body: 'Confirm the entry, then choose whether to keep or delete the screenshot.' },
    ],
    shortcutNote: 'Set up your accounts and key in JSave Settings. Text is extracted on your iPhone; the screenshot itself is not uploaded. Unrecognized screenshots are not saved.',
    shortcutPreview: 'IMPORT PREVIEW', shortcutMerchant: 'Merchant', shortcutDate: 'Date', shortcutCategory: 'Category', shortcutFood: 'Food', shortcutConfirm: 'Confirm to add to JSave',
    shortcutGuideButton: 'iPhone shortcut setup guide',
    shortcutGuide: {
      eyebrow: 'IPHONE WALKTHROUGH', title: 'Turn one screenshot into one entry.',
      intro: 'Five short steps, from choosing accounts to reviewing the saved transaction. The pictures are guides, not screenshots from your phone.',
      visualLabel: 'Illustration', previous: 'Back', next: 'Next step', finish: 'Done', download: 'Download unified shortcut',
      steps: [
        { title: 'Choose your JSave accounts', body: 'Open JSave → Settings → Unified receipt screenshot shortcut. Select the TNG wallet and/or CIMB bank and credit card accounts you actually use. You can leave unused sources blank. Creating the key saves your first account choices; use Save account choices for later changes.', tip: 'For a CIMB payment to your UOB card, JSave can match one UOB credit card automatically; choose it in Settings if there is more than one.' },
        { title: 'Create a key and install', body: 'Create the unified key in Settings and copy it. Download the .shortcut file, open it from Files on your iPhone, and paste the key when asked. If no setup question appears, edit “JSave Receipt Import” and paste the key into its first Text action.', tip: 'The key appears only once. Keep it private. Changing account choices later does not require a new key or shortcut.' },
        { title: 'Share one screenshot', body: 'Capture a successful TNG payment or incoming transfer, or a supported CIMB Transaction Details page. In Photos, open that single screenshot, tap Share, then choose “JSave Receipt Import”.', tip: 'A transaction list or whole bank statement is not a single transaction screenshot and will not be imported.' },
        { title: 'Review before saving', body: 'The shortcut reads text on your iPhone. For income or expenses, choose a category. Check the amount, date, account and note in the confirmation, then tap Confirm. Cancel if anything looks wrong.', tip: 'Only the extracted text goes to JSave for parsing; the image stays on your phone.' },
        { title: 'Keep the photo or automate later', body: 'After a save or duplicate result, choose to keep or delete that exact photo. Once sharing from Photos works, you may add an optional screenshot automation in the Shortcuts app that runs JSave Receipt Import.', tip: 'Screenshot automation is not limited to TNG or CIMB. It can run after screenshots in other apps too; unsupported images are skipped. The Photos share action is always available.' },
      ],
    },
    stories: [
      { no: '01', label: 'FAST CAPTURE', title: 'A money habit you can actually keep.', body: 'Choose an amount, category and account. That is enough. Recurring entries take care of predictable monthly spending without creating duplicates.', points: ['Four transaction types', 'Recurring monthly entries', 'Clear account balances'] },
      { no: '02', label: 'USEFUL FEEDBACK', title: 'Know what today means for tomorrow.', body: 'A daily budget signal turns a long monthly number into a decision you can use right now. Goals and cost-per-day add context without judging you.', points: ['Daily budget pacing', 'Goal progress', 'True cost per day'] },
      { no: '03', label: 'OFFLINE BY DESIGN', title: 'Your records stay available when the signal disappears.', body: 'Each account has its own offline cache. Changes queue safely and reconcile with your private cloud path when the connection returns.', points: ['Account-isolated cache', 'Reliable queued sync', 'CSV export anytime'] },
      { no: '04', label: 'AA BILL SPLITTING', title: 'One shared bill. Only your share counts.', body: 'Pay for the table, split the total equally, and keep track of who has paid you back. JSave remembers the full bill while counting only your own share as personal spending.', points: ['Equal split in seconds', 'Track repayments', 'Accurate personal spending'] },
    ],
    lifestyleKicker: 'Made for real life',
    lifestyleTitle: 'Money clarity should feel quiet.',
    lifestyleBody: 'JSave is designed in Kuala Lumpur for the small, ordinary choices that shape a month—not for financial theatre.',
    lifestyleCards: [{ value: 'RM 38', label: 'safe to spend today' }, { value: '72%', label: 'Tokyo goal reached' }],
    goalKicker: 'BEYOND THE LEDGER',
    goalTitle: 'Give every saving goal a real shape.',
    goalBody: 'A trip, a new device, or a rainy-day fund becomes easier to understand when progress is visible. JSave shows what is saved, what remains, and the pace toward the date you chose.',
    goalPoints: ['Multiple goals', 'Quick deposits', 'Projected completion'],
    demoKicker: 'THE REAL PRODUCT', demoTitle: 'Tap through JSave.',
    demoBody: 'These are working interface components—not a concept render. Switch screens to see the core flow.',
    tabs: ['Home', 'Ledger', 'Add', 'Insights', 'Goals'],
    toolkitKicker: 'ONE CONNECTED TOOLKIT',
    toolkitTitle: 'More context, without more clutter.',
    toolkitBody: 'The details are there when you need them, then get out of the way.',
    toolkit: [
      { no: '01', title: 'Accounts', body: 'Cash, bank and savings balances stay separate and easy to understand.' },
      { no: '02', title: 'Calendar', body: 'Review the month day by day and find a transaction without digging.' },
      { no: '03', title: 'Reports', body: 'Compare categories, income and spending with charts grounded in your own entries.' },
      { no: '04', title: 'Things', body: 'See an item’s cost per day, add its installment plan, and follow what is paid or still due.' },
      { no: '05', title: 'Recurring', body: 'Let predictable monthly entries appear once, reliably, across your devices.' },
      { no: '06', title: 'Your data', body: 'Use it offline, sync it privately, and export it when you choose.' },
    ],
    guidesKicker: 'JSave GUIDES', guidesTitle: 'Useful thinking, beyond the interface.',
    guidesBody: 'Long-form, practical guides to building a calmer money routine—grounded in real Malaysian life and the decisions behind JSave.',
    guidesRead: 'Read guide', guidesAll: 'View all guides',
    principlesKicker: 'OUR PRINCIPLES', principlesTitle: 'Built to earn a place in your routine.',
    principles: [
      { title: 'Manual on purpose', body: 'You decide what enters the ledger. JSave never asks for bank credentials.' },
      { title: 'Private by account', body: 'Offline records are isolated by user and sync only to that user’s Firebase path.' },
      { title: 'Honest by default', body: 'No invented AI, fake user counts, or paid tiers that do not exist.' },
    ],
    faqTitle: 'A few useful answers.',
    faqs: [
      { q: 'Can I use JSave without internet?', a: 'Yes. Add and review records offline; queued changes sync after your connection returns.' },
      { q: 'Do I need to connect a bank?', a: 'No. JSave is manual-entry by design and never asks for bank login details.' },
      { q: 'Can I take my data with me?', a: 'Yes. Export all transactions as a spreadsheet-ready CSV from Settings.' },
      { q: 'How much does it cost?', a: 'The complete JSave experience is currently free, with no paid feature gate.' },
    ],
    finalTitle: 'Start with the next ringgit.', finalBody: 'Two taps to a clearer picture of your money.',
    footer: 'Designed and built in Kuala Lumpur.', close: 'Close', menu: 'Menu',
  },
  zh: {
    nav: ['概览', '使用方式', '分期付款', '产品', '指南', '原则'], open: '打开 JSave', install: '安装',
    eyebrow: '个人理财，不需要噪音', heroA: '花得清楚。', heroB: '存得从容。',
    heroBody: '为马来西亚日常生活而做的专注理财伙伴。几秒记下一笔，看懂自己的节奏，继续走向真正重要的目标。',
    start: '免费开始', explore: '看看产品', assurances: ['无需连接银行', '离线可用', '中文 + English'],
    productKicker: '更从容的日常习惯', productTitle: ['重要的都有。', '多余的没有。'],
    productBody: 'JSave 把每天的流程刻意保持简单：记录、看懂、调整。没有广告、吵闹的连续打卡，也不会催你绑定银行。',
    journeyKicker: '从当下到整个月',
    journeyTitle: '一张收据，变成一个有用的决定。',
    journeyBody: 'JSave 把今天随手记录的小动作，连接到整个星期和月份的清晰视角。每一步都保持实际、有用。',
    journeySteps: [
      { title: '记录', body: '趁消费还记得，快速填下金额、类别和账户。' },
      { title: '回看', body: '让每笔消费自然汇入每日预算和清楚的月度趋势。' },
      { title: '调整', body: '用简单反馈找到自己的节奏，而不是用警告制造焦虑。' },
      { title: '保留', body: '需要在其他地方使用时，随时导出干净的 CSV。' },
    ],
    installmentsKicker: '新功能 · 物品与分期付款',
    installmentsTitle: '喜欢的物品买回家，接下来的每一期也心中有数。',
    installmentsBody: 'JSave 让你在「物品」中把分期计划和购买价格放在一起，同时看清物品价格、已经支付多少，以及未来还要付多少。',
    installmentsPoints: [
      { title: '填好分期计划', body: '记录首付、每月供款或分期总额，以及供款期限。' },
      { title: '看清真正总额', body: '比较预计总付款与物品价格，并逐期查看付款日期。' },
      { title: '跟上实际进度', body: '把每期付款关联到交易，已付与待付款项一目了然。' },
    ],
    installmentsPhotoOne: '吉隆坡阳光书桌上的笔电和记事本',
    installmentsPhotoTwo: '手持日常使用的相机',
    installmentsExample: '互动示意', installmentsItem: '我的笔电',
    installmentsPrice: '物品价格', installmentsTerm: '供款期限', installmentsMonths: '个月',
    installmentsPaid: '期已付', installmentsProgress: '付款进度', installmentsNext: '每月供款', installmentsRemaining: '剩余待付',
    installmentsRecord: '模拟付清下一期', installmentsComplete: '已全部付清', installmentsCelebrated: '分期付清！', installmentsReset: '重设示例', installmentsRetry: '再试一次',
    installmentsNote: '示例按每月等额、无首付和手续费计算；这里的操作不会保存数据。JSave 的实际支出仍以每期记录的付款交易为准。',
    shortcutKicker: 'TNG + CIMB · IPHONE 快捷指令',
    shortcutTitle: '付款截图，核对后记进 JSave。',
    shortcutBody: '同一个 iPhone 快捷指令可处理已支持的 TNG 成功页与 CIMB 交易详情页。它读取金额、日期和交易对象，由你核对类别及账户后才保存。',
    shortcutSteps: [
      { title: '截屏', body: '从「照片」分享一张已支持的 TNG 或 CIMB 单笔交易截图。' },
      { title: '核对', body: '选择类别，检查金额、日期、账户和预设备注。' },
      { title: '保存', body: '确认加入账本后，可选择保留或删除这张截图。' },
    ],
    shortcutNote: '先在 JSave 设置中选账户并建立统一密钥。文字由 iPhone 提取；截图本身不会上传。无法识别的截图不会存为交易。',
    shortcutPreview: '导入预览', shortcutMerchant: '商家', shortcutDate: '日期', shortcutCategory: '类别', shortcutFood: '餐饮', shortcutConfirm: '确认加入 JSave',
    shortcutGuideButton: '查看 iPhone 快捷指令教程',
    shortcutGuide: {
      eyebrow: 'IPHONE 操作教程', title: '一张截图，核对后记下一笔。',
      intro: '从选账户到确认入账，分五步完成。下方画面是操作示意，不是你的手机截图。',
      visualLabel: '操作示意', previous: '上一步', next: '下一步', finish: '完成', download: '下载统一快捷指令',
      steps: [
        { title: '先选择 JSave 账户', body: '打开 JSave → 设置 → 统一收据截图快捷指令。选好自己使用的 TNG 钱包、CIMB 银行或信用卡账户；没使用的来源可以留空。首次生成密钥时会保存账户选择；日后更换账户才点「保存账户设置」。', tip: 'CIMB 支付自己的 UOB 信用卡时，只有一张 UOB 卡会自动匹配；有多张时请在设置中指定。' },
        { title: '生成密钥并安装指令', body: '在设置中生成统一密钥并复制。下载 .shortcut 文件，在 iPhone「文件」App 打开，按提示粘贴密钥。若没有出现提问，请编辑「JSave Receipt Import」，把密钥填入第一个「文本」操作。', tip: '密钥只显示一次，请勿分享。日后更换账户设置，无需重新生成密钥或重装指令。' },
        { title: '从「照片」分享一张截图', body: '截取 TNG 付款成功页、收款详情页，或已支持的 CIMB「Transaction Details」单笔页面。在「照片」打开这张截图，点击分享，选择「JSave Receipt Import」。', tip: '交易列表或整份银行账单不是单笔截图，目前不会批量导入。' },
        { title: '核对资料再保存', body: '指令先在 iPhone 提取图片文字。支出或收入会让你选类别；接着检查金额、日期、账户和备注。确认无误才按「确认」，有疑问就取消。', tip: '只有提取出的文字会交给 JSave 解析，图片本身留在你的手机。' },
        { title: '选择照片去留，自动化可稍后加', body: '保存成功或发现重复后，可以保留或删除本次截图。先用「照片」分享方式测试成功，再视需要到「快捷指令 → 自动化」设置截图后运行统一指令。', tip: '截图自动化会受其他 App 的截图触发，无法只限 TNG 或 CIMB；不支持的图片会跳过。手动分享一直可以使用。' },
      ],
    },
    stories: [
      { no: '01', label: '快速记录', title: '真正坚持得下来的金钱习惯。', body: '选择金额、类别和账户，就够了。固定的每月开销可以自动记录，同时避免重复生成。', points: ['四种交易类型', '每月周期记账', '清楚的账户余额'] },
      { no: '02', label: '有用的反馈', title: '看懂今天，会怎样影响明天。', body: '每日预算把遥远的月度数字，变成当下可用的判断。目标进度和日均成本提供背景，但不评判你。', points: ['每日预算节奏', '目标进度', '真实日均成本'] },
      { no: '03', label: '为离线而设计', title: '没有信号，记录也依然在。', body: '每个账号都有独立的离线缓存。网络恢复后，排队中的修改会可靠地同步到你的私人云端路径。', points: ['账号隔离缓存', '可靠队列同步', '随时导出 CSV'] },
      { no: '04', label: 'AA 分账', title: '一笔共同消费，只算自己的那份。', body: '先替整桌付款、按人数均分，再记录谁已经还款。JSave 会保留完整账单，但个人支出统计只计入你自己的份额。', points: ['几秒完成均分', '清楚追踪还款', '个人支出不失真'] },
    ],
    lifestyleKicker: '为真实生活而做', lifestyleTitle: '看清钱，不应该让人焦虑。',
    lifestyleBody: 'JSave 在吉隆坡设计，关注的是组成一个月的普通小决定，而不是华而不实的金融表演。',
    lifestyleCards: [{ value: 'RM 38', label: '今天可安心使用' }, { value: '72%', label: '东京目标进度' }],
    goalKicker: '不只是账本',
    goalTitle: '让每一个储蓄目标，都有具体形状。',
    goalBody: '一趟旅行、一台新设备，或一笔应急金；当进度清楚可见，目标也会更容易理解。JSave 告诉你已经存了多少、还差多少，以及距离计划日期的节奏。',
    goalPoints: ['多个储蓄目标', '快速存入', '预计完成时间'],
    demoKicker: '真实产品', demoTitle: '亲自看看 JSave。', demoBody: '这里展示的是真实界面组件，不是概念图。切换页面，了解主要流程。',
    tabs: ['主页', '账本', '新增', '洞察', '目标'],
    toolkitKicker: '一套完整工具',
    toolkitTitle: '更多背景，不增加杂乱。',
    toolkitBody: '需要时提供足够细节，不需要时安静地退到后面。',
    toolkit: [
      { no: '01', title: '账户', body: '现金、银行和储蓄余额分别整理，一眼就能理解。' },
      { no: '02', title: '日历', body: '逐日回看整个月，不需要翻找也能找到一笔交易。' },
      { no: '03', title: '报表', body: '根据自己的真实记录，比较类别、收入和支出。' },
      { no: '04', title: '物品', body: '查看物品日均成本、加入分期计划，并追踪已付与待付款项。' },
      { no: '05', title: '周期记账', body: '固定月度项目只生成一次，并可靠同步到不同设备。' },
      { no: '06', title: '你的数据', body: '离线使用、私人同步，并在你选择时自由导出。' },
    ],
    guidesKicker: 'JSave 指南', guidesTitle: '不只介绍功能，也认真谈怎样使用。',
    guidesBody: '围绕真实马来西亚生活写成的长篇实用指南，解释怎样建立更安静、可持续的金钱习惯，以及 JSave 背后的产品取舍。',
    guidesRead: '阅读指南', guidesAll: '查看全部指南',
    principlesKicker: '产品原则', principlesTitle: '值得留在你日常里的工具。',
    principles: [
      { title: '有意采用手动记录', body: '由你决定什么进入账本。JSave 永远不会索取银行登录资料。' },
      { title: '数据按账号私有', body: '离线记录按用户隔离，并只同步到该用户自己的 Firebase 路径。' },
      { title: '默认如实表达', body: '不虚构 AI、用户数字，也不展示并不存在的付费等级。' },
    ],
    faqTitle: '几个实用答案。',
    faqs: [
      { q: '没有网络也能用吗？', a: '可以。离线时仍能添加和查看记录，网络恢复后会自动同步排队中的修改。' },
      { q: '需要连接银行吗？', a: '不需要。JSave 采用手动记账设计，绝不会索取银行登录资料。' },
      { q: '可以带走自己的数据吗？', a: '可以。你可以随时在设置中把全部交易导出为适合表格软件的 CSV。' },
      { q: 'JSave 收费吗？', a: '目前完整的 JSave 体验免费使用，没有付费功能墙。' },
    ],
    finalTitle: '从下一块钱开始。', finalBody: '两下记录，慢慢看清自己的钱。',
    footer: '于吉隆坡设计与打造。', close: '关闭', menu: '菜单',
  },
}

const PWA_STEPS = {
  en: {
    ios: ['Open this page in Safari', 'Tap the Share button', 'Choose “Add to Home Screen”'],
    android: ['Open the browser menu', 'Choose “Add to Home screen” or “Install app”', 'Confirm the installation'],
    desktop: ['Look for the install icon in the address bar', 'Choose “Install”'],
  },
  zh: {
    ios: ['使用 Safari 打开此页面', '点击分享按钮', '选择「添加到主屏幕」'],
    android: ['打开浏览器菜单', '选择「添加到主屏幕」或「安装应用」', '确认安装'],
    desktop: ['在地址栏寻找安装图标', '选择「安装」'],
  },
}

const NAV_TARGETS = ['#overview', '#journey', '#installments', '#product', '#guides', '#principles']

function Device({ children }) {
  return <div className="ji-device-viewport"><div className="ji-device-scale"><IOSDevice width={390} height={844} dark>{children}</IOSDevice></div></div>
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function FeatureGlyph({ type }) {
  if (type === 'capture') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v22M5 16h22"/><rect x="3.5" y="3.5" width="25" height="25" rx="8"/></svg>
  if (type === 'feedback') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24V13M13 24V7M21 24v-8M29 24V4"/><path d="M3 27h27"/></svg>
  if (type === 'split') return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="11" r="4"/><circle cx="22" cy="11" r="4"/><path d="M3.5 26c.7-5.1 3-7.5 6.5-7.5s5.8 2.4 6.5 7.5M15.5 26c.7-5.1 3-7.5 6.5-7.5s5.8 2.4 6.5 7.5"/></svg>
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13a9 9 0 0117-3M25 19a9 9 0 01-17 3"/><path d="M24 4v6h-6M8 28v-6h6"/></svg>
}

function InstallmentPreview({ copy, zh }) {
  const [price, setPrice] = useState(2400)
  const [term, setTerm] = useState(12)
  const [paidCount, setPaidCount] = useState(3)
  const [celebrating, setCelebrating] = useState(false)
  const isComplete = paidCount === term
  const monthly = price / term
  const remaining = (term - paidCount) * monthly
  const money = amount => `RM ${amount.toLocaleString('en-MY')}`
  const reset = () => { setPrice(2400); setTerm(12); setPaidCount(3); setCelebrating(false) }
  const recordPayment = () => {
    if (isComplete) return
    setPaidCount(paidCount + 1)
    if (paidCount + 1 === term) setCelebrating(true)
  }

  return <div className={`ji-installments-plan${isComplete ? ' is-complete' : ''}`} role="group" aria-label={copy.installmentsExample}>
    {celebrating && <div className="ji-installments-fireworks" aria-hidden="true">{[0, 1, 2].map(burst => <span className={`ji-installments-burst ji-installments-burst-${burst + 1}`} key={burst}>{Array.from({ length: 8 }, (_, spark) => <i key={spark} style={{ '--ji-spark-angle': `${spark * 45}deg` }} />)}</span>)}</div>}
    <div className="ji-installments-plan-title"><div><span className="ji-installments-example">{copy.installmentsExample}</span><strong>{copy.installmentsItem}</strong></div><div className="ji-installments-plan-state"><span>{String(paidCount).padStart(2, '0')} / {term}</span>{isComplete && <small role="status">✓ {copy.installmentsCelebrated}</small>}</div></div>
    <div className="ji-installments-plan-controls">
      <div className="ji-installments-price-control">
        <label htmlFor="ji-installments-price">{copy.installmentsPrice}<strong>{money(price)}</strong></label>
        <input id="ji-installments-price" type="range" min="1200" max="6000" step="120" value={price} onChange={event => setPrice(Number(event.target.value))} style={{ '--ji-range-progress': `${(price - 1200) / 4800 * 100}%` }} />
      </div>
      <div className="ji-installments-term-control" role="group" aria-label={copy.installmentsTerm}>
        <span>{copy.installmentsTerm}</span>
        <div>{[6, 12, 24].map(option => <button type="button" key={option} aria-pressed={term === option} onClick={() => { setTerm(option); setPaidCount(count => Math.min(count, option)); setCelebrating(false) }}>{option} {copy.installmentsMonths}</button>)}</div>
      </div>
    </div>
    <div className="ji-installments-progress-copy" aria-live="polite">{zh ? `已付 ${paidCount} / ${term} 期` : `${paidCount} of ${term} ${copy.installmentsPaid}`}</div>
    <div className="ji-installments-track" role="progressbar" aria-label={copy.installmentsProgress} aria-valuemin="0" aria-valuemax={term} aria-valuenow={paidCount}><i style={{ width: `${paidCount / term * 100}%` }} /></div>
    <div className="ji-installments-amounts"><div><span>{copy.installmentsNext}</span><strong>{money(monthly)}</strong></div><div><span>{copy.installmentsRemaining}</span><strong>{money(remaining)}</strong></div></div>
    <div className="ji-installments-actions"><button type="button" className="ji-installments-record" disabled={isComplete} onClick={recordPayment}>{isComplete ? copy.installmentsComplete : copy.installmentsRecord}<ArrowIcon /></button><button type="button" className="ji-installments-reset" onClick={reset}>{isComplete && <span aria-hidden="true">↻</span>}{isComplete ? copy.installmentsRetry : copy.installmentsReset}</button></div>
  </div>
}

function ShortcutGuideVisual({ step, zh, label }) {
  return <div className="ji-guide-art" role="img" aria-label={`${label}: ${step + 1}`}>
    <div className="ji-guide-phone">
      <div className="ji-guide-phone-status"><span>9:41</span><span>●●● ▰</span></div>
      {step === 0 && <div className="ji-guide-phone-screen">
        <div className="ji-guide-phone-title">JSave <span>{zh ? '设置' : 'Settings'}</span></div>
        <div className="ji-guide-screen-card"><b>{zh ? '统一收据截图快捷指令' : 'Unified receipt shortcut'}</b>
          <div className="ji-guide-account-row"><span>TNG</span><strong>{zh ? '我的钱包' : 'My wallet'} ✓</strong></div>
          <div className="ji-guide-account-row"><span>CIMB</span><strong>{zh ? '银行账户' : 'Bank account'} ✓</strong></div>
          <div className="ji-guide-screen-button">{zh ? '生成统一密钥' : 'Create unified key'}</div>
        </div>
      </div>}
      {step === 1 && <div className="ji-guide-phone-screen">
        <div className="ji-guide-phone-title">{zh ? '快捷指令' : 'Shortcuts'}</div>
        <div className="ji-guide-shortcut-icon">▣</div>
        <b className="ji-guide-shortcut-name">JSave Receipt Import</b>
        <div className="ji-guide-key-card"><span>{zh ? '统一密钥' : 'Unified key'}</span><strong>jsv1_ ••••••••••••</strong></div>
        <div className="ji-guide-screen-button">{zh ? '加入快捷指令' : 'Add Shortcut'}</div>
      </div>}
      {step === 2 && <div className="ji-guide-phone-screen">
        <div className="ji-guide-phone-title">{zh ? '照片' : 'Photos'}</div>
        <div className="ji-guide-receipt"><span>TNG</span><strong>−RM 13.00</strong><small>Kedai Kopi · 23/09/2026</small></div>
        <div className="ji-guide-share-sheet"><span>↥ {zh ? '分享' : 'Share'}</span><strong>▣ JSave Receipt Import</strong></div>
      </div>}
      {step === 3 && <div className="ji-guide-phone-screen">
        <div className="ji-guide-phone-title">JSave <span>{zh ? '核对交易' : 'Review entry'}</span></div>
        <div className="ji-guide-review-card"><strong>−RM 13.00</strong><div>Kedai Kopi</div><small>23/09/2026 · TNG</small><em>{zh ? '餐饮' : 'Food'}</em></div>
        <div className="ji-guide-screen-button">{zh ? '确认加入 JSave' : 'Confirm in JSave'}</div>
      </div>}
      {step === 4 && <div className="ji-guide-phone-screen">
        <div className="ji-guide-phone-title">JSave</div>
        <div className="ji-guide-result-check">✓</div>
        <b className="ji-guide-result-title">{zh ? '已加入 JSave' : 'Saved to JSave'}</b>
        <div className="ji-guide-photo-choice"><span>{zh ? '保留照片' : 'Keep photo'}</span><strong>{zh ? '删除照片' : 'Delete photo'}</strong></div>
        <div className="ji-guide-automation-chip">◉ {zh ? '自动化可选' : 'Automation is optional'}</div>
      </div>}
    </div>
  </div>
}

function ShortcutGuideModal({ copy, zh, onClose, returnFocusRef }) {
  const [step, setStep] = useState(0)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), a[href]') || [])]
      if (!controls.length) return
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault(); controls.at(-1).focus()
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault(); controls[0].focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      returnFocusRef.current?.focus()
    }
  }, [onClose, returnFocusRef])

  const current = copy.steps[step]
  return <div className="ji-guide-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="ji-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="ji-guide-title" aria-describedby="ji-guide-intro" ref={dialogRef}>
      <button className="ji-guide-close" ref={closeRef} onClick={onClose} aria-label={zh ? '关闭教程' : 'Close guide'}>×</button>
      <div className="ji-guide-heading"><p className="ji-kicker">{copy.eyebrow}</p><h2 id="ji-guide-title">{copy.title}</h2><p id="ji-guide-intro">{copy.intro}</p></div>
      <div className="ji-guide-progress" role="group" aria-label={zh ? '教程步骤' : 'Guide steps'}>
        {copy.steps.map((item, index) => <button key={item.title} className={index === step ? 'is-active' : ''}
          aria-current={index === step ? 'step' : undefined} aria-label={`${index + 1}. ${item.title}`}
          onClick={() => setStep(index)}>{String(index + 1).padStart(2, '0')}</button>)}
      </div>
      <div className="ji-guide-body" key={step}>
        <ShortcutGuideVisual step={step} zh={zh} label={`${copy.visualLabel}: ${current.title}`} />
        <div className="ji-guide-instructions" aria-live="polite">
          <span className="ji-guide-step-number">{String(step + 1).padStart(2, '0')} / {String(copy.steps.length).padStart(2, '0')}</span>
          <h3>{current.title}</h3><p>{current.body}</p>
          {step === 1 && <a className="ji-guide-download" href="https://jeeprod-jsave.web.app/shortcuts/JSave-Receipt-Import.shortcut" target="_blank" rel="noopener noreferrer">↓ {copy.download}</a>}
          <div className="ji-guide-tip"><span>✦</span><p>{current.tip}</p></div>
        </div>
      </div>
      <div className="ji-guide-actions">
        <button onClick={() => setStep(index => index - 1)} disabled={step === 0}>{copy.previous}</button>
        <button className="ji-guide-next" onClick={() => step === copy.steps.length - 1 ? onClose() : setStep(index => index + 1)}>
          {step === copy.steps.length - 1 ? copy.finish : copy.next}<ArrowIcon />
        </button>
      </div>
    </div>
  </div>
}

function Reveal({ children, className = '', delay = 0, direction = 'up', as: Tag = 'div', ...props }) {
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
    }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' })
    observer.observe(element)
    const safety = window.setTimeout(() => {
      const rect = element.getBoundingClientRect()
      if (rect.top < window.innerHeight * 1.2 && rect.bottom > 0) setVisible(true)
    }, 1400)
    return () => { window.clearTimeout(safety); observer.disconnect() }
  }, [])

  return <Tag {...props} ref={ref} className={`ji-reveal ji-reveal-${direction} ${visible ? 'is-visible' : ''} ${className}`} style={{ '--ji-reveal-delay': `${delay}ms` }}>{children}</Tag>
}

export default function JSaveIntro({ onOpenApp, withHead = true, language, onLanguageChange }) {
  const [localLanguage, setLocalLanguage] = useState(() => {
    const pathLanguage = window.location.pathname.match(/^\/(en|zh)(?:\/|$)/)?.[1]
    return pathLanguage || localStorage.getItem('jsave-lang') || 'en'
  })
  const [activeScreen, setActiveScreen] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [installGuide, setInstallGuide] = useState(null)
  const [shortcutGuideOpen, setShortcutGuideOpen] = useState(false)
  const shortcutGuideButtonRef = useRef(null)
  const deferredPromptRef = useRef(null)
  const lang = language || localLanguage
  const zh = lang === 'zh'
  const c = COPY[lang]
  const guideArticles = ARTICLE_SUMMARIES.map(article => ({ ...article, copy: article.locales[lang] }))
  const appHref = onOpenApp ? '#' : 'https://jsave.jeeprod.com'

  const screens = [
    <PhoneDashboard key="home" lang={lang} onNavigate={setActiveScreen} />,
    <PhoneTransactions key="ledger" lang={lang} onNavigate={setActiveScreen} />,
    <PhoneAdd key="add" lang={lang} onNavigate={setActiveScreen} />,
    <PhoneInsights key="insights" lang={lang} onNavigate={setActiveScreen} />,
    <PhoneGoals key="goals" lang={lang} onNavigate={setActiveScreen} />,
  ]

  const handleOpenApp = event => { if (onOpenApp) { event.preventDefault(); onOpenApp() } }
  const changeLanguage = () => {
    const next = zh ? 'en' : 'zh'
    if (onLanguageChange) {
      onLanguageChange(next)
      return
    }
    setLocalLanguage(next)
    localStorage.setItem('jsave-lang', next)
    if (window.location.hostname === 'jsave.jeeprod.com') {
      window.history.replaceState({}, '', `/${next}/${window.location.search}${window.location.hash}`)
    }
  }

  useEffect(() => {
    if (onOpenApp) return undefined
    const capturePrompt = event => { event.preventDefault(); deferredPromptRef.current = event }
    window.addEventListener('beforeinstallprompt', capturePrompt)
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt)
  }, [onOpenApp])

  const showInstall = () => {
    if (deferredPromptRef.current) { deferredPromptRef.current.prompt(); deferredPromptRef.current = null; return }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) { setInstallGuide('ios'); return }
    setInstallGuide(/Android/i.test(navigator.userAgent) ? 'android' : 'desktop')
  }

  const metaTitle = zh ? 'JSave — 花得清楚，存得从容' : 'JSave — Spend clearly. Save calmly.'
  const metaDescription = zh ? '为马来西亚日常生活而做的个人记账工具。快速记录、预算反馈、物品分期付款追踪、目标管理与离线同步。' : 'A focused personal finance companion for Malaysia with fast logging, budget feedback, item installment tracking, goals and offline sync.'

  return (
    <main className="ji-root">
      {withHead && <Helmet>
        <html lang={zh ? 'zh-CN' : 'en'} />
        <title>{metaTitle}</title><meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} /><meta property="og:description" content={metaDescription} />
        <meta property="og:url" content="https://jsave.jeeprod.com/" /><meta property="og:image" content="https://jsave.jeeprod.com/j-save-lifestyle.webp" />
        <link rel="canonical" href="https://jsave.jeeprod.com/" />
      </Helmet>}

      <nav className="ji-nav" aria-label={zh ? '主要导航' : 'Primary navigation'}>
        <div className="ji-nav-inner">
          <a className="ji-brand" href="#top" aria-label="JSave home"><span className="ji-brand-mark">J</span><span>JSave</span></a>
          <div className="ji-nav-links">{c.nav.map((item, index) => <a key={item} href={NAV_TARGETS[index]}>{item}</a>)}</div>
          <div className="ji-nav-actions">
            <button className="ji-language" onClick={changeLanguage} aria-label={zh ? 'Switch to English' : '切换到中文'}>{zh ? 'EN' : '中文'}</button>
            <a className="ji-nav-open" href={appHref} onClick={handleOpenApp}>{c.open}</a>
            <button className="ji-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label={c.menu}><span /><span /></button>
          </div>
        </div>
        {menuOpen && <div className="ji-mobile-menu">
          {c.nav.map((item, index) => <a key={item} href={NAV_TARGETS[index]} onClick={() => setMenuOpen(false)}>{item}</a>)}
          <a href={appHref} onClick={event => { setMenuOpen(false); handleOpenApp(event) }}>{c.open}</a>
        </div>}
      </nav>

      <section id="top" className="ji-hero">
        <div className="ji-hero-copy ji-hero-enter">
          <p className="ji-kicker">{c.eyebrow}</p><h1>{c.heroA}<br /><span>{c.heroB}</span></h1>
          <p className="ji-hero-body">{c.heroBody}</p>
          <div className="ji-hero-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.start}<ArrowIcon /></a><a className="ji-button ji-button-text" href="#overview">{c.explore}<ArrowIcon /></a></div>
          <div className="ji-assurances">{c.assurances.map(item => <span key={item}><i />{item}</span>)}</div>
        </div>
        <div className="ji-hero-product" aria-label={zh ? 'JSave 首页界面预览' : 'JSave home screen preview'}>
          <div className="ji-hero-halo" /><Device><PhoneDashboard lang={lang} /></Device>
          <div className="ji-float-card ji-float-budget"><span>{zh ? '今日预算' : 'TODAY'}</span><strong>RM 38</strong></div>
          <div className="ji-float-card ji-float-goal"><span>{zh ? '目标进度' : 'GOAL'}</span><strong>72%</strong></div>
        </div>
      </section>

      <section id="overview" className="ji-intro"><Reveal className="ji-section-copy"><p className="ji-kicker">{c.productKicker}</p><h2>{c.productTitle.map(line => <span key={line}>{line}</span>)}</h2><p>{c.productBody}</p></Reveal></section>

      <section id="journey" className="ji-journey">
        <Reveal direction="left" className="ji-journey-photo">
          <img src={`${JSAVE_BASE}/j-save-everyday.webp`} alt={zh ? '在吉隆坡咖啡店记录日常消费' : 'Recording an everyday purchase at a Kuala Lumpur cafe'} loading="lazy" />
          <div className="ji-photo-caption"><span>01</span>{zh ? '消费发生时，顺手记下。' : 'Capture it while it is fresh.'}</div>
        </Reveal>
        <div className="ji-journey-content">
          <Reveal direction="right"><p className="ji-kicker">{c.journeyKicker}</p><h2>{c.journeyTitle}</h2><p className="ji-journey-body">{c.journeyBody}</p></Reveal>
          <ol className="ji-journey-steps">{c.journeySteps.map((step, index) => <Reveal as="li" direction="right" delay={index * 90} key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></Reveal>)}</ol>
        </div>
      </section>

      <section id="installments" className="ji-installments" aria-labelledby="installments-title">
        <div className="ji-installments-inner">
          <Reveal direction="left" className="ji-installments-copy">
            <p className="ji-kicker">{c.installmentsKicker}</p>
            <h2 id="installments-title">{c.installmentsTitle}</h2>
            <p className="ji-installments-body">{c.installmentsBody}</p>
            <ol className="ji-installments-points">{c.installmentsPoints.map((point, index) => <li key={point.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{point.title}</h3><p>{point.body}</p></div></li>)}</ol>
          </Reveal>
          <Reveal direction="right" delay={100} className="ji-installments-gallery">
            <figure className="ji-installments-photo ji-installments-photo-main"><img src={`${JSAVE_BASE}/j-save-installment-laptop.webp`} alt={c.installmentsPhotoOne} loading="lazy" width="1536" height="1024" /></figure>
            <figure className="ji-installments-photo ji-installments-photo-detail"><img src={`${JSAVE_BASE}/j-save-installment-camera.webp`} alt={c.installmentsPhotoTwo} loading="lazy" width="1024" height="1536" /></figure>
            <InstallmentPreview copy={c} zh={zh} />
          </Reveal>
          <p className="ji-installments-note">{c.installmentsNote}</p>
        </div>
      </section>

      <section id="shortcut" className="ji-shortcut" aria-labelledby="shortcut-title">
        <Reveal direction="left" className="ji-shortcut-copy">
          <p className="ji-kicker">{c.shortcutKicker}</p>
          <h2 id="shortcut-title">{c.shortcutTitle}</h2>
          <p className="ji-shortcut-body">{c.shortcutBody}</p>
          <ol className="ji-shortcut-steps">{c.shortcutSteps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
          <button className="ji-shortcut-guide-button" ref={shortcutGuideButtonRef} onClick={() => setShortcutGuideOpen(true)}>{c.shortcutGuideButton}<ArrowIcon /></button>
          <p className="ji-shortcut-note">{c.shortcutNote}</p>
        </Reveal>
        <Reveal direction="scale" delay={120} className="ji-shortcut-visual" aria-label={zh ? 'TNG 截图导入示意' : 'TNG screenshot import illustration'}>
          <div className="ji-shortcut-card">
            <span className="ji-shortcut-scan" aria-hidden="true" />
            <div className="ji-shortcut-card-head"><span>{c.shortcutPreview}</span><b>JSave</b></div>
            <strong className="ji-shortcut-amount">−RM 13.00</strong>
            <div className="ji-shortcut-detail"><span>{c.shortcutMerchant}</span><b>Kedai Kopi</b></div>
            <div className="ji-shortcut-detail"><span>{c.shortcutDate}</span><b>23/09/2026</b></div>
            <div className="ji-shortcut-detail"><span>{c.shortcutCategory}</span><b className="ji-shortcut-tag">{c.shortcutFood}</b></div>
            <div className="ji-shortcut-card-confirm"><span>✓</span>{c.shortcutConfirm}</div>
          </div>
        </Reveal>
      </section>

      <section id="product" className="ji-stories">
        {c.stories.map((story, index) => <article className={`ji-story ji-story-${index + 1}`} key={story.no}>
          <Reveal direction={index % 2 === 0 ? 'left' : 'right'} className="ji-story-copy">
            <div className="ji-story-glyph"><FeatureGlyph type={['capture', 'feedback', 'sync', 'split'][index]} /></div>
            <p className="ji-story-label">{story.no} · {story.label}</p><h3>{story.title}</h3><p className="ji-story-body">{story.body}</p>
            <ul>{story.points.map(point => <li key={point}>{point}</li>)}</ul>
          </Reveal>
          <Reveal direction={index % 2 === 0 ? 'right' : 'left'} delay={120} className="ji-story-visual">
            {index === 0 && <div className="ji-story-phone"><Device><PhoneAdd lang={lang} /></Device></div>}
            {index === 1 && <div className="ji-budget-visual"><div className="ji-budget-head"><span>{zh ? '九月节奏' : 'SEPTEMBER PACE'}</span><b>68%</b></div><div className="ji-budget-track"><span /></div><div className="ji-budget-row"><span>{zh ? '今天已用' : 'Spent today'}</span><strong>RM 42.60</strong></div><div className="ji-budget-row"><span>{zh ? '仍可安心使用' : 'Still comfortable'}</span><strong className="is-green">RM 38.20</strong></div></div>}
            {index === 2 && <div className="ji-sync-visual"><div className="ji-sync-device"><span>{zh ? '手机' : 'PHONE'}</span><b>12</b><small>{zh ? '本地记录' : 'local records'}</small></div><div className="ji-sync-line"><i /><i /><i /></div><div className="ji-sync-device"><span>{zh ? '私人云端' : 'PRIVATE CLOUD'}</span><b>12</b><small>{zh ? '已同步' : 'synced safely'}</small></div></div>}
            {index === 3 && <div className="ji-split-visual">
              <div className="ji-split-head"><div><span>{zh ? 'AA 分账' : 'AA SPLIT'}</span><h4>{zh ? '周五晚餐' : 'Friday dinner'}</h4></div><strong>RM 168.00</strong></div>
              <div className="ji-split-people">
                {[
                  { initial: 'Y', name: zh ? '你' : 'You', status: zh ? '计入我的支出' : 'counts as your spend', own: true },
                  { initial: 'M', name: 'Mei', status: zh ? '已还款' : 'settled', settled: true },
                  { initial: 'K', name: 'Kai', status: zh ? '等待还款' : 'pending' },
                  { initial: 'A', name: 'Aina', status: zh ? '已还款' : 'settled', settled: true },
                ].map(person => <div className={`ji-split-person${person.own ? ' is-own' : ''}${person.settled ? ' is-settled' : ''}`} key={person.name}>
                  <span className="ji-split-avatar">{person.initial}</span><div><b>{person.name}</b><small className={person.settled ? 'is-settled' : ''}>{person.status}</small></div><strong>RM 42.00</strong>
                </div>)}
              </div>
              <div className="ji-split-summary"><span>{zh ? '我的实际支出' : 'YOUR ACTUAL SPEND'}</span><strong>RM 42.00</strong></div>
            </div>}
          </Reveal>
        </article>)}
      </section>

      <section className="ji-lifestyle">
        <img src={`${JSAVE_BASE}/j-save-lifestyle.webp`} alt={zh ? '桌面上的手机、笔记本与 JSave 乌龟摆件' : 'A phone, notebook and JSave turtle on a calm desk'} loading="lazy" />
        <div className="ji-lifestyle-shade" /><Reveal direction="left" className="ji-lifestyle-copy"><p className="ji-kicker">{c.lifestyleKicker}</p><h2>{c.lifestyleTitle}</h2><p>{c.lifestyleBody}</p></Reveal>
        <Reveal direction="up" delay={140} className="ji-lifestyle-metrics">{c.lifestyleCards.map(card => <div key={card.label}><strong>{card.value}</strong><span>{card.label}</span></div>)}</Reveal>
      </section>

      <section className="ji-goal-story">
        <Reveal direction="left" className="ji-goal-copy">
          <p className="ji-kicker">{c.goalKicker}</p><h2>{c.goalTitle}</h2><p>{c.goalBody}</p>
          <ul>{c.goalPoints.map(point => <li key={point}>{point}</li>)}</ul>
        </Reveal>
        <Reveal direction="scale" delay={120} className="ji-goal-photo">
          <img src={`${JSAVE_BASE}/j-save-goals.webp`} alt={zh ? '两个人一起规划旅行储蓄目标' : 'Two people planning a travel savings goal together'} loading="lazy" />
          <div className="ji-goal-progress"><span>{zh ? '旅行目标' : 'TRAVEL GOAL'}</span><strong>72%</strong><i><b /></i></div>
        </Reveal>
      </section>

      <section className="ji-demo" aria-labelledby="demo-title">
        <Reveal direction="left" className="ji-demo-copy"><p className="ji-kicker">{c.demoKicker}</p><h2 id="demo-title">{c.demoTitle}</h2><p>{c.demoBody}</p>
          <div className="ji-demo-tabs" role="tablist" aria-label={c.demoTitle}>{c.tabs.map((tab, index) => <button key={tab} role="tab" aria-selected={activeScreen === index} onClick={() => setActiveScreen(index)}><span>{String(index + 1).padStart(2, '0')}</span>{tab}</button>)}</div>
        </Reveal>
        <Reveal direction="scale" delay={120} className="ji-demo-stage" role="tabpanel" aria-label={c.tabs[activeScreen]}><div className="ji-demo-screen" key={activeScreen}><Device>{screens[activeScreen]}</Device></div></Reveal>
      </section>

      <section className="ji-toolkit">
        <Reveal className="ji-toolkit-heading"><p className="ji-kicker">{c.toolkitKicker}</p><h2>{c.toolkitTitle}</h2><p>{c.toolkitBody}</p></Reveal>
        <div className="ji-toolkit-grid">{c.toolkit.map((item, index) => <Reveal as="article" direction="scale" delay={(index % 3) * 90} key={item.no}><span>{item.no}</span><h3>{item.title}</h3><p>{item.body}</p></Reveal>)}</div>
      </section>

      <section id="guides" className="ji-guides">
        <Reveal className="ji-guides-heading"><p className="ji-kicker">{c.guidesKicker}</p><h2>{c.guidesTitle}</h2><p>{c.guidesBody}</p></Reveal>
        <div className="ji-guides-grid">{guideArticles.map((article, index) => <Reveal as="article" direction="scale" delay={index * 90} key={article.slug}>
          <a href={articleHref(article.slug, lang)}>
            <div className="ji-guide-image"><img src={article.image} alt="" loading="lazy" width="1600" height="1067" /><span>{String(index + 1).padStart(2, '0')}</span></div>
            <p>{article.copy.category}</p><h3>{article.copy.title}</h3><div>{article.copy.deck}</div><b>{c.guidesRead}<ArrowIcon /></b>
          </a>
        </Reveal>)}</div>
        <Reveal><a className="ji-guides-all" href={guidesHref(lang)}>{c.guidesAll}<ArrowIcon /></a></Reveal>
      </section>

      <section id="principles" className="ji-principles">
        <Reveal className="ji-section-copy"><p className="ji-kicker">{c.principlesKicker}</p><h2>{c.principlesTitle}</h2></Reveal>
        <div className="ji-principle-grid">{c.principles.map((principle, index) => <Reveal as="article" direction="scale" delay={index * 90} key={principle.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{principle.title}</h3><p>{principle.body}</p></Reveal>)}</div>
      </section>

      <section className="ji-faq"><Reveal as="h2">{c.faqTitle}</Reveal><div>{c.faqs.map((faq, index) => {
        const expanded = openFaq === index
        return <Reveal as="article" delay={index * 55} key={faq.q}><button onClick={() => setOpenFaq(expanded ? -1 : index)} aria-expanded={expanded}><span>{faq.q}</span><i>{expanded ? '−' : '+'}</i></button><div className={expanded ? 'is-open' : ''}><p>{faq.a}</p></div></Reveal>
      })}</div></section>

      <section className="ji-final"><div className="ji-final-glow" /><Reveal direction="scale"><h2>{c.finalTitle}</h2><p>{c.finalBody}</p><div className="ji-final-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.open}<ArrowIcon /></a>{!onOpenApp && <button className="ji-button ji-button-secondary" onClick={showInstall}>{c.install}</button>}</div></Reveal></section>
      <footer className="ji-footer"><a className="ji-brand" href="#top"><span className="ji-brand-mark">J</span><span>JSave</span></a><p>{c.footer}</p><span>© 2026 JSave · <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer">Jee Production</a></span></footer>

      {!onOpenApp && installGuide && <div className="ji-modal-backdrop" onClick={() => setInstallGuide(null)}><div className="ji-install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={event => event.stopPropagation()}><button className="ji-modal-close" onClick={() => setInstallGuide(null)} aria-label={c.close}>×</button><span className="ji-brand-mark">J</span><h2 id="install-title">{c.install} JSave</h2><ol>{PWA_STEPS[lang][installGuide].map(step => <li key={step}>{step}</li>)}</ol></div></div>}
      {shortcutGuideOpen && <ShortcutGuideModal copy={c.shortcutGuide} zh={zh} onClose={() => setShortcutGuideOpen(false)} returnFocusRef={shortcutGuideButtonRef} />}
    </main>
  )
}
