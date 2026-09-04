import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CURRENT_RANKING, MILLION_HONORS } from './content'
import { useHAgencySite } from './SiteContext'
import Reveal from './Reveal'

export function Seo({ title, description, image = 'https://agency.jeeprod.com/hagency/og.png' }) {
  const { basePath = '' } = useHAgencySite()
  const location = useLocation()
  const fullTitle = title ? `${title} — ℋ Agency 希望公会` : 'ℋ Agency 希望公会 — 让主播成为值得被记住的名字'
  const routePath = basePath && location.pathname.startsWith(basePath)
    ? (location.pathname.slice(basePath.length) || '/')
    : location.pathname
  const canonical = `https://agency.jeeprod.com${routePath === '/' ? '/' : routePath}`
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image:width" content="1732" />
      <meta property="og:image:height" content="909" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={canonical} />
    </Helmet>
  )
}

export function SectionHeader({ title, sub, dark = false, intro, action }) {
  return (
    <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${dark ? 'text-[#d99eb0]' : 'text-[#b66b81]'}`}>{sub}</p>
        <h2 className={`mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl ${dark ? 'text-[#f2d8df]' : 'text-[#24171c]'}`}>{title}</h2>
      </div>
      {(intro || action) && (
        <div className="max-w-md">
          {intro && <p className={`text-sm leading-7 ${dark ? 'text-white/50' : 'text-gray-500'}`}>{intro}</p>}
          {action}
        </div>
      )}
    </Reveal>
  )
}

export function PageHero({ kicker, title, copy, children }) {
  return (
    <section className="relative overflow-hidden bg-[#120c10] pb-20 pt-36 text-white sm:pb-24 sm:pt-40">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 10% 0%, rgba(226,176,187,0.22), transparent 34%), radial-gradient(circle at 92% 100%, rgba(180,63,107,0.16), transparent 34%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
      <div className="relative mx-auto max-w-7xl px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#e5b6c3]">{kicker}</p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.04] tracking-[-0.025em] sm:text-6xl">{title}</h1>
        {copy && <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">{copy}</p>}
        {children}
      </div>
    </section>
  )
}

export function TextLink({ to, children, dark = false }) {
  return (
    <Link to={to} className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3 ${dark ? 'text-[#efced6]' : 'text-[#9f4d65]'}`}>
      {children}<span aria-hidden="true">↗</span>
    </Link>
  )
}

export function TalentCard({ talent, index = 0 }) {
  const { lang, path } = useHAgencySite()
  const name = lang === 'zh' ? talent.nameZh : (talent.nameEn || talent.nameZh)
  const badge = lang === 'zh' ? (talent.badgeZh || '签约主播') : (talent.badgeEn || talent.badgeZh || 'Signed Talent')
  return (
    <Reveal delay={Math.min(index, 3) * 90} direction="scale" className="h-full">
      <Link to={path(`/talents/${talent.slug || talent.id}`)} className="group relative block h-full overflow-hidden bg-[#20161a]">
      <div className="aspect-[4/5] overflow-hidden">
        <img src={talent.photoUrl || '/hagency/logo.jpg'} alt={name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" loading="lazy" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="font-display text-3xl text-white">{name}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/55">{badge}</p>
        {(talent.platform || talent.handle) && <p className="mt-4 border-t border-white/15 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">{talent.platform}{talent.handle ? ` · @${talent.handle}` : ''}</p>}
      </div>
      <span className="absolute left-5 top-5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/60">{String(index + 1).padStart(2, '0')}</span>
      </Link>
    </Reveal>
  )
}

export function HonorGrid({ compact = false }) {
  const { lang, path } = useHAgencySite()
  return (
    <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${compact ? 'mt-10' : 'mt-12'}`}>
      {MILLION_HONORS.map((talent, index) => (
        <Reveal key={talent.id} delay={index * 90} direction="scale" className={index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}>
          <article className="group">
          <Link to={path(`/talents/${talent.slug}`)} className="relative block aspect-[3/4] overflow-hidden border border-white/10 bg-[#261a20]">
            <img src={talent.image} alt={`${lang === 'zh' ? talent.nameZh : talent.nameEn} · ${lang === 'zh' ? talent.accoladeZh : talent.accoladeEn}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.018]" loading="lazy" />
            <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/75 backdrop-blur-sm">0{index + 1}</span>
          </Link>
          <div className="flex items-start justify-between gap-4 border-x border-b border-white/10 px-5 py-5">
            <div>
              <h3 className="font-display text-2xl text-[#f1d7de]">{lang === 'zh' ? talent.nameZh : talent.nameEn}</h3>
              <p className="mt-1 text-xs text-white/45">{lang === 'zh' ? talent.accoladeZh : talent.accoladeEn}</p>
            </div>
            <div className="text-right font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><p>{talent.platform}</p><p className="mt-1 normal-case tracking-normal">@{talent.handle}</p></div>
          </div>
          </article>
        </Reveal>
      ))}
    </div>
  )
}

