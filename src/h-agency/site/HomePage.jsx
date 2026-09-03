import { Link } from 'react-router-dom'
import { GROWTH_STEPS, MILLION_HONORS, SERVICES } from './content'
import { HonorGrid, RankingGrid, SectionHeader, Seo, TalentCard, TextLink, UpdateGrid } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

export default function HomePage() {
  const { lang, path, t } = useHAgencySite()
  const { talents, posts } = useHAgencyData()
  const zh = lang === 'zh'

  return (
    <>
      <Seo description={zh ? 'ℋ Agency 希望公会专注中文主播的定位、内容、直播运营与长期成长。浏览旗下主播，或申请加入希望公会。' : 'ℋ Agency helps Chinese-speaking live talent build distinct creator brands through positioning, content and professional operations.'} />

      <section className="relative min-h-[820px] overflow-hidden bg-[#120c10] pt-28 text-white lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 15% 15%, rgba(230,188,199,.21), transparent 33%), radial-gradient(circle at 88% 78%, rgba(178,68,106,.19), transparent 31%)' }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '74px 74px' }} />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-16 px-6 pb-20 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:pb-16 lg:pt-10">
          <div className="relative z-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#e5b6c3]">{t.heroKicker}</p>
            <h1 className="mt-7 max-w-3xl font-display text-5xl leading-[1.04] tracking-[-0.03em] sm:text-7xl lg:text-[5.25rem]">
              {t.heroTitle1}<span className="block italic text-[#e6bcc7]">{t.heroTitle2}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/55">{t.heroCopy}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={path('/talents')} className="rounded-full bg-[#e6bcc7] px-6 py-3.5 text-sm font-semibold text-[#24171c] transition hover:bg-white">{t.explore}</Link>
              <Link to={path('/join')} className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-[#e6bcc7] hover:text-[#e6bcc7]">{t.apply}</Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/10 py-5">
              {[[`${Math.max(talents.length, 3)}+`, t.signed], ['04', t.system], ['CN', t.market]].map(([number, label]) => (
                <div key={label} className="border-l border-white/10 px-4 first:border-l-0 first:pl-0"><p className="font-display text-2xl text-[#efced6]">{number}</p><p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</p></div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[520px] w-full max-w-[620px] sm:h-[640px] lg:h-[680px]">
            <div className="absolute left-[2%] top-[15%] h-[67%] w-[42%] rotate-[-5deg] overflow-hidden border border-white/15 bg-[#21151b] shadow-2xl transition duration-500 hover:z-30 hover:rotate-[-2deg] sm:left-[3%]">
              <img src={MILLION_HONORS[0].image} alt="盼夏" className="h-full w-full object-cover" />
            </div>
            <div className="absolute right-[2%] top-[4%] z-10 h-[76%] w-[47%] rotate-[4deg] overflow-hidden border border-white/15 bg-[#21151b] shadow-2xl transition duration-500 hover:z-30 hover:rotate-[1deg]">
              <img src={MILLION_HONORS[1].image} alt="小暖" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-[1%] left-[28%] z-20 h-[67%] w-[45%] rotate-[-1deg] overflow-hidden border border-white/20 bg-[#21151b] shadow-[0_35px_90px_rgba(0,0,0,.5)] transition duration-500 hover:rotate-0">
              <img src={MILLION_HONORS[2].image} alt="贝贝" className="h-full w-full object-cover" />
            </div>
            <p className="absolute bottom-0 right-0 z-30 hidden font-mono text-[9px] uppercase tracking-[0.24em] text-white/30 sm:block">Talent · Honor · Growth</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f3f2] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader title={t.talentTitle} sub={t.talentSub} intro={t.talentIntro} action={<TextLink to={path('/talents')}>{t.viewAll}</TextLink>} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {talents.slice(0, 3).map((talent, index) => <TalentCard key={talent.id} talent={talent} index={index} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#1a1116] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader dark title={t.honorsTitle} sub={t.honorsSub} intro={t.honorsIntro} action={<TextLink dark to={path('/highlights')}>{t.viewAll}</TextLink>} />
          <HonorGrid compact />
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader title={t.rankingTitle} sub={t.rankingSub} intro={t.rankingIntro} action={<TextLink to={path('/highlights')}>{t.viewAll}</TextLink>} />
          <RankingGrid compact />
        </div>
      </section>

      <section className="bg-[#f8f3f2] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <SectionHeader title={t.growthTitle} sub={t.growthSub} />
            <p className="mt-7 max-w-md text-sm leading-7 text-gray-500">{zh ? '把适合你的方向，变成可以执行、观察和持续优化的日常。' : 'We turn the right direction into a daily system that can be executed, observed and improved.'}</p>
            <TextLink to={path('/services')}>{zh ? '了解成长体系' : 'Explore our growth system'}</TextLink>
          </div>
          <ol className="border-t border-[#dfcdd2]">
            {GROWTH_STEPS[lang].map(([title, copy], index) => (
              <li key={title} className="grid gap-3 border-b border-[#dfcdd2] py-6 sm:grid-cols-[64px_165px_1fr] sm:items-start">
                <span className="font-mono text-[10px] text-[#b66b81]">0{index + 1}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-7 text-gray-500">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#24171c] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader dark title={t.servicesTitle} sub={t.servicesSub} action={<TextLink dark to={path('/services')}>{zh ? '查看完整服务' : 'View all services'}</TextLink>} />
          <div className="mt-12 grid border-y border-white/10 md:grid-cols-3">
            {SERVICES[lang].map(([title, copy], index) => (
              <div key={title} className={`py-9 md:px-9 ${index ? 'border-t border-white/10 md:border-l md:border-t-0' : ''}`}>
                <span className="font-mono text-[10px] tracking-[0.25em] text-[#d99eb0]">0{index + 1}</span><h3 className="mt-8 font-display text-3xl text-[#f2d8df]">{title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader title={t.updatesTitle} sub={t.updatesSub} action={posts.length ? <TextLink to={path('/updates')}>{t.viewAll}</TextLink> : null} />
          <UpdateGrid posts={posts} limit={3} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#ead2d8] py-24 sm:py-28">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/45" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-9 px-6 lg:flex-row lg:items-end">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9c5368]">{t.joinSub}</p><h2 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-[#24171c] sm:text-6xl">{zh ? '你的下一场高光，可能从这里开始。' : 'Your next spotlight may begin here.'}</h2><p className="mt-6 max-w-xl text-sm leading-7 text-[#65464f]">{zh ? '不需要先成为完美的主播。告诉我们你擅长什么、想去哪里，我们会认真阅读每一份申请。' : 'You do not need to arrive as a finished creator. Tell us what you do best and where you want to go.'}</p></div>
          <Link to={path('/join')} className="shrink-0 rounded-full bg-[#24171c] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#9f4d65]">{t.apply} ↗</Link>
        </div>
      </section>
    </>
  )
}
