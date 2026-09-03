import { HonorGrid, PageHero, RankingGrid, SectionHeader, Seo } from './components'
import { useHAgencySite } from './SiteContext'

export default function HighlightsPage() {
  const { lang, t } = useHAgencySite()
  const zh = lang === 'zh'
  return (
    <>
      <Seo title={t.nav.highlights} description={zh ? '查看 ℋ Agency 百万主播荣誉与本期主播高光榜单。' : 'Explore ℋ Agency creator honors and current talent highlights.'} />
      <PageHero kicker="HONOR · MILESTONE · SPOTLIGHT" title={zh ? '每一束高光，都来自长期的认真。' : 'Every spotlight is earned through consistency.'} copy={zh ? '我们记录主播的里程碑，也记录那些看不见的积累。荣誉不是终点，而是下一段成长的开场。' : 'We celebrate visible milestones and the unseen work behind them. Every honor opens the next chapter.'} />
      <section className="bg-[#1a1116] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6"><SectionHeader dark title={t.honorsTitle} sub={t.honorsSub} intro={t.honorsIntro} /><HonorGrid /></div></section>
      <section className="bg-[#f8f3f2] py-20 sm:py-32"><div className="mx-auto max-w-7xl px-6"><SectionHeader title={t.rankingTitle} sub={t.rankingSub} intro={t.rankingIntro} /><RankingGrid /></div></section>
    </>
  )
}
