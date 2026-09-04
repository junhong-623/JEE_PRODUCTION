import { Link } from 'react-router-dom'
import { GROWTH_STEPS, SERVICES } from './content'
import { PageHero, SectionHeader, Seo } from './components'
import { useHAgencySite } from './SiteContext'
import Reveal from './Reveal'

export default function ServicesPage() {
  const { lang, path, t } = useHAgencySite()
  const zh = lang === 'zh'
  const support = zh ? [
    ['开播前', '主播定位、形象建议、设备与场景准备、账号基础规划。'],
    ['开播中', '排期与内容节奏、互动方法、直播间观察与运营协作。'],
    ['开播后', '数据复盘、高光整理、内容延伸与下一阶段行动建议。'],
  ] : [
    ['Before live', 'Positioning, image direction, setup preparation and account fundamentals.'],
    ['During live', 'Scheduling, content pacing, audience interaction and operational support.'],
    ['After live', 'Performance review, highlight capture and the next practical actions.'],
  ]
  return (
    <>
      <Seo title={t.nav.services} description={zh ? '了解希望公会为中文主播提供的定位、直播运营和内容成长支持。' : 'Explore positioning, live operations and creator growth support from ℋ Agency.'} />
      <PageHero kicker={t.servicesSub} title={t.servicesTitle} copy={zh ? '主播需要的不只是一次曝光，而是一套能持续进步的工作方式。我们的服务围绕“更清楚、更稳定、更长久”展开。' : 'Creators need more than one moment of exposure. Our work builds clarity, consistency and long-term value.'} />
      <section className="bg-[#1a1116] pb-20 sm:pb-28"><div className="mx-auto max-w-7xl px-6"><Reveal direction="scale" className="relative aspect-[16/9] overflow-hidden border border-white/10 sm:aspect-[16/7]"><img src="/hagency/editorial/services-studio.webp" alt={zh ? '主播与运营团队进行直播准备' : 'Creator and operations team preparing a livestream'} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/10 to-transparent" /><div className="absolute bottom-6 left-6 max-w-md sm:bottom-10 sm:left-10"><p className="font-mono text-[9px] uppercase tracking-[.25em] text-[#efced6]">BEHIND THE LIVE</p><p className="mt-3 font-display text-3xl text-white sm:text-4xl">{zh ? '每一次自然出镜，背后都有充分准备。' : 'Every effortless live moment begins with preparation.'}</p></div></Reveal></div></section>
      <section className="bg-white py-20 sm:py-28"><div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24"><SectionHeader title={t.growthTitle} sub={t.growthSub} /><ol className="border-t border-[#eadde0]">{GROWTH_STEPS[lang].map(([title, copy], index) => <li key={title} className="grid gap-4 border-b border-[#eadde0] py-8 sm:grid-cols-[60px_180px_1fr]"><span className="font-mono text-xs text-[#b66b81]">0{index + 1}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-7 text-gray-500">{copy}</p></li>)}</ol></div></section>
      <section className="bg-[#24171c] py-20 text-white sm:py-28"><div className="mx-auto max-w-7xl px-6"><SectionHeader dark title={t.servicesTitle} sub={t.servicesSub} /><div className="mt-12 grid gap-px bg-white/10 lg:grid-cols-3">{SERVICES[lang].map(([title, copy], index) => <article key={title} className="bg-[#24171c] p-8 sm:p-10"><span className="font-mono text-[10px] tracking-[.25em] text-[#d99eb0]">0{index + 1}</span><h3 className="mt-8 font-display text-4xl text-[#f2d8df]">{title}</h3><p className="mt-5 text-sm leading-7 text-white/50">{copy}</p></article>)}</div></div></section>
      <section className="bg-[#f8f3f2] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6"><Reveal><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#b66b81]">A COMPLETE WORKFLOW</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-tight">{zh ? '每一场直播，前后都有专业支持。' : 'Professional support around every live session.'}</h2></Reveal><div className="mt-12 grid gap-5 md:grid-cols-3">{support.map(([title, copy], index) => <Reveal key={title} delay={index * 90}><article className="h-full border border-[#eadde0] bg-white p-8"><p className="font-mono text-[10px] text-[#b66b81]">0{index + 1}</p><h3 className="mt-7 font-display text-3xl">{title}</h3><p className="mt-4 text-sm leading-7 text-gray-500">{copy}</p></article></Reveal>)}</div><Link to={path('/join')} className="mt-12 inline-flex rounded-full bg-[#24171c] px-7 py-3.5 text-sm font-semibold text-white">{zh ? '开始你的申请' : 'Start your application'} ↗</Link></div></section>
    </>
  )
}
