import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MILLION_HONORS } from './content'
import { useHAgencySite } from './SiteContext'

const portraitFallbacks = {
  panxia: '/hagency/talents/home/panxia-portrait-v1.webp',
  xiaonuan: '/hagency/talents/home/xiaonuan-portrait-v1.webp',
  beibei: '/hagency/talents/home/beibei-portrait-v1.webp',
}

export default function HomeHero({ talents, talentCount }) {
  const { lang, path, t } = useHAgencySite()
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const max = Math.max(section.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / max))
      section.style.setProperty('--hero-progress', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section ref={sectionRef} className="ha-home-hero relative bg-[#120c10] text-white lg:h-[150svh]" style={{ '--hero-progress': 0 }}>
      <div className="relative min-h-[900px] overflow-hidden pt-28 lg:sticky lg:top-0 lg:h-svh lg:min-h-[760px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(230,188,199,.18),transparent_33%),radial-gradient(circle_at_12%_18%,rgba(174,74,105,.16),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#120c10] to-transparent" />

        <div className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-12 px-6 pb-20 lg:h-full lg:min-h-0 lg:grid-cols-[.82fr_1.18fr] lg:px-10 lg:pb-8 xl:px-16">
          <div className="ha-hero-copy relative z-20 max-w-2xl pt-5 lg:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#e5b6c3]">{t.heroKicker}</p>
            <h1 className="mt-7 font-display text-5xl leading-[1.02] tracking-[-0.035em] sm:text-7xl lg:text-[clamp(4.6rem,6vw,7.2rem)]">
              {t.heroTitle1}<span className="block italic text-[#e6bcc7]">{t.heroTitle2}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/55">{t.heroCopy}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={path('/talents')} className="rounded-full bg-[#f4d7de] px-6 py-3.5 text-sm font-semibold text-[#24171c] transition duration-500 hover:scale-[1.025] hover:bg-white">{t.explore}</Link>
              <Link to={path('/join')} className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition duration-500 hover:border-[#e6bcc7] hover:bg-white/[.04] hover:text-[#e6bcc7]">{t.apply}</Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/10 py-5">
              {[[`${Math.max(talentCount, 3)}+`, t.signed], ['04', t.system], ['CN', t.market]].map(([number, label]) => (
                <div key={label} className="border-l border-white/10 px-4 first:border-l-0 first:pl-0"><p className="font-display text-2xl text-[#efced6]">{number}</p><p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</p></div>
              ))}
            </div>
          </div>

          <div className="ha-hero-stage relative mx-auto h-[480px] w-full max-w-[760px] sm:h-[600px] lg:h-[min(76vh,760px)]">
            {Array.from({ length: 3 }, (_, index) => {
              const talent = talents[index]
              const fallback = MILLION_HONORS[index]
              const slug = talent?.slug || fallback.slug
              const name = lang === 'zh' ? (talent?.nameZh || fallback.nameZh) : (talent?.nameEn || fallback.nameEn)
              return (
                <Link key={talent?.id || index} to={path(`/talents/${slug}`)} className={`ha-hero-portrait ha-hero-portrait-${index + 1} group`} aria-label={name}>
                  <img src={talent?.homeImageUrl || portraitFallbacks[slug] || talent?.photoUrl || fallback.image} alt={name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]" />
                  <span className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-white/50 bg-white/72 px-4 py-2.5 text-[#24171c] shadow-sm backdrop-blur-xl">
                    <span className="font-display text-xl">{name}</span><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9f6072]">0{index + 1} ↗</span>
                  </span>
                </Link>
              )
            })}
            <p className="absolute bottom-1 right-2 hidden font-mono text-[9px] uppercase tracking-[0.24em] text-white/28 sm:block">Talent · Honor · Growth</p>
          </div>
        </div>

        <div className="ha-scroll-cue pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[9px] uppercase tracking-[.24em] text-white/28 lg:flex">
          <span className="h-px w-10 bg-white/20" />{lang === 'zh' ? '向下探索' : 'Scroll to discover'}<span className="h-px w-10 bg-white/20" />
        </div>
      </div>
    </section>
  )
}
