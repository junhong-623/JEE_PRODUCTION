import { PageHero, Seo, TalentCard } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

export default function TalentsPage() {
  const { lang, t } = useHAgencySite()
  const { talents, loading } = useHAgencyData()
  const zh = lang === 'zh'
  return (
    <>
      <Seo title={t.nav.talents} description={zh ? '认识 ℋ Agency 希望公会旗下主播与百万主播阵容。' : 'Meet the creators represented by ℋ Agency.'} />
      <PageHero kicker={t.talentSub} title={t.talentTitle} copy={t.talentIntro}>
        <div className="mt-10 flex gap-8 border-t border-white/10 pt-6 text-xs text-white/45"><span>{String(talents.length).padStart(2, '0')} {zh ? '位展示主播' : 'featured talents'}</span><span>{zh ? '持续更新中' : 'More profiles coming'}</span></div>
      </PageHero>
      <section className="bg-[#f8f3f2] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          {loading && !talents.length ? <p className="text-sm text-gray-400">{zh ? '正在读取主播资料…' : 'Loading talent profiles…'}</p> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {talents.map((talent, index) => <TalentCard key={talent.id} talent={talent} index={index} />)}
            </div>
          )}
          <p className="mt-10 max-w-2xl text-xs leading-6 text-gray-400">{zh ? '注：前三位主播目前以荣誉海报作为资料封面；收到原始人物照片后，会升级为统一的无背景人物视觉。' : 'Note: the first three profiles currently use honor posters. Clean portrait photography will replace them when supplied.'}</p>
        </div>
      </section>
    </>
  )
}