export function RankingGrid({ compact = false }) {
  const { lang } = useHAgencySite()
  if (compact) {
    return (
      <div className="mt-10 grid gap-px overflow-hidden border border-[#eadde0] bg-[#eadde0] md:grid-cols-3">
        {CURRENT_RANKING.map((talent, index) => (
          <Reveal key={talent.id} delay={index * 80} className="bg-white">
            <article className="group grid grid-cols-[96px_1fr] items-center bg-white p-3 sm:grid-cols-[112px_1fr]">
            <div className="aspect-[3/4] overflow-hidden"><img src={talent.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" loading="lazy" /></div>
            <div className="px-5"><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#b66b81]">0{talent.rank} · {lang === 'zh' ? talent.rankZh : talent.rankEn}</p><h3 className="mt-2 font-display text-2xl text-[#24171c]">{lang === 'zh' ? talent.nameZh : talent.nameEn}</h3><p className="mt-2 font-mono text-[9px] text-gray-400">@{talent.handle}</p></div>
            </article>
          </Reveal>
        ))}
      </div>
    )
  }
  return (
    <div className="mt-16 grid items-end gap-5 lg:grid-cols-3 lg:pt-10">
      {CURRENT_RANKING.map((talent, index) => {
        const placement = index === 0 ? 'lg:order-2 lg:-translate-y-10' : index === 1 ? 'lg:order-1' : 'lg:order-3'
        return (
          <Reveal key={talent.id} delay={index * 90} direction="scale" className={placement}>
            <article className="group relative bg-white shadow-[0_24px_70px_rgba(64,33,43,0.08)]">
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={talent.image} alt={`${lang === 'zh' ? talent.rankZh : talent.rankEn} · ${lang === 'zh' ? talent.nameZh : talent.nameEn}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.018]" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#190f14]/65 to-transparent" />
              <span className={`absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border font-display text-xl backdrop-blur-sm ${index === 0 ? 'border-[#e1bd89] bg-[#c89650]/85 text-white' : 'border-white/50 bg-white/75 text-[#6f4552]'}`}>0{talent.rank}</span>
            </div>
            <div className={`border-x border-b px-6 py-6 ${index === 0 ? 'border-[#d9aebe] bg-[#24171c] text-white' : 'border-[#eadde0]'}`}>
              <p className={`font-mono text-[9px] uppercase tracking-[0.23em] ${index === 0 ? 'text-[#dba7b7]' : 'text-[#b66b81]'}`}>{lang === 'zh' ? talent.rankZh : talent.rankEn}</p>
              <div className="mt-2 flex items-end justify-between gap-4"><h3 className={`font-display text-3xl ${index === 0 ? 'text-[#f1d7de]' : 'text-[#24171c]'}`}>{lang === 'zh' ? talent.nameZh : talent.nameEn}</h3><p className={`font-mono text-[10px] ${index === 0 ? 'text-white/40' : 'text-gray-400'}`}>@{talent.handle}</p></div>
            </div>
            </article>
          </Reveal>
        )
      })}
    </div>
  )
}

export function UpdateGrid({ posts, limit }) {
  const { lang, path, t } = useHAgencySite()
  const shown = typeof limit === 'number' ? posts.slice(0, limit) : posts
  if (!shown.length) return <div className="mt-10 border border-[#eadde0] bg-white py-16 text-center text-sm text-[#a66b7c]">{t.updatesEmpty}</div>
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((post, index) => {
        const media = post.mediaUrl || post.imageUrl || ''
        const caption = lang === 'zh' ? (post.captionZh || post.captionEn) : (post.captionEn || post.captionZh)
        const title = post.titleZh || post.titleEn || caption || (lang === 'zh' ? 'ℋ Agency 动态' : 'ℋ Agency update')
        const isVideo = post.mediaType === 'video'
        return (
          <Reveal key={post.id} delay={index * 80} direction="scale">
            <Link to={path(`/updates/${post.slug || post.id}`)} className="group block overflow-hidden border border-[#eadde0] bg-[#fbf8f7]">
            {media && <div className="relative aspect-[4/5] overflow-hidden">{isVideo ? <video src={media} className="h-full w-full object-cover" muted playsInline /> : <img src={media} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" loading="lazy" />}{isVideo && <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">▶</span>}</div>}
            <div className="p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#b66b81]">Journal · {String(index + 1).padStart(2, '0')}</p><h3 className="mt-3 line-clamp-2 font-display text-2xl text-[#24171c]">{title}</h3>{caption && caption !== title && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{caption}</p>}</div>
            </Link>
          </Reveal>
        )
      })}
    </div>
  )
}
