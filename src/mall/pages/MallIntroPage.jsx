import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMallLang } from '../hooks/useMallLang'
import { useMall } from '../contexts/MallContext'

/* ── Translations ── */
const T = {
  en: {
    welcome:     'Welcome to',
    title:       'JeeProd Mall',
    sub:         'Quality products, curated with care — from the jungle to your doorstep.',
    enter:       'Explore the Mall',
    scroll:      'scroll to discover',
    f1t: 'Curated Picks',      f1d: 'Every product is hand-selected for quality and value.',
    f2t: 'Easy Ordering',      f2d: 'Place orders instantly via WhatsApp or email.',
    f3t: 'Track Your Orders',  f3d: 'Real-time status updates from checkout to delivery.',
    f4t: 'Made with Heart',    f4d: 'A store built by a creator, for the community.',
    storyBadge:  '🌿 Our Story',
    storyTitle:  'A Store Born\nUnder the Canopy',
    storyText:   'JeeProd Mall started as a simple idea: bring together quality products with a shopping experience that feels personal. No corporate noise — just honest goods, fair prices, and a team that actually cares.\n\nEvery item you find here has been picked with intention. We believe the best things in life are found off the beaten path.',
    ctaTitle:    'Ready to Explore?',
    ctaSub:      'Browse our collection and find something you\'ll love.',
    ctaBtn:      '🛍️ Shop Now',
    footerNote:  'JeeProd Mall · Powered by jeeprod.com',
    langBtn:     '中文',
    ssTitle:     'See the Mall',
    ssSub:       'A preview of your shopping experience.',
    ssPlaceholder: 'Screenshots will appear here — add your image paths to SCREENSHOTS array',
    howTitle:    'How to Shop',
    howSub:      'Simple steps to find and order your perfect item.',
    h1t: 'Browse Products',    h1d: 'Explore our handpicked collection at your own pace.',
    h2t: 'Pick Your Items',    h2d: 'Choose products, variants, and quantities.',
    h3t: 'Place Your Order',   h3d: 'Confirm your cart and fill in your details.',
    h4t: 'We\'ll Contact You', h4d: 'We reach out via WhatsApp or email to confirm & arrange delivery.',
  },
  zh: {
    welcome:     '欢迎来到',
    title:       'JeeProd 商城',
    sub:         '用心精选的优质好物，从丛林到您的手中，触手可及。',
    enter:       '进入商城',
    scroll:      '向下探索',
    f1t: '精心挑选',    f1d: '每一件商品都经过严格筛选，品质与价值并重。',
    f2t: '轻松下单',    f2d: '通过 WhatsApp 或邮件，几秒钟完成下单。',
    f3t: '追踪订单',    f3d: '从下单到配送，实时掌握每笔订单状态。',
    f4t: '用心经营',    f4d: '由创作者打造，为社群服务的诚意商城。',
    storyBadge:  '🌿 我们的故事',
    storyTitle:  '在林荫下诞生\n的商城',
    storyText:   'JeeProd 商城源于一个简单的想法：把优质好物与真诚的购物体验结合在一起。没有企业的冷漠，只有用心挑选的商品、实在的价格，以及一个真正在乎你的团队。\n\n这里的每一件商品都经过深思熟虑的挑选。我们相信，最好的东西往往藏在那条少有人走的路上。',
    ctaTitle:    '准备好探索了吗？',
    ctaSub:      '浏览我们的精选商品，找到您心仪之物。',
    ctaBtn:      '🛍️ 立即购物',
    footerNote:  'JeeProd 商城 · 由 jeeprod.com 提供',
    langBtn:     'EN',
    ssTitle:     '商城预览',
    ssSub:       '提前感受您的购物体验。',
    ssPlaceholder: '截图将显示于此 — 请将图片路径添加至 SCREENSHOTS 数组',
    howTitle:    '如何购物',
    howSub:      '简单几步，轻松找到并下单您的心仪好物。',
    h1t: '浏览商品',    h1d: '按照自己的节奏，探索我们精心挑选的商品。',
    h2t: '挑选商品',    h2d: '选择商品、规格和数量。',
    h3t: '提交订单',    h3d: '确认购物车并填写您的详细信息。',
    h4t: '我们联系您',  h4d: '我们将通过 WhatsApp 或邮件联系您，确认订单及安排配送。',
  },
}

