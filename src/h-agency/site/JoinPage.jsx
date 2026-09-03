import ApplicationForm from './ApplicationForm'
import { PageHero, Seo } from './components'
import { useHAgencySite } from './SiteContext'

export default function JoinPage() {
  const { lang, t } = useHAgencySite()
  const zh = lang === 'zh'
  const steps = zh ? [['提交资料', '告诉我们你的基础情况、特长和想发展的方向。'], ['团队联系', '招募团队会阅读申请，并在合适时与你进一步沟通。'], ['方向评估', '一起了解定位、平台与开播规划是否适合彼此。']] : [['Share your profile', 'Tell us about your background, strengths and creator goals.'], ['Team follow-up', 'Our recruitment team reviews each submission and reaches out when appropriate.'], ['Direction review', 'We discuss positioning, platform and whether we are a good fit.']]
  return (
    <>
      <Seo title={t.nav.join} description={zh ? '申请加入 ℋ Agency 希望公会，获得主播定位、直播运营与内容成长支持。' : 'Apply to join ℋ Agency for creator positioning, live operations and growth support.'} />
      <PageHero kicker={t.joinSub} title={t.joinTitle} copy={zh ? '不需要先成为完美的主播。告诉我们你擅长什么、想去哪里，我们会认真阅读每一份申请。' : 'You do not need to arrive as a finished creator. Tell us what you do best and where you want to go.'} />
      <section className="bg-white py-16"><div className="mx-auto grid max-w-7xl gap-px bg-[#eadde0] px-6 sm:grid-cols-3 sm:bg-transparent">{steps.map(([title, copy], index) => <article key={title} className="bg-[#f8f3f2] p-7 sm:border sm:border-[#eadde0]"><p className="font-mono text-[10px] tracking-[.2em] text-[#b66b81]">0{index + 1}</p><h2 className="mt-4 font-display text-2xl">{title}</h2><p className="mt-3 text-sm leading-6 text-gray-500">{copy}</p></article>)}</div></section>
      <section className="bg-[#f8f3f2] py-20 sm:py-28"><div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[.72fr_1.28fr] lg:gap-24"><div><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#b66b81]">APPLICATION</p><h2 className="mt-4 font-display text-5xl leading-tight">{zh ? '从真实的你开始。' : 'Start with the real you.'}</h2><p className="mt-7 max-w-md text-sm leading-7 text-gray-500">{zh ? '我们重视潜力、表达力和持续投入的意愿。即使你没有直播经验，也可以申请。带 * 的项目为必填。' : 'We value potential, communication and commitment. You may apply even without previous streaming experience. Fields marked * are required.'}</p><div className="mt-10 border-t border-[#decbd0] pt-6"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#b66b81]">Instagram</p><a href="https://www.instagram.com/h_agency21/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium hover:text-[#b65f79]">@h_agency21 ↗</a></div></div><ApplicationForm /></div></section>
    </>
  )
}
