import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./MatetripIntro.css";

const FEATURES = [
  {
    icon: "🧾",
    title: "Smart Receipt Splitting",
    titleZh: "智能账单分摊",
    desc: "Add receipts, assign items to each person, and let MateTrip calculate exactly who owes what — down to every cent.",
    descZh: "添加账单，按人分配每道菜，自动精确计算每位旅伴的应付金额。",
  },
  {
    icon: "📷",
    title: "Trip Gallery",
    titleZh: "旅途相册",
    desc: "Upload and organise all your trip photos and videos in one shared album. Tag locations and browse by place.",
    descZh: "上传并整理旅程的所有照片与视频，按地区标签轻松浏览。",
  },
  {
    icon: "📅",
    title: "Itinerary Planner",
    titleZh: "行程规划",
    desc: "Plan your day-by-day schedule, set reminders, and add map links — everything in one place.",
    descZh: "按天规划行程、设置提醒、添加地图链接，一站式管理旅途安排。",
  },
  {
    icon: "💰",
    title: "Settlement Summary",
    titleZh: "结算总览",
    desc: "See at a glance who paid, who owes whom, and mark debts as settled with one tap.",
    descZh: "一眼看清谁垫付了多少、谁欠谁，一键记录结清状态。",
  },
  {
    icon: "💬",
    title: "Group Messaging",
    titleZh: "旅伴留言",
    desc: "Chat with your travel companions right inside the app — no switching to another messaging app.",
    descZh: "无需切换应用，直接在 MateTrip 内与旅伴实时留言。",
  },
  {
    icon: "📊",
    title: "Travel Report",
    titleZh: "旅途报告",
    badge: "⬇ Export",
    badgeZh: "⬇ 可导出",
    desc: "Generate a beautiful trip summary — spending by person, by region, and a shareable report card. Export as an image or share directly to your friends.",
    descZh: "生成精美的旅途总结报告 — 按人统计、按地区分析，一键导出为图片或直接分享给旅伴。",
  },
];

const PLANS = [
  {
    level: "Free",
    levelZh: "免费版",
    color: "#4a90d9",
    price: "RM 0",
    features: ["2 trips", "20 receipts / trip", "5 photos / trip", "5 schedule items"],
    featuresZh: ["2 个行程", "每趟 20 条账单", "每趟 5 张图片", "5 条日程"],
  },
  {
    level: "VIP",
    levelZh: "VIP",
    color: "#e8a020",
    price: "RM 15",
    perMonth: true,
    badge: "Popular",
    badgeZh: "热门",
    features: ["10 trips", "Unlimited receipts", "50 photos / trip", "Travel Report"],
    featuresZh: ["10 个行程", "无限账单", "每趟 50 张图片", "解锁旅途报告"],
  },
  {
    level: "VVIP",
    levelZh: "VVIP",
    color: "#c040e8",
    price: "RM 25",
    perMonth: true,
    features: ["50 trips", "Unlimited receipts", "150 photos / trip", "Travel Report + Chat"],
    featuresZh: ["50 个行程", "无限账单", "每趟 150 张图片", "旅途报告 + 聊天"],
  },
];

// Bump this number whenever you replace a screenshot image file
const SCREENSHOT_V = 3;

const SCREENSHOTS = [
  { file: "screen-trips.webp",          label: "My Trips",              labelZh: "我的旅程" },
  { file: "screen-receipts.webp",       label: "Receipts",              labelZh: "账单记录" },
  { file: "screen-summary.webp",        label: "Settlement",            labelZh: "结算总览" },
  { file: "screen-gallery.webp",        label: "Gallery",               labelZh: "旅途相册" },
  { file: "screen-plan.webp",           label: "Itinerary",             labelZh: "行程计划" },
  { file: "screen-chat.webp",           label: "Group Chat",            labelZh: "旅伴留言" },
  { file: "screen-report-person.webp",  label: "Report · By Person",    labelZh: "报告 · 个人消费" },
  { file: "screen-report-region.webp",  label: "Report · By Region",    labelZh: "报告 · 地区消费" },
  { file: "screen-report-export.webp",  label: "Report · Export",       labelZh: "报告 · 导出分享" },
];

