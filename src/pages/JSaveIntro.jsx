import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import JSaveInstagram from './JSaveInstagram'
import { IOSDevice } from '../jsave/components/IOSDevice'
import {
  PhoneAdd,
  PhoneDashboard,
  PhoneGoals,
  PhoneInsights,
  PhoneTransactions,
} from '../jsave/components/PhoneScreens'
import { JSAVE_BASE } from '../jsave/utils/basePath'
import { isIPhoneDevice } from '../jsave/utils/device'
import { RECEIPT_SHORTCUT_VERSION } from '../jsave/version'
import { ARTICLE_SUMMARIES, articleHref, guidesHref } from '../jsave/data/articleRoutes'
import '../jsave/design-system.css'
import './JSaveIntro.css'

const COPY = {
  en: {
    nav: ['Product', 'Installments', 'Receipt import', 'FAQ', 'Instagram', 'Guides'],
    open: 'Open JSave', install: 'Install',
    eyebrow: 'Personal finance, without the noise',
    heroA: 'Spend clearly.', heroB: 'Save calmly.',
    heroBody: 'A focused money companion for everyday life in Malaysia. Record a purchase in seconds, understand your pace, and keep moving toward what matters.',
    start: 'Start free', explore: 'Explore the product',
    assurances: ['No bank connection', 'Works offline', 'English + 中文'],
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
    shortcutKicker: 'ONE RECEIPT · ONE IPHONE SHORTCUT',
    shortcutTitle: 'From payment screenshot to JSave entry.',
    shortcutBody: 'One shortcut reads supported TNG and CIMB receipts, and lets you review and complete single receipts from other banks or apps. Choose from your own JSave accounts and check the details before saving.',
    shortcutSteps: [
      { title: 'Capture', body: 'Share one transaction screenshot from Photos, or select it in the shortcut.' },
      { title: 'Check', body: 'Choose a category and review the amount, date, account and suggested note.' },
      { title: 'Save', body: 'Confirm the entry, then choose whether to keep or delete the screenshot.' },
    ],
    shortcutNote: 'Create a key in JSave Settings. Accounts are matched or selected during import, then remembered after confirmation. Text is extracted on your iPhone; the screenshot itself is not uploaded.',
    shortcutPreview: 'IMPORT PREVIEW', shortcutMerchant: 'Merchant', shortcutDate: 'Date', shortcutCategory: 'Category', shortcutFood: 'Food', shortcutConfirm: 'Confirm to add to JSave',
    shortcutGuideButton: 'iPhone shortcut setup guide',
    shortcutGuide: {
      eyebrow: 'IPHONE WALKTHROUGH', title: 'Turn one screenshot into one entry.',
      intro: 'Five short steps, from preparing your key to reviewing the saved transaction. The pictures are guides, not screenshots from your phone.',
      visualLabel: 'Illustration', previous: 'Back', next: 'Next step', finish: 'Done', download: 'Download unified shortcut', downloadIPhoneOnly: 'Open this guide on your iPhone to download the shortcut.',
      steps: [
        { title: 'Prepare your key', body: 'Open JSave → Settings → Download screenshot shortcut. New users can create and copy a unified key without setting account links first. Create the bank or wallet accounts you use in JSave Accounts.', tip: 'Upgrading? Copy the key from the first Text action in your existing JSave Receipt Import before replacing it. Your existing key and account links still work.' },
        { title: 'Download and install', body: 'Download the .shortcut file, open it from Files on your iPhone, and paste the key when asked. If no setup question appears, edit “JSave Receipt Import” and paste the key into its first Text action.', tip: 'The key appears only once in Settings. Keep it private. You do not need to generate a new key when upgrading or changing linked accounts.' },
        { title: 'Share and choose accounts', body: 'In Photos, open one transaction screenshot, tap Share, then choose “JSave Receipt Import”. You can also open the shortcut and select a photo. Choose from your own JSave accounts when needed; transfers use separate source and destination accounts.', tip: 'No account linking setup is needed. Confirmed choices are remembered; choose Change accounts in the preview to use a different account. Transaction lists and whole statements are not supported.' },
        { title: 'Review before saving', body: 'Supported TNG and CIMB formats are parsed automatically. For an unfamiliar receipt, choose whether to complete it, then check the source, type, RM amount, date and note. Confirm the category and accounts before saving.', tip: 'Maybank, Shopee, Grab and other formats can use manual completion; they are not all parsed automatically. Ambiguous bank screens ask for their source. Only extracted text goes to JSave; the image stays on your phone.' },
        { title: 'Keep the photo or automate later', body: 'After a save or duplicate result, choose to keep or delete that exact photo. Once sharing from Photos works, you may add an optional screenshot automation in the Shortcuts app that runs JSave Receipt Import.', tip: 'Automation can run after screenshots in other apps too. Ordinary screenshots are skipped; likely receipts with missing details ask whether to complete them. Download the updated shortcut once and keep your existing key.' },
      ],
    },
    demoKicker: 'THE REAL PRODUCT', demoTitle: 'Tap through JSave.',
    demoBody: 'Record, understand, adjust. Switch between the previews and try a sample entry.',
    tabs: ['Home', 'Ledger', 'Add', 'Insights', 'Goals', 'AA split'],
    demoDescriptions: [
      'Your balances, daily budget and goal progress, together in one clear view.',
      'Find a purchase, review a day, and keep each account’s records in order.',
      'Choose the amount, category and account. Try saving a sample entry here.',
      'See where your money goes and how today fits into your monthly budget.',
      'Give a trip, a new device or your emergency fund a visible savings target.',
      'Split a shared bill and track repayments. Only your own share counts as spending.',
    ],
    toolkit: [
      { no: '01', title: 'Accounts', body: 'Cash, bank and savings balances stay separate and easy to understand.' },
      { no: '02', title: 'Calendar', body: 'Review the month day by day and find a transaction without digging.' },
      { no: '03', title: 'Reports', body: 'Compare categories, income and spending with charts grounded in your own entries.' },
      { no: '04', title: 'Things', body: 'See an item’s cost per day, add its installment plan, and follow what is paid or still due.' },
      { no: '05', title: 'Recurring', body: 'Let predictable monthly entries appear once, reliably, across your devices.' },
      { no: '06', title: 'Your data', body: 'Use it offline, sync it privately, and export it when you choose.' },
    ],
    guidesKicker: 'JSave GUIDES',
    guidesRead: 'Read guide', guidesAll: 'View all guides',
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
    nav: ['核心功能', '分期付款', '截图导入', '常见问题', 'Instagram', '指南'], open: '打开 JSave', install: '安装',
    eyebrow: '个人理财，不需要噪音', heroA: '花得清楚。', heroB: '存得从容。',
    heroBody: '为马来西亚日常生活而做的专注理财伙伴。几秒记下一笔，看懂自己的节奏，继续走向真正重要的目标。',
    start: '免费开始', explore: '看看产品', assurances: ['无需连接银行', '离线可用', '中文 + English'],
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
    shortcutKicker: '单笔收据 · 统一 IPHONE 快捷指令',
    shortcutTitle: '付款截图，核对后记进 JSave。',
    shortcutBody: '同一个 iPhone 指令自动识别已支持的 TNG 和 CIMB 收据，其他银行或 App 的单笔收据可核对并补全。直接选择自己在 JSave 建立的账户，确认资料后才保存。',
    shortcutSteps: [
      { title: '截屏', body: '从「照片」分享一张单笔交易截图，也可直接打开指令选照片。' },
      { title: '核对', body: '选择类别，检查金额、日期、账户和预设备注。' },
      { title: '保存', body: '确认加入账本后，可选择保留或删除这张截图。' },
    ],
    shortcutNote: '在 JSave 设置中建立统一密钥。账户在导入时匹配或选择，确认保存后自动记住。文字由 iPhone 提取，截图本身不会上传。',
    shortcutPreview: '导入预览', shortcutMerchant: '商家', shortcutDate: '日期', shortcutCategory: '类别', shortcutFood: '餐饮', shortcutConfirm: '确认加入 JSave',
    shortcutGuideButton: '查看 iPhone 快捷指令教程',
    shortcutGuide: {
      eyebrow: 'IPHONE 操作教程', title: '一张截图，核对后记下一笔。',
      intro: '从准备密钥到确认入账，分五步完成。下方画面是操作示意，不是你的手机截图。',
      visualLabel: '操作示意', previous: '上一步', next: '下一步', finish: '完成', download: '下载统一快捷指令', downloadIPhoneOnly: '请用 iPhone 打开本教程下载快捷指令。',
      steps: [
        { title: '准备统一密钥', body: '打开 JSave → 设置 → 截图快捷指令下载。新用户直接生成并复制统一密钥，无需先关联账户。自己使用的银行、钱包或信用卡仍需在 JSave「账户」建立。', tip: '升级时，先从旧「JSave Receipt Import」的第一个「文本」操作复制密钥，再替换指令。原密钥和已关联账户继续有效。' },
        { title: '下载并安装指令', body: '下载 .shortcut 文件，在 iPhone「文件」App 打开，按提示粘贴密钥。若没有出现提问，请编辑「JSave Receipt Import」，把密钥填入第一个「文本」操作。', tip: '密钥在设置页只显示一次，请勿分享。升级指令或更换关联账户，无需重新生成密钥。' },
        { title: '分享截图，按需要选账户', body: '在「照片」打开一张单笔交易截图，点击分享，选择「JSave Receipt Import」；也可直接打开指令选择照片。需要时从自己已建立的 JSave 账户中选择，转账分别选择转出与转入账户。', tip: '无需预先关联账户。确认后自动记住选择，要改时在保存前点「更换账户」。交易列表或整份账单不会批量导入。' },
        { title: '核对或补全资料再保存', body: '已支持的 TNG、CIMB 格式自动识别；陌生收据会先问要不要补全，再核对来源、交易类型、RM 金额、日期和备注。选好类别与账户后，确认无误才保存。', tip: 'Maybank、Shopee、Grab 等新格式可用补全模式，并非全部自动识别。银行来源不明确时会请你确认。只有提取出的文字会交给 JSave，图片留在手机。' },
        { title: '选择照片去留，自动化可稍后加', body: '保存成功或发现重复后，可以保留或删除本次截图。先用「照片」分享方式测试成功，再视需要到「快捷指令 → 自动化」设置截图后运行统一指令。', tip: '普通截图安静跳过；疑似收据但资料不完整时，先问是否补全。此次升级需重新下载指令一次，沿用原统一密钥即可。' },
      ],
    },
    demoKicker: '真实产品', demoTitle: '亲自看看 JSave。', demoBody: '记录、看懂、调整。切换下面的预览，也可以亲手试记一笔。',
    tabs: ['主页', '账本', '新增', '洞察', '目标', 'AA 分账'],
    demoDescriptions: [
      '账户余额、每日预算与目标进度，放在同一个清楚的视角里。',
      '找回一笔消费、回看某一天，把不同账户的记录整理好。',
      '填好金额、类别和账户，就能记下一笔。这里也可以试着保存示例。',
      '看懂钱花在哪里，以及今天的消费怎样影响整个月的预算。',
      '旅行、新设备或应急金，都可以有看得见的储蓄进度。',
      '共同消费可以均分并追踪还款；个人支出只计算自己的那一份。',
    ],
    toolkit: [
      { no: '01', title: '账户', body: '现金、银行和储蓄余额分别整理，一眼就能理解。' },
      { no: '02', title: '日历', body: '逐日回看整个月，不需要翻找也能找到一笔交易。' },
      { no: '03', title: '报表', body: '根据自己的真实记录，比较类别、收入和支出。' },
      { no: '04', title: '物品', body: '查看物品日均成本、加入分期计划，并追踪已付与待付款项。' },
      { no: '05', title: '周期记账', body: '固定月度项目只生成一次，并可靠同步到不同设备。' },
      { no: '06', title: '你的数据', body: '离线使用、私人同步，并在你选择时自由导出。' },
    ],
    guidesKicker: 'JSave 指南',
    guidesRead: '阅读指南', guidesAll: '查看全部指南',
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

const NAV_TARGETS = ['#product', '#installments', '#shortcut', '#principles', '#instagram', '#guides']

function Device({ children }) {
  return <div className="ji-device-viewport"><div className="ji-device-scale"><IOSDevice width={390} height={844} dark>{children}</IOSDevice></div></div>
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
        <div className="ji-guide-screen-card"><b>{zh ? '截图快捷指令下载' : 'Download screenshot shortcut'}</b>
          <div className="ji-guide-account-row"><span>{zh ? '账户' : 'Accounts'}</span><strong>{zh ? '导入时选择' : 'Choose on import'}</strong></div>
          <div className="ji-guide-account-row"><span>{zh ? '已升级？' : 'Upgrading?'}</span><strong>{zh ? '沿用原密钥' : 'Keep your key'}</strong></div>
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
  const isIPhone = isIPhoneDevice()
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
          {step === 1 && (isIPhone
            ? <a className="ji-guide-download" href={`https://jeeprod-jsave.web.app/shortcuts/JSave-Receipt-Import.shortcut?v=${RECEIPT_SHORTCUT_VERSION}`} target="_blank" rel="noopener noreferrer">↓ {copy.download}</a>
            : <p className="ji-guide-device-notice" role="note">{copy.downloadIPhoneOnly}</p>)}
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
  const guideArticles = ARTICLE_SUMMARIES.slice(0, 3).map(article => ({ ...article, copy: article.locales[lang] }))
  const guideLink = path => JSAVE_BASE ? `https://jsave.jeeprod.com${path}` : path
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
          <div className="ji-hero-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.start}<ArrowIcon /></a><a className="ji-button ji-button-text" href="#product">{c.explore}<ArrowIcon /></a></div>
          <div className="ji-assurances">{c.assurances.map(item => <span key={item}><i />{item}</span>)}</div>
        </div>
        <div className="ji-hero-product" aria-label={zh ? 'JSave 首页界面预览' : 'JSave home screen preview'}>
          <div className="ji-hero-halo" /><Device><PhoneDashboard lang={lang} /></Device>
          <div className="ji-float-card ji-float-budget"><span>{zh ? '今日预算' : 'TODAY'}</span><strong>RM 38</strong></div>
          <div className="ji-float-card ji-float-goal"><span>{zh ? '目标进度' : 'GOAL'}</span><strong>72%</strong></div>
        </div>
      </section>

      <section id="product" className="ji-demo ji-demo-compact" aria-labelledby="demo-title">
        <span id="overview" className="ji-anchor" aria-hidden="true" /><span id="journey" className="ji-anchor" aria-hidden="true" />
        <Reveal direction="left" className="ji-demo-copy">
          <p className="ji-kicker">{c.demoKicker}</p><h2 id="demo-title">{c.demoTitle}</h2><p>{c.demoBody}</p>
          <div className="ji-demo-tabs" role="tablist" aria-label={c.demoTitle}>{c.tabs.map((tab, index) => <button key={tab} id={`demo-tab-${index}`} role="tab" aria-selected={activeScreen === index} aria-controls="demo-panel" tabIndex={activeScreen === index ? 0 : -1} onClick={() => setActiveScreen(index)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? c.tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + c.tabs.length) % c.tabs.length
            setActiveScreen(next)
            event.currentTarget.parentElement.children[next].focus()
          }}><span>{String(index + 1).padStart(2, '0')}</span>{tab}</button>)}</div>
          <p className="ji-demo-description" aria-live="polite">{c.demoDescriptions[activeScreen]}</p>
          <figure className="ji-demo-photo"><img src={`${JSAVE_BASE}/${activeScreen === 4 ? 'j-save-goals.webp' : 'j-save-everyday.webp'}`} alt={zh ? (activeScreen === 4 ? '一起规划旅行储蓄目标' : '在咖啡店记录日常消费') : (activeScreen === 4 ? 'Planning a travel savings goal together' : 'Recording a purchase at a cafe')} loading="lazy" /><figcaption>{zh ? '从今天的小记录，走向想要的生活。' : 'Small entries today. Room for what matters.'}</figcaption></figure>
          <details className="ji-more-features"><summary>{zh ? '还有哪些实用功能？' : 'What else is included?'}</summary><dl>{c.toolkit.map(item => <div key={item.no}><dt>{item.title}</dt><dd>{item.body}</dd></div>)}</dl></details>
        </Reveal>
        <Reveal direction="scale" delay={120} className="ji-demo-stage" id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${activeScreen}`} tabIndex={0}><div className={`ji-demo-screen${activeScreen === 5 ? ' ji-demo-aa' : ''}`} key={activeScreen}>{activeScreen === 5 ? <div className="ji-split-visual">
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
            </div> : <Device>{screens[activeScreen]}</Device>}</div></Reveal>
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

      <section id="principles" className="ji-trust" aria-labelledby="trust-title">
        <Reveal direction="left" className="ji-trust-copy"><p className="ji-kicker">{zh ? '安心使用' : 'MADE FOR EVERYDAY TRUST'}</p><h2 id="trust-title">{zh ? '你的记录，由你掌握。' : 'Your records. Your choice.'}</h2><p>{zh ? '无需连接银行。离线也能记录，联网后同步；需要时，带走自己的数据。' : 'No bank connection needed. Record offline, sync when connected, and take your data with you.'}</p><div className="ji-trust-badges">{(zh ? ['离线可用', '账号私有', 'CSV 导出', '目前免费'] : ['Works offline', 'Private to you', 'CSV export', 'Currently free']).map(item => <span key={item}>✓ {item}</span>)}</div></Reveal>
        <div className="ji-faq ji-faq-compact"><Reveal as="h3">{c.faqTitle}</Reveal><div>{c.faqs.map((faq, index) => {
          const expanded = openFaq === index
          return <Reveal as="article" delay={index * 55} key={faq.q}><button id={`faq-question-${index}`} onClick={() => setOpenFaq(expanded ? -1 : index)} aria-expanded={expanded} aria-controls={`faq-answer-${index}`}><span>{faq.q}</span><i aria-hidden="true">{expanded ? '−' : '+'}</i></button><div id={`faq-answer-${index}`} className={expanded ? 'is-open' : ''} aria-hidden={!expanded}><p>{faq.a}</p></div></Reveal>
        })}</div></div>
      </section>

      <section className="ji-updates" aria-label={zh ? '最新分享与指南' : 'Latest posts and guides'}>
        <JSaveInstagram zh={zh} />
        <div id="guides" className="ji-resources">
          <Reveal className="ji-resources-heading"><div><p className="ji-kicker">{c.guidesKicker}</p><h2>{zh ? '想再多了解一点？' : 'A little more reading.'}</h2></div><a href={guideLink(guidesHref(lang))}>{c.guidesAll}<ArrowIcon /></a></Reveal>
          <div className="ji-resource-links">{guideArticles.map((article, index) => <Reveal as="article" delay={index * 70} key={article.slug}><a href={guideLink(articleHref(article.slug, lang))}><img src={`${JSAVE_BASE}${article.image}`} alt="" loading="lazy" width="1600" height="1067" /><div><p>{article.copy.category}</p><h3>{article.copy.title}</h3><span>{c.guidesRead}<ArrowIcon /></span></div></a></Reveal>)}</div>
        </div>
      </section>

      <section className="ji-final"><div className="ji-final-glow" /><Reveal direction="scale"><h2>{c.finalTitle}</h2><p>{c.finalBody}</p><div className="ji-final-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.open}<ArrowIcon /></a>{!onOpenApp && <button className="ji-button ji-button-secondary" onClick={showInstall}>{c.install}</button>}</div></Reveal></section>
      <footer className="ji-footer"><a className="ji-brand" href="#top"><span className="ji-brand-mark">J</span><span>JSave</span></a><p>{c.footer}</p><span>© 2026 JSave · <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer">Jee Production</a></span></footer>

      {!onOpenApp && installGuide && <div className="ji-modal-backdrop" onClick={() => setInstallGuide(null)}><div className="ji-install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={event => event.stopPropagation()}><button className="ji-modal-close" onClick={() => setInstallGuide(null)} aria-label={c.close}>×</button><span className="ji-brand-mark">J</span><h2 id="install-title">{c.install} JSave</h2><ol>{PWA_STEPS[lang][installGuide].map(step => <li key={step}>{step}</li>)}</ol></div></div>}
      {shortcutGuideOpen && <ShortcutGuideModal copy={c.shortcutGuide} zh={zh} onClose={() => setShortcutGuideOpen(false)} returnFocusRef={shortcutGuideButtonRef} />}
    </main>
  )
}
