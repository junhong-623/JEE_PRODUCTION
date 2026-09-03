import { Link } from 'react-router-dom'
import { PageHero, Seo } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

export default function AboutPage() {
  const { lang, path, t } = useHAgencySite()
  const { talents } = useHAgencyData()
  const zh = lang === 'zh'
  const principles = zh ? [
    ['看见个性', '我们不把主播塞进同一个模板，而是从真实个性里找到最有辨识度的表达。'],
    ['长期陪伴', '重要的不只是一次数据爆发，而是主播能不能建立稳定、健康、可持续的成长。'],
    ['专业协作', '定位、内容、运营和复盘彼此连接，每一个建议都要能落到下一次行动。'],
  ] : [
    ['See individuality', 'We build from a creator’s real strengths instead of forcing everyone into one formula.'],
    ['Think long term', 'A lasting, healthy creator career matters more than one temporary spike in numbers.'],
    ['Work professionally', 'Positioning, content, operations and review connect into clear next actions.'],
  ]
  return (
    <>
      <Seo title={t.nav.about} description={zh ? '了解 ℋ Agency 希望公会的品牌理念、中文市场定位与主播成长方式。' : 'Discover ℋ Agency, our principles and our focus on Chinese-speaking live talent.'} />
      <PageHero kicker={t.aboutSub} title={zh ? '希望，是把潜力变成一条看得见的路。' : 'Hope turns potential into a path you can see.'} copy={zh ? 'ℋ Agency 希望公会是一家面向中文市场的主播经纪与内容成长团队。我们相信，真正专业的运营不是制造相同的人，而是帮助每个人被正确地看见。' : 'ℋ Agency is a talent management and creator growth team focused on the Chinese-speaking market. Professional management helps every individual be seen clearly.'} />
      <section className="bg-white py-20 sm:py-28"><div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-24"><div><img src="/hagency/logo.jpg" alt="ℋ Agency 希望公会" className="aspect-square w-full max-w-md object-cover shadow-[0_30px_90px_rgba(65,30,42,.12)]" /></div><div><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#b66b81]">OUR NAME · OUR INTENT</p><h2 className="mt-4 font-display text-5xl leading-tight">ℋ Agency<br /><span className="text-[#b66b81]">希望公会</span></h2><p className="mt-7 max-w-xl text-base leading-8 text-gray-500">{zh ? '“希望”不是一句空泛的口号。对我们来说，它是一套具体的工作：认识主播、找到方向、共同执行、持续复盘，让原本模糊的潜力逐渐成为清晰的个人品牌。' : '“Hope” is practical work: knowing the creator, finding a direction, executing together and learning continuously until potential becomes a clear personal brand.'}</p><div className="mt-9 grid grid-cols-3 border-y border-[#eadde0] py-5"><div><p className="font-display text-3xl">{Math.max(talents.length, 3)}+</p><p className="mt-1 text-[9px] uppercase tracking-[.16em] text-gray-400">{zh ? '展示主播' : 'Talent'}</p></div><div className="border-l border-[#eadde0] pl-5"><p className="font-display text-3xl">CN</p><p className="mt-1 text-[9px] uppercase tracking-[.16em] text-gray-400">{zh ? '中文市场' : 'Market'}</p></div><div className="border-l border-[#eadde0] pl-5"><p className="font-display text-3xl">360°</p><p className="mt-1 text-[9px] uppercase tracking-[.16em] text-gray-400">{zh ? '成长支持' : 'Support'}</p></div></div></div></div></section>
      <section className="bg-[#f8f3f2] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6"><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#b66b81]">WHAT WE BELIEVE</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-tight">{zh ? '专业，来自清楚的原则。' : 'Professional work begins with clear principles.'}</h2><div className="mt-12 grid gap-5 md:grid-cols-3">{principles.map(([title, copy], index) => <article key={title} className="border border-[#eadde0] bg-white p-8"><span className="font-mono text-[10px] text-[#b66b81]">0{index + 1}</span><h3 className="mt-7 font-display text-3xl">{title}</h3><p className="mt-4 text-sm leading-7 text-gray-500">{copy}</p></article>)}</div></div></section>
      <section className="bg-[#24171c] py-20 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.28em] text-[#d99eb0]">CONNECT WITH US</p><h2 className="mt-4 max-w-3xl font-display text-4xl text-[#f2d8df] sm:text-5xl">{zh ? '认识我们的主播，或让我们认识你。' : 'Meet our talent—or let us meet you.'}</h2></div><div className="flex flex-wrap gap-3"><a href="https://www.instagram.com/h_agency21/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-6 py-3 text-sm">Instagram ↗</a><Link to={path('/join')} className="rounded-full bg-[#e6bcc7] px-6 py-3 text-sm font-semibold text-[#24171c]">{t.apply} ↗</Link></div></div></section>
    </>
  )
}
