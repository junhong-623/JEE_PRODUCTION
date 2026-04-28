export const RELEASE_NOTES = [
  {
    version: '2.6.0',
    date: '2026-04-28',
    isLatest: true,
    items: [
      'New transaction type: AA Split — pay the full bill, only your share counts as expense',
      'Track which friends have returned money; choose which account receives each return',
      '+/− stepper for number of people in a split',
      'Friends list defaults to simplified view (#2, #3…); tap "Add names" for details',
      'Fixed 404 error when refreshing /jsave or navigating to /jsave-intro directly',
      'Fixed admin panel header overlapping the phone status bar',
    ],
    itemsZh: [
      '新增交易类型：分AA — 先垫付全额账单，支出统计只计你的份额',
      '追踪朋友还款进度，可为每位朋友指定还款账户',
      '分摊人数改用 +/− 步进按钮调整',
      '朋友列表默认简化显示（#2、#3…），点击「填写姓名」展开输入',
      '修复刷新 /jsave 或直接访问 /jsave-intro 时出现 404 的问题',
      '修复管理面板标题与手机状态栏重叠的问题',
    ],
  },
  {
    version: '2.5.2',
    date: '2026-04-23',
    items: [
      'Offline warning shown when clearing cache while disconnected',
      'Blocking "please wait" screen during cache clear & reload',
      'Cache size now accurately reported using Storage API',
    ],
    itemsZh: [
      '离线时清除缓存前显示警告提示',
      '缓存清除及重载期间显示阻断式「请稍候」界面',
      '缓存大小改用 Storage API 准确显示',
    ],
  },
  {
    version: '2.5.1',
    date: '2026-04-23',
    isLatest: false,
    items: [
      "What's New and Install App dialogs now appear centered",
      'Close (✕) button consistently aligned to the right',
    ],
    itemsZh: [
      '「更新日志」与「安装应用」弹窗改为居中显示',
      '关闭（✕）按钮统一对齐右侧',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-04-23',
    isLatest: false,
    items: [
      'Fixed daily reminder push notifications (were silently broken)',
      'Push re-subscription required — toggle Daily Reminder off and on once in Settings',
    ],
    itemsZh: [
      '修复每日提醒推送通知（此前静默失效）',
      '需重新订阅推送 — 在设置中将「每日提醒」关闭后重新开启',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-04-23',
    isLatest: false,
    items: [
      'Treat Me a Coffee: QR payment option (scan with phone via DuitNow / FPX)',
      'Minimum donation amount set to RM 5',
      'Payment cancelled dialog when closing the pay modal',
    ],
    itemsZh: [
      '请我喝咖啡：新增 QR 扫码支付（DuitNow / FPX）',
      '最低捐款金额设为 RM 5',
      '关闭支付弹窗时显示支付未完成提示',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-04-23',
    isLatest: false,
    items: [
      'Install App button in Settings → About (shown when running in browser)',
      'One-time install prompt dialog when opening JSave in browser',
      'Install guide on /jsave-intro: iOS dialog, Android & Desktop step-by-step modal',
    ],
    itemsZh: [
      '设置 → 关于新增「安装应用」按钮（在浏览器中打开时显示）',
      '在浏览器中首次打开 J省 时显示一次性安装引导弹窗',
      '/jsave-intro 安装指南：iOS 弹窗、Android 与桌面端步骤引导',
    ],
  },
  {
    version: '2.2.1',
    date: '2026-04-22',
    items: [
      "What's New now shows as an in-app modal (works on all platforms including iOS PWA)",
    ],
    itemsZh: [
      '「更新日志」改为应用内弹窗显示（支持所有平台，包括 iOS PWA）',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-04-22',
    items: [
      'Restored first-launch intro slides inside the app',
      'CTA logo on /jsave-intro now has travel animation (same as MateTrip)',
      'Release notes show top 5 with expand/collapse toggle',
      'Release notes fully bilingual (EN/ZH)',
    ],
    itemsZh: [
      '恢复应用内首次启动引导幻灯片',
      '/jsave-intro 页面 CTA 图标新增旅行动画（与 MateTrip 一致）',
      '更新日志默认显示前5条，支持展开/收起',
      '更新日志完整支持中英双语',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-04-22',
    items: [
      'Removed PWA install guide and release notes from home page',
      "Added 'What's New' button in Settings → About (opens in browser)",
      'Dedicated intro & changelog page moved to /jsave-intro (outside PWA scope)',
      'Release notes now bilingual — English & Chinese',
      'CTA section icon now has float animation',
    ],
    itemsZh: [
      '移除首页 PWA 安装指南和更新日志卡片',
      '在设置 → 关于中新增「更新日志」按钮（在浏览器中打开）',
      '介绍与更新日志页面迁移至 /jsave-intro（PWA 范围外，可在浏览器打开）',
      '更新日志现支持中英双语',
      'CTA 区块图标新增悬浮动画',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-04-22',
    items: [
      'App intro & onboarding slides (shown on first launch)',
      'PWA installation guide on home page',
      'Release notes on home page',
    ],
    itemsZh: [
      '新增应用引导幻灯片（首次启动时显示）',
      '首页新增 PWA 安装指南',
      '首页新增更新日志',
    ],
  },
  {
    version: '2.0.2',
    date: '2026-04-22',
    items: [
      'Animated page transitions between tabs',
      'FAB button spring animation on click',
      'Transaction modal slide-up animation',
      'Pie chart "tap a slice" hint now language-aware',
    ],
    itemsZh: [
      '标签页切换时新增平滑过渡动画',
      '+ 按钮点击时新增弹簧动画',
      '交易表单以滑入动画展示',
      '饼图「点击切片」提示文字现已支持多语言',
    ],
  },
  {
    version: '2.0.1',
    date: '2026-04-22',
    items: [
      'Clear Cache button checks if already up to date',
      'Cache size shown in Settings → About',
      'Clear cache countdown reduced from 5s to 3s',
    ],
    itemsZh: [
      '清除缓存按钮现先检查是否已是最新版本',
      '设置 → 关于中显示缓存大小',
      '清除缓存倒计时从 5 秒缩短至 3 秒',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-04-22',
    items: [
      'Chinese app name renamed to J省',
      'PWA home screen icon label updated to J省',
      'Server-side push notifications via Cloud Functions',
      'Push sent at 1PM & 8PM MYT if no transactions recorded today',
    ],
    itemsZh: [
      '中文应用名称更新为 J省',
      'PWA 主屏幕图标名称更新为 J省',
      '通过 Cloud Functions 实现服务端推送通知',
      '若当日未记账，将在下午1点和晚8点（马来西亚时间）推送提醒',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-22',
    items: [
      'Email sign-up — create a new account from the login screen',
      'Sign-in / sign-up toggle on the login page',
    ],
    itemsZh: [
      '新增邮箱注册功能，可在登录页直接创建账号',
      '登录页新增注册/登录切换按钮',
    ],
  },
  {
    version: '1.1.2',
    date: '2026-04-22',
    items: [
      'Clear cache countdown shows percentage instead of seconds',
      'Cancel button added to clear cache countdown',
    ],
    itemsZh: [
      '清除缓存倒计时改为显示百分比',
      '倒计时期间新增取消按钮',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-04-22',
    items: [
      'Fixed pie chart slice labels overlapping the amount text',
    ],
    itemsZh: [
      '修复饼图切片标签与金额文字重叠的问题',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-22',
    items: [
      'Custom animated SVG pie chart (replaced library)',
      'Account name + percent labels beside each pie slice',
      'Click slice to expand with spring animation',
      'Amount shown on top of chart when slice selected',
      'Clear cache with animated progress countdown',
      'Daily transaction reminders at 1PM & 8PM',
      'Activity streak dot strip in Settings',
      'Collapsible accordion sections in Settings',
      'Version number shown in Settings → About',
    ],
    itemsZh: [
      '自定义 SVG 动画饼图（替换第三方库）',
      '饼图每个切片旁显示账户名与占比',
      '点击切片时以弹簧动画展开',
      '选中切片后在图表上方显示金额',
      '清除缓存支持动画进度倒计时',
      '每日下午1点和晚8点交易提醒',
      '设置页新增活跃天数打点记录条',
      '设置页各区块改为可折叠手风琴样式',
      '设置 → 关于中显示版本号',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-01',
    items: [
      'Initial release',
      'Dashboard: total balance, income/expense, savings rate',
      'Calendar: monthly transaction heat-map view',
      'Items: cost-per-day tracker for owned goods',
      'Reports: balance chart, spending trends, category breakdown',
      'Settings: accounts, budgets, auto salary, currency',
      'Offline-first: IndexedDB cache + Firestore background sync',
      'PWA: installable on Android, iOS and desktop',
    ],
    itemsZh: [
      '首次发布',
      '首页：总余额、收支统计、储蓄率',
      '日历：每月交易热力图视图',
      '物品：已购物品日均成本追踪',
      '报告：余额图表、支出趋势、类别分析',
      '设置：账户管理、预算、自动薪资、货币',
      '离线优先：IndexedDB 缓存 + Firestore 后台同步',
      'PWA：可安装到 Android、iOS 及桌面端',
    ],
  },
]
