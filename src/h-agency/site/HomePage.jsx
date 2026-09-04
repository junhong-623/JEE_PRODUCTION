import { Link } from 'react-router-dom'
import { GROWTH_STEPS, SERVICES } from './content'
import { HonorGrid, RankingGrid, SectionHeader, Seo, TalentCard, TextLink, UpdateGrid } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'
import Reveal from './Reveal'
import HomeHero from './HomeHero'

export default function HomePage() {
  const { lang, path, t } = useHAgencySite()
  const { talents, featuredTalents, honorTalents, rankingTalents, posts } = useHAgencyData()
  const zh = lang === 'zh'
  const heroTalents = featuredTalents.length ? featuredTalents : talents.slice(0, 3)

  return (
    <>
      <Seo description={zh ? 'ℋ Agency 希望公会专注中文主播的定位、内容、直播运营与长期成长。浏览旗下主播，或申请加入希望公会。' : 'ℋ Agency helps Chinese-speaking live talent build distinct creator brands through positioning, content and professional operations.'} />

      <HomeHero talents={heroTalents} talentCount={talents.length} />

      <section className="bg-[#f8f3f2] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader title={t.talentTitle} sub={t.talentSub} intro={t.talentIntro} action={<TextLink to={path('/talents')}>{t.viewAll}</TextLink>} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTalents.map((talent, index) => <TalentCard key={talent.id} talent={talent} index={index} variant="editorial" />)}
          </div>
        </div>
      </section>

      <section className="bg-[#1a1116] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader dark title={t.honorsTitle} sub={t.honorsSub} intro={t.honorsIntro} action={<TextLink dark to={path('/highlights')}>{t.viewAll}</TextLink>} />
          <HonorGrid compact talents={honorTalents} />
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader title={t.rankingTitle} sub={t.rankingSub} intro={t.rankingIntro} action={<TextLink to={path('/highlights')}>{t.viewAll}</TextLink>} />
          <RankingGrid compact talents={rankingTalents} />
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
              <Reveal key={title} delay={index * 70} as="li" className="grid gap-3 border-b border-[#dfcdd2] py-6 sm:grid-cols-[64px_165px_1fr] sm:items-start">
                <span className="font-mono text-[10px] text-[#b66b81]">0{index + 1}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-7 text-gray-500">{copy}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#24171c] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader dark title={t.servicesTitle} sub={t.servicesSub} action={<TextLink dark to={path('/services')}>{zh ? '查看完整服务' : 'View all services'}</TextLink>} />
          <Reveal direction="scale" className="relative mt-12 aspect-[16/7] overflow-hidden border border-white/10">
            <img src="/hagency/editorial/services-studio.webp" alt={zh ? '主播直播前与运营团队准备拍摄' : 'Creator and operations team preparing a livestream'} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#24171c]/65 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 max-w-xs font-mono text-[9px] uppercase tracking-[.2em] text-white/60 sm:bottom-7 sm:left-7">Behind every live moment · ℋ Agency operations</p>
          </Reveal>
          <div className="mt-12 grid border-y border-white/10 md:grid-cols-3">
            {SERVICES[lang].map(([title, copy], index) => (
              <Reveal key={title} delay={index * 90} className={`py-9 md:px-9 ${index ? 'border-t border-white/10 md:border-l md:border-t-0' : ''}`}>
                <span className="font-mono text-[10px] tracking-[0.25em] text-[#d99eb0]">0{index + 1}</span><h3 className="mt-8 font-display text-3xl text-[#f2d8df]">{title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{copy}</p>
              </Reveal>
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
