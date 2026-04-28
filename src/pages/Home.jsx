import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { ENTRIES_UPDATED_EVENT, getVisibleEntriesByType } from '../lib/projects'
import Navbar from '../components/Navbar'
import EntryCard from '../components/EntryCard'
import ContactForm from '../components/ContactForm'

const SKILLS = [
  {
    categoryEn: 'Frontend', categoryZh: '前端',
    items: [
      { name: 'React',        icon: 'react'    },
      { name: 'JavaScript',   icon: 'js'       },
      { name: 'jQuery',       icon: 'jquery'   },
      { name: 'HTML',         icon: 'html'     },
      { name: 'CSS',          icon: 'css'      },
      { name: 'Tailwind CSS', icon: 'tailwind' },
      { name: 'PHP',          icon: 'php'      },
    ],
  },
  {
    categoryEn: 'Backend', categoryZh: '后端',
    items: [
      { name: 'Firebase', icon: 'firebase' },
      { name: 'Node.js',  icon: 'nodejs'   },
      { name: 'MySQL',    icon: 'mysql'    },
      { name: 'C#',       icon: 'cs'       },
      { name: 'ASP',      icon: null       },
    ],
  },
  {
    categoryEn: 'Tools', categoryZh: '工具',
    items: [
      { name: 'Vite',   icon: 'vite'   },
      { name: 'Git',    icon: 'git'    },
      { name: 'Figma',  icon: 'figma'  },
    ],
  },
]