/* ── Screenshot image paths — add your own URLs/paths here ── */
const SCREENSHOTS = [
  '/mall/screenshot/shop.webp',
  '/mall/screenshot/product.webp',
  '/mall/screenshot/cart.webp',
]

/* ── Deterministic pseudo-random helper ── */
function seed(n) { return ((n * 1664525 + 1013904223) & 0xffffffff) / 0xffffffff }

export default function MallIntroPage() {
  const { lang, toggleLang } = useMallLang()
  const { config } = useMall()
  const navigate = useNavigate()
  const t = T[lang]
  const storeName = lang === 'zh' ? (config.storeNameZh || t.title) : (config.storeName || t.title)

  /* Fireflies */
  const fireflies = Array.from({ length: 18 }, (_, i) => ({
    left:  `${5 + seed(i * 3)     * 90}%`,
    top:   `${10 + seed(i * 7)    * 75}%`,
    dur:   `${3 + seed(i * 11)    * 5}s`,
    del:   `${seed(i * 13)        * 4}s`,
    tx:    `${(seed(i * 17) - 0.5) * 80}px`,
    ty:    `${(seed(i * 19) - 0.5) * 60}px`,
    size:  `${3 + seed(i * 23)    * 3}px`,
  }))

  /* Stars */
  const stars = Array.from({ length: 60 }, (_, i) => ({
    left:  `${seed(i * 5)  * 100}%`,
    top:   `${seed(i * 9)  * 55}%`,
    size:  `${1 + seed(i * 31) * 2.5}px`,
    dur:   `${2 + seed(i * 37) * 4}s`,
    del:   `${seed(i * 41) * 3}s`,
    min:   0.1 + seed(i * 43) * 0.3,
    max:   0.5 + seed(i * 47) * 0.5,
  }))

  const features = [
    { icon: '🛍️', title: t.f1t, desc: t.f1d },
    { icon: '💬', title: t.f2t, desc: t.f2d },
    { icon: '📦', title: t.f3t, desc: t.f3d },
    { icon: '🌿', title: t.f4t, desc: t.f4d },
  ]

  const metaTitle = 'JeeProd Mall — Quality Products, Curated with Care'
  const metaDesc = 'JeeProd Mall is a curated e-commerce PWA based in Malaysia — handpicked quality products, WhatsApp ordering, and real-time order tracking. Shop online today.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: storeName || 'JeeProd Mall',
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web, Android, iOS',
    url: 'https://www.jeeprod.com/mall',
    description: 'A curated e-commerce PWA — handpicked products, WhatsApp ordering, and real-time order tracking.',
    author: {
      '@type': 'Person',
      name: 'Jun Hong Jee',
      url: 'https://www.jeeprod.com/',
    },
  }

  return (
    <div className="intro-root">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content="https://www.jeeprod.com/mall/intro" />
        <meta property="og:image" content="https://www.jeeprod.com/mall/screenshot/shop.webp" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.jeeprod.com/mall/intro" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ── Sticky Nav ── */}
      <nav className="intro-nav">
        <div className="intro-nav-brand" onClick={() => navigate('/mall')} style={{ cursor:'pointer' }}>
          <img src="/logo.svg" alt="JeeProd" className="intro-nav-logo" />
          <span className="intro-nav-name">{storeName}</span>
        </div>
        <div style={{ flex:1 }} />
        <button className="intro-lang-btn" onClick={toggleLang}>{t.langBtn}</button>
        <button className="intro-nav-enter" onClick={() => navigate('/mall')}>{t.enter} →</button>
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="intro-hero">

        {/* Stars */}
        {stars.map((s, i) => (
          <span key={i} className="intro-star" style={{
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            '--dur': s.dur, '--del': s.del,
            '--min': s.min, '--max': s.max,
          }} />
        ))}

        {/* Fireflies */}
        {fireflies.map((f, i) => (
          <span key={i} className="intro-firefly" style={{
            left: f.left, top: f.top,
            width: f.size, height: f.size,
            '--dur': f.dur, '--del': f.del,
            '--tx': f.tx, '--ty': f.ty,
          }} />
        ))}

        {/* Tent (bottom-left) */}
        <div className="intro-tent-wrap">
          <div className="intro-tent-flagpole">
            <div className="intro-tent-flag" />
          </div>
          <div className="intro-tent-roof" />
          <div className="intro-tent-body">
            <div className="intro-tent-entrance" />
          </div>
          <div className="intro-tent-glow" />
        </div>

        {/* Fishing scene (bottom-right) */}
        <div className="intro-fishing-wrap">
          <svg className="intro-fisher-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
            {/* Log */}
            <rect x="8" y="116" width="72" height="13" rx="6" fill="#2a1508"/>
            {/* Body */}
            <rect x="31" y="83" width="20" height="24" rx="4" fill="#1e3a1e"/>
            {/* Head */}
            <circle cx="41" cy="75" r="9" fill="#1c3820"/>
            {/* Hat brim */}
            <rect x="30" y="73" width="24" height="5" rx="2" fill="#122610"/>
            {/* Hat crown */}
            <rect x="33" y="63" width="16" height="11" rx="3" fill="#122610"/>
            {/* Legs */}
            <rect x="28" y="105" width="25" height="11" rx="5" fill="#142410"/>
            {/* Rod */}
            <line x1="49" y1="91" x2="87" y2="16" stroke="#9a6535" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Animated group: line + bobber + ripple rotate around rod tip */}
            <g className="intro-fisher-bob-group">
              <line x1="87" y1="16" x2="92" y2="107" stroke="rgba(200,230,255,0.35)" strokeWidth="1"/>
              <circle cx="92" cy="109" r="4" fill="#cc1111"/>
              <circle cx="92" cy="114" r="3.5" fill="#e0e0e0"/>
              <ellipse cx="92" cy="117" rx="7" ry="2.5" fill="none" stroke="rgba(150,220,255,0.25)" strokeWidth="1" className="intro-ripple-1"/>
              <ellipse cx="92" cy="117" rx="7" ry="2.5" fill="none" stroke="rgba(150,220,255,0.15)" strokeWidth="0.8" className="intro-ripple-2"/>
            </g>
          </svg>
        </div>

        {/* Tree silhouettes */}
        <div className="intro-trees-left">
          <span className="intro-tree-big">🌲</span>
          <span className="intro-tree-sm">🌳</span>
        </div>
        <div className="intro-trees-right">
          <span className="intro-tree-sm">🌳</span>
          <span className="intro-tree-big">🌲</span>
        </div>

        {/* Ground fog */}
        <div className="intro-fog" />

        {/* Campfire */}
        <div className="intro-fire-scene">
          <div className="intro-fire-glow" />
          <div className="intro-flames">
            <div className="intro-flame intro-flame-3" style={{ '--dur':'0.9s','--del':'0.15s' }} />
            <div className="intro-flame intro-flame-1" style={{ '--dur':'1.1s','--del':'0s'    }} />
            <div className="intro-flame intro-flame-2" style={{ '--dur':'1.3s','--del':'0.3s' }} />
            <div className="intro-flame intro-flame-3" style={{ '--dur':'0.8s','--del':'0.1s' }} />
            <div className="intro-flame intro-flame-2" style={{ '--dur':'1.0s','--del':'0.2s' }} />
          </div>
          <div className="intro-embers">
            {[0,1,2,3,4].map(i => (
              <span key={i} className="intro-ember" style={{
                '--edur': `${1.5 + seed(i*7)*2}s`,
                '--edel': `${seed(i*11)*1.5}s`,
                '--ex':   `${(seed(i*13)-0.5)*60}px`,
                left: `${30 + seed(i*17)*40}%`,
              }} />
            ))}
          </div>
          <div className="intro-logs">
            <div className="intro-log intro-log-l" />
            <div className="intro-log intro-log-r" />
            <div className="intro-log-center" />
          </div>
        </div>

        {/* Hero content */}
        <div className="intro-hero-content">
          <div className="intro-hero-badge">🏕️ {t.welcome}</div>
          <h1 className="intro-hero-title">{storeName}</h1>
          <p className="intro-hero-sub">{t.sub}</p>
          <button className="intro-hero-cta" onClick={() => navigate('/mall')}>
            {t.enter}
          </button>
          <div className="intro-scroll-hint">
            <span className="intro-scroll-arrow">↓</span>
            <span>{t.scroll}</span>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section className="intro-features">
        <div className="intro-leaf-divider">🍃 🌿 🍃 🌿 🍃</div>
        <div className="intro-features-grid">
          {features.map((f, i) => (
            <div key={i} className="intro-feature-card">
              <div className="intro-feature-icon">{f.icon}</div>
              <div className="intro-feature-title">{f.title}</div>
              <div className="intro-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SCREENSHOTS
      ══════════════════════════════════════════════════ */}
      <section className="intro-screenshots">
        <div className="intro-section-badge">📸 {t.ssTitle}</div>
        <p className="intro-ss-sub">{t.ssSub}</p>
        {SCREENSHOTS.length > 0 ? (
          <div className="intro-ss-track">
            {SCREENSHOTS.map((src, i) => (
              <div key={i} className="intro-ss-item">
                <img src={src} alt={`Mall screenshot ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="intro-ss-placeholder">
            <span>🏕️</span>
            <p>{t.ssPlaceholder}</p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          HOW TO SHOP
      ══════════════════════════════════════════════════ */}
      <section className="intro-howto">
        <div className="intro-section-badge">🗺️ {t.howTitle}</div>
        <p className="intro-howto-sub">{t.howSub}</p>
        <div className="intro-howto-steps">
          {[
            { n: '01', icon: '🔍', title: t.h1t, desc: t.h1d },
            { n: '02', icon: '🛒', title: t.h2t, desc: t.h2d },
            { n: '03', icon: '📋', title: t.h3t, desc: t.h3d },
            { n: '04', icon: '💬', title: t.h4t, desc: t.h4d },
          ].map((step, i, arr) => (
            <div key={i} className="intro-howto-step">
              <div className="intro-howto-num">{step.n}</div>
              <div className="intro-howto-icon-wrap">{step.icon}</div>
              <div className="intro-howto-step-title">{step.title}</div>
              <div className="intro-howto-step-desc">{step.desc}</div>
              {i < arr.length - 1 && <div className="intro-howto-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STORY
      ══════════════════════════════════════════════════ */}
      <section className="intro-story">
        <div className="intro-story-deco">🌲</div>
        <div className="intro-story-inner">
          <div className="intro-section-badge">{t.storyBadge}</div>
          <h2 className="intro-story-title">
            {t.storyTitle.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h2>
          <div className="intro-story-text">
            {t.storyText.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
        <div className="intro-story-deco intro-story-deco-r">🌳</div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="intro-cta-section">
        {/* Campfire embers rising */}
        {[0,1,2,3,4,5].map(i => (
          <span key={i} className="intro-cta-ember" style={{
            '--edur': `${2 + seed(i*29)*3}s`,
            '--edel': `${seed(i*31)*2}s`,
            '--ex':   `${(seed(i*37)-0.5)*50}px`,
            left: `${20 + seed(i*41)*60}%`,
          }} />
        ))}
        <div className="intro-cta-inner">
          <div className="intro-cta-fire">🔥</div>
          <h2 className="intro-cta-title">{t.ctaTitle}</h2>
          <p className="intro-cta-sub">{t.ctaSub}</p>
          <button className="intro-cta-btn" onClick={() => navigate('/mall')}>
            {t.ctaBtn}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="intro-footer">
        <img src="/logo.svg" alt="JeeProd" style={{ width:32,height:32,borderRadius:8,marginBottom:10 }} />
        <div className="intro-footer-text">{t.footerNote}</div>
      </footer>

    </div>
  )
}