export default function MatetripIntro() {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const zh = lang === "zh";

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const metaTitle = zh
    ? 'MateTrip 伴旅 — 算清一路琐碎，存下全程风景'
    : 'MateTrip 伴旅 — Travel Together, Split with Ease'
  const metaDesc = zh
    ? '专为旅行设计的 PWA — 智能分账、旅途相册、行程规划、旅伴聊天，全在一个应用内搞定。'
    : 'MateTrip (伴旅) — An all-in-one travel companion PWA. Split bills, share photos, plan itineraries, and stay connected with your crew.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MateTrip',
    alternateName: 'MateTrip 伴旅',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web, Android, iOS',
    url: 'https://www.jeeprod.com/matetrip',
    description: 'An all-in-one travel companion PWA — split bills, share photos, plan itineraries, and stay connected with your crew.',
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'MYR', name: 'Free' },
      { '@type': 'Offer', price: '15', priceCurrency: 'MYR', name: 'VIP' },
      { '@type': 'Offer', price: '25', priceCurrency: 'MYR', name: 'VVIP' },
    ],
    author: {
      '@type': 'Person',
      name: 'Jun Hong Jee',
      url: 'https://www.jeeprod.com/',
    },
    screenshot: 'https://www.jeeprod.com/matetrip/icons/icon-512.png',
  }

  return (
    <div className="intro-root">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content="https://www.jeeprod.com/matetrip/intro" />
        <meta property="og:image" content="https://www.jeeprod.com/matetrip/icons/icon-512.png" />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="MateTrip, 伴旅, travel app, split bills, expense tracker, trip planner, 旅行分账, 旅途相册, Malaysia PWA" />
        <link rel="canonical" href="https://www.jeeprod.com/matetrip/intro" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      {/* ── Navbar ── */}
      <header className="intro-nav">
        <div className="intro-nav-inner">
          <a href="/matetrip/intro" className="intro-brand">
            <img src="/matetrip/icons/icon-192.png" alt="MateTrip" className="intro-brand-icon" />
            <span className="intro-brand-name">MateTrip</span>
            <span className="intro-brand-zh">伴旅</span>
          </a>
          <nav className="intro-nav-links">
            <a href="#features">{zh ? "功能" : "Features"}</a>
            <a href="#screenshots">{zh ? "截图" : "Screenshots"}</a>
            <a href="#pricing">{zh ? "价格" : "Pricing"}</a>
          </nav>
          <div className="intro-nav-actions">
            <button className="intro-lang-btn" onClick={() => setLang(l => l === "zh" ? "en" : "zh")}>
              {zh ? "🇺🇸 EN" : "🇹🇼 中文"}
            </button>
            <Link to="/matetrip" className="intro-cta-btn">
              {zh ? "打开应用" : "Open App"} →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="intro-hero-wrap">
        {/* Floating travel decorations */}
        <span className="intro-hero-deco intro-deco-plane">✈️</span>
        <span className="intro-hero-deco intro-deco-pin1">📍</span>
        <span className="intro-hero-deco intro-deco-pin2">📍</span>
        <span className="intro-hero-deco intro-deco-globe">🌏</span>
        <span className="intro-hero-deco intro-deco-star1">✨</span>

        <section className="intro-hero">
          <div className="intro-hero-content">
            <div className="intro-hero-badge">
              {zh ? "✨ 专为旅行设计" : "✨ Built for travel"}
            </div>
            <h1 className="intro-hero-title">
              {zh
                ? <>
                    {"算清一路琐碎，".split("").map((char, i) => (
                      <span key={i} className="hero-char" style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
                    ))}
                    <br />
                    {"存下全程风景。".split("").map((char, i) => (
                      <span key={i + 7} className="hero-char" style={{ animationDelay: `${(i + 7) * 0.1}s` }}>{char}</span>
                    ))}
                  </>
                : <>
                    {"Travel Together,".split("").map((char, i) => (
                      <span key={`en1-${i}`} className="hero-char" style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
                    ))}
                    <br />
                    {"Split with ".split("").map((char, i) => (
                      <span key={`en2-${i}`} className="hero-char" style={{ animationDelay: `${(i + 17) * 0.1}s` }}>{char}</span>
                    ))}
                    <span className="intro-accent">
                      {"Ease.".split("").map((char, i) => (
                        <span key={`en3-${i}`} className="hero-char" style={{ animationDelay: `${(i + 28) * 0.1}s` }}>{char}</span>
                      ))}
                    </span>
                  </>}
            </h1>
            <p className="intro-hero-sub">
              {zh
                ? "MateTrip 是你的旅途伙伴 — 分账、相册、行程、留言，一个应用全搞定。"
                : "MateTrip is your all-in-one travel companion — split bills, share photos, plan your itinerary, and stay connected with your crew."}
            </p>
            <div className="intro-hero-actions">
              <Link to="/matetrip" className="intro-btn-primary">
                🚀 {zh ? "免费开始使用" : "Get Started Free"}
              </Link>
              <a href="#screenshots" className="intro-btn-ghost">
                {zh ? "查看截图" : "See Screenshots"} ↓
              </a>
            </div>
            <p className="intro-hero-note">
              {zh ? "✓ 无需下载 · 直接浏览器使用 · 可安装到主屏幕" : "✓ No download needed · Works in browser · Installable as PWA"}
            </p>

            {/* Stats */}
            <div className="intro-hero-stats">
              <div className="intro-stat">
                <span className="intro-stat-num">6</span>
                <span className="intro-stat-label">{zh ? "核心功能" : "Core features"}</span>
              </div>
              <div className="intro-stat">
                <span className="intro-stat-num">3</span>
                <span className="intro-stat-label">{zh ? "支持语言" : "Languages"}</span>
              </div>
              <div className="intro-stat">
                <span className="intro-stat-num">PWA</span>
                <span className="intro-stat-label">{zh ? "可安装" : "Installable"}</span>
              </div>
            </div>
          </div>

          <div className="intro-hero-visual">
            <div className="intro-phone-wrap">
              {/* Floating info chips */}
              <div className="intro-phone-chip intro-chip-1">
                🧾 {zh ? "自动分账" : "Auto split"}
              </div>
              <div className="intro-phone-chip intro-chip-2">
                📊 {zh ? "旅途报告" : "Travel report"}
              </div>
              <div className="intro-phone-chip intro-chip-3">
                📷 {zh ? "共享相册" : "Shared gallery"}
              </div>

              <div className="intro-phone-float">
                <div className="intro-phone-frame">
                  <img
                    src={`/matetrip/screen-hero.webp?v=${SCREENSHOT_V}`}
                    alt="MateTrip app preview"
                    className="intro-phone-screen"
                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className="intro-phone-placeholder" style={{ display: "none" }}>
                    <span>📱</span>
                    <span style={{ fontSize: 12, opacity: 0.45 }}>screen-hero.webp</span>
                  </div>
                </div>
              </div>
              <div className="intro-phone-glow" />
            </div>
          </div>
        </section>
      </div>

      {/* ── Features ── */}
      <section className="intro-section" id="features">
        <div className="intro-section-inner">
          <div className="intro-section-label reveal">{zh ? "核心功能" : "Features"}</div>
          <h2 className="intro-section-title reveal reveal-delay-1">
            {zh ? "旅行所需，一应俱全" : "Everything your trip needs"}
          </h2>
          <p className="intro-section-sub reveal reveal-delay-2">
            {zh
              ? "从出发前规划，到旅途中记录，再到回家后结算，MateTrip 全程陪伴。"
              : "From pre-trip planning to post-trip settlements — MateTrip covers every step of your journey."}
          </p>
          <div className="intro-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`intro-feature-card reveal reveal-delay-${Math.min(i + 1, 6)}`}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div className="intro-feature-icon">{f.icon}</div>
                  {f.badge && (
                    <span className="intro-feature-badge">{zh ? f.badgeZh : f.badge}</span>
                  )}
                </div>
                <div className="intro-feature-title">{zh ? f.titleZh : f.title}</div>
                <div className="intro-feature-desc">{zh ? f.descZh : f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshots ── */}
      <section className="intro-section intro-section--alt" id="screenshots">
        <div className="intro-section-inner">
          <div className="intro-section-label reveal">{zh ? "应用截图" : "Screenshots"}</div>
          <h2 className="intro-section-title reveal reveal-delay-1">
            {zh
              ? "简洁设计，流畅体验".split("").map((char, i) => (
                  <span key={i} className="screen-word" style={{ animationDelay: `${i * 0.3}s` }}>{char}</span>
                ))
              : "Clean design, smooth experience".split(" ").map((word, i) => (
                  <span key={i} className="screen-word" style={{ animationDelay: `${i * 0.4}s` }}>
                    {word}{i < 3 ? "\u00A0" : ""}
                  </span>
                ))}
          </h2>
          <div className="intro-screenshots-scroll reveal reveal-delay-2">
            {SCREENSHOTS.map((s, i) => (
              <div key={i} className="intro-screenshot-item">
                <div className="intro-screenshot-frame">
                  <img
                    src={`/matetrip/${s.file}?v=${SCREENSHOT_V}`}
                    alt={s.label}
                    className="intro-screenshot-img"
                    loading="lazy"
                    onError={e => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="intro-screenshot-placeholder" style={{ display: "none" }}>
                    <span style={{ fontSize: 24 }}>📱</span>
                    <span style={{ fontSize: 10, marginTop: 4 }}>{s.file}</span>
                  </div>
                </div>
                <div className="intro-screenshot-label">{zh ? s.labelZh : s.label}</div>
              </div>
            ))}
          </div>
          <p className="intro-screenshots-hint reveal reveal-delay-3">← {zh ? "左右滑动查看更多" : "Swipe to see more"} →</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="intro-section" id="pricing">
        <div className="intro-section-inner">
          <div className="intro-section-label reveal">{zh ? "会员计划" : "Pricing"}</div>
          <h2 className="intro-section-title reveal reveal-delay-1">
            {zh ? "从免费开始，按需升级" : "Start free, upgrade anytime"}
          </h2>
          <p className="intro-section-sub reveal reveal-delay-2">
            {zh
              ? "免费版已足够日常使用。需要更多功能？升级 VIP 或 VVIP 解锁全部权益。"
              : "The free plan is great for casual trips. Need more? Upgrade to VIP or VVIP for the full experience."}
          </p>
          <div className="intro-plans-grid">
            {PLANS.map((plan, i) => (
              <div key={i}
                className={`intro-plan-card ${plan.badge ? "intro-plan-card--featured" : ""} reveal reveal-delay-${i + 1}`}
                style={{ "--plan-color": plan.color }}>
                {plan.badge && (
                  <div className="intro-plan-badge" style={{ background: plan.color }}>
                    {zh ? plan.badgeZh : plan.badge}
                  </div>
                )}
                <div className="intro-plan-level" style={{ color: plan.color }}>
                  {zh ? plan.levelZh : plan.level}
                </div>
                <div className="intro-plan-price">
                  <span className="intro-plan-amount">{plan.price}</span>
                  {plan.perMonth && (
                    <span className="intro-plan-period"> / {zh ? "个月" : "month"}</span>
                  )}
                </div>
                <ul className="intro-plan-features">
                  {(zh ? plan.featuresZh : plan.features).map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
                <a
                  href={plan.level !== "Free"
                    ? `https://wa.me/60126947823?text=Hi%2C+I+want+to+upgrade+to+MateTrip+${plan.level}`
                    : "/matetrip"}
                  className="intro-plan-btn"
                  style={{ background: plan.color }}
                  target={plan.level !== "Free" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {plan.level === "Free"
                    ? (zh ? "免费开始" : "Get Started")
                    : (zh ? `升级 ${plan.levelZh}` : `Upgrade to ${plan.level}`)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="intro-cta-section">
        {/* Floating travel emojis */}
        <span className="intro-cta-deco intro-cta-deco-1">✈️</span>
        <span className="intro-cta-deco intro-cta-deco-2">🗺️</span>
        <span className="intro-cta-deco intro-cta-deco-3">🌴</span>
        <span className="intro-cta-deco intro-cta-deco-4">⛰️</span>
        <div className="intro-cta-inner reveal">
          <img src="/matetrip/icons/icon-192.png" alt="MateTrip" className="intro-cta-icon" />
          <h2 className="intro-cta-title">
            {zh ? "准备好了吗？" : "Ready to travel smarter?"}
          </h2>
          <p className="intro-cta-sub">
            {zh
              ? "免费注册，立即开始你的第一次共同旅行记录。"
              : "Sign up for free and start tracking your first trip together."}
          </p>
          <Link to="/matetrip" className="intro-btn-primary" style={{ fontSize: 16, padding: "15px 40px" }}>
            🚀 {zh ? "立即开始" : "Start for Free"}
          </Link>
          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
            {zh ? "无需信用卡 · 注册即用" : "No credit card required · Ready instantly"}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="intro-footer">
        <div className="intro-footer-inner">
          <div className="intro-footer-brand">
            <img src="/matetrip/icons/icon-192.png" alt="MateTrip" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <span>MateTrip <span style={{ color: "var(--intro-terracotta)" }}>伴旅</span></span>
          </div>
          <div className="intro-footer-links">
            <Link to="/matetrip">{zh ? "打开应用" : "Open App"}</Link>
            <a href="https://wa.me/60126947823" target="_blank" rel="noopener noreferrer">{zh ? "联系我们" : "Contact Us"}</a>
            <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer">jeeprod.com</a>
          </div>
          <p className="intro-footer-copy">© {new Date().getFullYear()} MateTrip · Built by <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Jee Production</a></p>
        </div>
      </footer>
    </div>
  );
}