const SOCIAL = [
  {
    label: 'GitHub',
    href: 'https://github.com/junhong-623',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/junhong623/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/60126947823',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
]

export default function Home() {
  const { t, lang } = useLang()
  const { admin } = useAuth()
  const [allPortfolio, setAllPortfolio] = useState([])
  const [allBookmarks, setAllBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEntries = () => {
      setLoading(true)
      Promise.all([
        getVisibleEntriesByType('portfolio'),
        getVisibleEntriesByType('bookmark'),
      ])
        .then(([portfolio, bookmarks]) => {
          setAllPortfolio(portfolio)
          setAllBookmarks(bookmarks)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    loadEntries()
    window.addEventListener(ENTRIES_UPDATED_EVENT, loadEntries)
    return () => window.removeEventListener(ENTRIES_UPDATED_EVENT, loadEntries)
  }, [])

  const portfolioEntries = allPortfolio.filter(e => !e.adminOnly || admin)
  const bookmarkEntries  = allBookmarks.filter(e => !e.adminOnly || admin)


  const titleStr = lang === 'zh'
    ? 'Jee Production — 马来西亚软件工程师 Jun Hong Jee'
    : 'Jee Production — Jun Hong Jee | Software Engineer Malaysia'
  const descStr = lang === 'zh'
    ? '马来西亚软件工程师 Jun Hong Jee 的个人作品集，包括项目、工具与精选书签。'
    : 'Portfolio of Jun Hong Jee — Software Engineer based in Malaysia. Projects, tools, and curated bookmarks.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://www.jeeprod.com/#person',
        name: 'Jun Hong Jee',
        jobTitle: 'Software Engineer',
        url: 'https://www.jeeprod.com/',
        email: 'jeejunhong@gmail.com',
        sameAs: [
          'https://github.com/junhong-623',
          'https://www.linkedin.com/in/junhong623/',
          'https://www.instagram.com/junhong623/',
        ],
        address: { '@type': 'PostalAddress', addressCountry: 'MY' },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.jeeprod.com/#website',
        url: 'https://www.jeeprod.com/',
        name: 'Jee Production',
        description: 'Portfolio of Jun Hong Jee — Software Engineer based in Malaysia.',
        author: { '@id': 'https://www.jeeprod.com/#person' },
      },
    ],
  }

  return (
    <div className="min-h-screen aurora-bg">
      <Helmet>
        <title>{titleStr}</title>
        <meta name="description" content={descStr} />
        <meta property="og:title" content={titleStr} />
        <meta property="og:description" content={descStr} />
        <meta property="og:url" content="https://www.jeeprod.com/" />
        <meta property="og:image" content="https://www.jeeprod.com/og-image.webp" />
        <link rel="canonical" href="https://www.jeeprod.com/" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center px-6 pt-24 pb-16 md:px-10">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
            {/* Logo */}
            <div className="animate-fade-up flex flex-col items-start gap-6">
              <div className="relative">
                <div className="absolute inset-0 -m-10 rounded-full bg-accent/5 blur-3xl dark:bg-accent/7" />
                <img
                  src="/logo.svg"
                  alt="Jee Production"
                  className="relative w-44 drop-shadow-[0_24px_48px_rgba(13,13,13,0.15)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] md:w-52 lg:w-60"
                />
              </div>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-paper/80 px-4 py-1.5 shadow-sm backdrop-blur dark:border-paper/10 dark:bg-ink/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-ink/45 dark:text-paper/45">jeeprod.com</span>
              </div>
            </div>

            {/* Text */}
            <div className="animate-fade-up stagger-2 space-y-6">
              <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.9] tracking-tight">
                Jee<br /><span className="text-accent">Production</span>
              </h1>
              <div className="space-y-3 border-l-2 border-ink/8 pl-5 dark:border-paper/8">
                <p className="text-sm leading-7 text-ink/60 dark:text-paper/60">{t('tagline')}</p>
                <p className="text-sm leading-7 text-ink/40 dark:text-paper/40">{t('portfolioIntro')}</p>
              </div>
              {!loading && (
                <div className="flex items-center gap-5 pt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/25 dark:text-paper/25">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink/50 dark:text-paper/50">{portfolioEntries.length}</span>
                    <span>{t('portfolio')}</span>
                  </div>
                  <span className="h-3 w-px bg-ink/12 dark:bg-paper/12" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink/50 dark:text-paper/50">{bookmarkEntries.length}</span>
                    <span>{t('bookmarks')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="animate-fade-up stagger-3 mt-20 hidden items-center gap-3 md:flex">
            <div className="h-px w-8 bg-ink/12 dark:bg-paper/12" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/20 dark:text-paper/20">scroll</span>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader index="00" title={t('about')} />
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-16">
            {/* Bio */}
            <div className="space-y-5 md:col-span-3">
              <p className="text-sm leading-8 text-ink/68 dark:text-paper/68">{t('aboutBio1')}</p>
              <p className="text-sm leading-8 text-ink/52 dark:text-paper/52">{t('aboutBio2')}</p>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-2">
                {SOCIAL.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-paper/70 text-ink/45 transition-all hover:border-accent/30 hover:bg-accent/6 hover:text-accent dark:border-paper/10 dark:bg-ink/50 dark:text-paper/40 dark:hover:border-accent/30 dark:hover:bg-accent/8 dark:hover:text-accent"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="md:col-span-2">
              <div className="rounded-[1.5rem] border border-ink/8 bg-paper/60 p-6 backdrop-blur dark:border-paper/8 dark:bg-ink/50">
                <InfoRow label={lang === 'zh' ? '身份' : 'Role'}       value={t('aboutRole')}     accent />
                <InfoRow label={lang === 'zh' ? '所在地' : 'Based in'} value={t('aboutLocation')} />
                <InfoRow label={lang === 'zh' ? '联系' : 'Contact'}    value="jeejunhong@gmail.com" last />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills ───────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader index="01" title={t('skills')} />
          <div className="mt-10 space-y-8">
            {SKILLS.map(({ categoryEn, categoryZh, items }) => (
              <div key={categoryEn} className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr] md:items-start md:gap-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/35 dark:text-paper/35 md:pt-3">
                  {lang === 'zh' ? categoryZh : categoryEn}
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {items.map(({ name, icon }) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-3.5 py-2 font-mono text-xs text-ink/60 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.06] hover:border-accent/30 hover:bg-accent/5 hover:text-accent hover:shadow-[0_4px_14px_rgba(232,68,10,0.14)] dark:border-paper/10 dark:bg-ink/50 dark:text-paper/55 dark:hover:border-accent/30 dark:hover:bg-accent/8 dark:hover:text-accent dark:hover:shadow-[0_4px_14px_rgba(232,68,10,0.18)]"
                    >
                      {icon && (
                        <img
                          src={`https://skillicons.dev/icons?i=${icon}`}
                          alt={name}
                          className="h-4 w-4 object-contain"
                          loading="lazy"
                        />
                      )}
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured App: MateTrip ───────────────────────────────────────── */}
      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <a
            href="/matetrip/intro"
            className="group relative block overflow-hidden rounded-[2rem] border border-ink/8 bg-paper/60 backdrop-blur transition-all duration-300 hover:border-[#c8643c]/30 hover:shadow-[0_8px_48px_rgba(200,100,60,0.10)] dark:border-paper/8 dark:bg-ink/50"
          >
            {/* Warm gradient wash */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#c8643c]/5 via-transparent to-[#e8a060]/4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex flex-col items-center gap-8 p-8 md:flex-row md:gap-12 md:p-10">
              {/* App icon + label */}
              <div className="flex flex-col items-center gap-3 md:items-start">
                <img
                  src="/matetrip/icons/icon-192.png"
                  alt="MateTrip"
                  className="h-16 w-16 rounded-[18px] shadow-[0_8px_28px_rgba(200,100,60,0.22)] transition-transform duration-300 group-hover:-translate-y-1"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8643c]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8643c]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c8643c]" />
                  Live app
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-paper md:text-3xl">
                    MateTrip <span style={{ color: "#c8643c" }}>伴旅</span>
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink/35 dark:text-paper/35">
                    {lang === 'zh' ? '算清一路琐碎，存下全程风景。' : 'Travel Together, Split with Ease.'}
                  </p>
                </div>
                <p className="text-sm leading-7 text-ink/55 dark:text-paper/55">
                  {lang === 'zh'
                    ? '一款专为旅行设计的 PWA 应用 — 分账、相册、行程规划、旅伴留言，全在一个应用内搞定。'
                    : 'An all-in-one travel companion PWA — split bills, share photos, plan itineraries, and stay connected with your crew.'}
                </p>
                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
                  {['🧾 Bill Split', '📷 Gallery', '📅 Itinerary', '💬 Chat', '📊 Report'].map(tag => (
                    <span key={tag} className="rounded-full border border-ink/8 bg-paper/70 px-3 py-1 font-mono text-[10px] text-ink/45 dark:border-paper/8 dark:bg-ink/50 dark:text-paper/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 font-mono text-xs text-ink/30 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#c8643c] dark:text-paper/30">
                <span className="hidden md:block">{lang === 'zh' ? '查看详情' : 'Learn more'}</span>
                <span className="text-base">→</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── Featured App: JeeProd Mall ──────────────────────────────────── */}
      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <a
            href="/mall/intro"
            className="group relative block overflow-hidden rounded-[2rem] border border-ink/8 bg-paper/60 backdrop-blur transition-all duration-300 hover:border-[#2a7a2a]/30 hover:shadow-[0_8px_48px_rgba(30,100,30,0.10)] dark:border-paper/8 dark:bg-ink/50"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a4a1a]/5 via-transparent to-[#e8440a]/4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex flex-col items-center gap-8 p-8 md:flex-row md:gap-12 md:p-10">
              {/* Icon + badge */}
              <div className="flex flex-col items-center gap-3 md:items-start">
                <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#0d1f09] text-3xl shadow-[0_8px_28px_rgba(30,80,30,0.28)] transition-transform duration-300 group-hover:-translate-y-1">
                  🛍️
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a4a1a]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#3a9a3a]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3a9a3a]" />
                  Live app
                </span>
              </div>
              {/* Info */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-paper md:text-3xl">
                    JeeProd <span style={{ color: '#3a9a3a' }}>Mall</span>
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink/35 dark:text-paper/35">
                    {lang === 'zh' ? '用心精选，从丛林到您手中。' : 'Quality products, curated with care.'}
                  </p>
                </div>
                <p className="text-sm leading-7 text-ink/55 dark:text-paper/55">
                  {lang === 'zh'
                    ? '一款精品电商 PWA — 精心挑选的好物、WhatsApp 下单、实时追踪订单，全程贴心服务。'
                    : 'A curated e-commerce PWA — handpicked products, WhatsApp ordering, real-time order tracking, and personal service.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
                  {['🛍️ Curated Picks', '💬 WhatsApp Order', '📦 Track Orders', '🌿 Made with Heart'].map(tag => (
                    <span key={tag} className="rounded-full border border-ink/8 bg-paper/70 px-3 py-1 font-mono text-[10px] text-ink/45 dark:border-paper/8 dark:bg-ink/50 dark:text-paper/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {/* Arrow */}
              <div className="flex items-center gap-2 font-mono text-xs text-ink/30 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#3a9a3a] dark:text-paper/30">
                <span className="hidden md:block">{lang === 'zh' ? '查看详情' : 'Learn more'}</span>
                <span className="text-base">→</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── Featured App: JSave ─────────────────────────────────────────── */}
      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <a
            href="/jsave-intro"
            className="group relative block overflow-hidden rounded-[2rem] border border-ink/8 bg-paper/60 backdrop-blur transition-all duration-300 hover:border-[#10b981]/30 hover:shadow-[0_8px_48px_rgba(16,185,129,0.10)] dark:border-paper/8 dark:bg-ink/50"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#10b981]/5 via-transparent to-[#059669]/4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex flex-col items-center gap-8 p-8 md:flex-row md:gap-12 md:p-10">
              {/* Icon + badge */}
              <div className="flex flex-col items-center gap-3 md:items-start">
                <img
                  src="/jsave/icons/icon-192.png"
                  alt="JSave"
                  className="h-16 w-16 rounded-[18px] shadow-[0_8px_28px_rgba(16,185,129,0.22)] transition-transform duration-300 group-hover:-translate-y-1"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#10b981]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
                  Live app
                </span>
              </div>
              {/* Info */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-paper md:text-3xl">
                    JSave <span style={{ color: '#10b981' }}>J省</span>
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink/35 dark:text-paper/35">
                    {lang === 'zh' ? 'J样省钱，J样享受！' : 'J-Save, J-Joy — personal finance PWA'}
                  </p>
                </div>
                <p className="text-sm leading-7 text-ink/55 dark:text-paper/55">
                  {lang === 'zh'
                    ? '一款离线优先的个人理财 PWA — 记录收支、追踪预算、日历热力图、物品日均成本，随时随地掌控财务。'
                    : 'An offline-first personal finance PWA — track income & expenses, manage budgets, view spending heatmaps, and monitor cost-per-day for owned items.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
                  {['💰 Budget Tracking', '📅 Calendar Heatmap', '📊 Reports', '🏷️ Cost Per Day', '📴 Offline-first'].map(tag => (
                    <span key={tag} className="rounded-full border border-ink/8 bg-paper/70 px-3 py-1 font-mono text-[10px] text-ink/45 dark:border-paper/8 dark:bg-ink/50 dark:text-paper/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {/* Arrow */}
              <div className="flex items-center gap-2 font-mono text-xs text-ink/30 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#10b981] dark:text-paper/30">
                <span className="hidden md:block">{lang === 'zh' ? '查看详情' : 'Learn more'}</span>
                <span className="text-base">→</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── Portfolio + Bookmarks ─────────────────────────────────────────── */}
      <main className="px-6 pb-32 md:px-10">
        <div className="mx-auto max-w-6xl space-y-24">
          <EntrySection
            index="02"
            title={t('portfolio')}
            subtitle={t('portfolioIntro')}
            entries={portfolioEntries}
            loading={loading}
            emptyLabel={t('portfolioEmpty')}
          />
          <EntrySection
            index="03"
            title={t('bookmarks')}
            subtitle={t('bookmarkIntro')}
            entries={bookmarkEntries}
            loading={loading}
            emptyLabel={t('bookmarkEmpty')}
          />
        </div>
      </main>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-32 md:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader index="04" title={t('contactTitle')} />
          <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-5">
              <p className="text-sm leading-8 text-ink/60 dark:text-paper/60">{t('contactSubtitle')}</p>
              <a
                href="mailto:jeejunhong@gmail.com"
                className="inline-flex items-center gap-2 font-mono text-xs text-ink/38 transition-colors hover:text-accent dark:text-paper/38 dark:hover:text-accent"
              >
                <span>→</span>
                <span>jeejunhong@gmail.com</span>
              </a>
            </div>
            {/* <ContactForm /> */}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/8 bg-paper/40 px-6 py-10 backdrop-blur dark:border-paper/8 dark:bg-ink/40 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Jee Production" className="h-7 w-7 opacity-60" />
              <span className="font-mono text-xs text-ink/38 dark:text-paper/38">Jee Production</span>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2.5">
              {SOCIAL.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/8 text-ink/35 transition-all hover:border-accent/25 hover:text-accent dark:border-paper/8 dark:text-paper/35 dark:hover:border-accent/25 dark:hover:text-accent"
                >
                  {icon}
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/25 dark:text-paper/25">
              © {new Date().getFullYear()} Jun Hong Jee
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Shared components ─────────────────────────────────────────────────── */

function SectionHeader({ index, title }) {
  return (
    <div className="flex items-end gap-5 border-b border-ink/8 pb-5 dark:border-paper/8">
      <span className="mb-0.5 font-mono text-[10px] tracking-[0.3em] text-ink/18 dark:text-paper/18">{index}</span>
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
    </div>
  )
}

function InfoRow({ label, value, accent, last }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${last ? '' : 'border-b border-ink/6 dark:border-paper/6'}`}>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/28 dark:text-paper/28">{label}</span>
      <span className={`text-right text-xs leading-5 ${accent ? 'font-medium text-accent' : 'text-ink/58 dark:text-paper/58'}`}>
        {value}
      </span>
    </div>
  )
}

function EntrySection({ index, title, subtitle, entries, loading, emptyLabel }) {
  return (
    <section className="space-y-8">
      <SectionHeader index={index} title={title} />
      <p className="text-sm leading-6 text-ink/38 dark:text-paper/38 md:hidden">{subtitle}</p>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-52 animate-pulse rounded-[2rem] border border-paper-muted/80 bg-paper/70 dark:border-ink-muted dark:bg-ink/60" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-ink/10 bg-paper/50 px-8 py-16 text-center dark:border-paper/10 dark:bg-ink/40">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/28 dark:text-paper/28">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry, i) => (
            <EntryCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
