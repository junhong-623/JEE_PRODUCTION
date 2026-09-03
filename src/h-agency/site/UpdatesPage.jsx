import { PageHero, Seo, UpdateGrid } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

export default function UpdatesPage() {
  const { lang, t } = useHAgencySite()
  const { posts, loading } = useHAgencyData()
  const zh = lang === 'zh'
  return (
    <>
      <Seo title={t.nav.updates} description={zh ? '阅读希望公会的主播故事、荣誉记录与最新动态。' : 'Read creator stories, milestones and news from ℋ Agency.'} />
      <PageHero kicker={t.updatesSub} title={zh ? '记录舞台，也记录成长发生的过程。' : 'Stories from the stage and the work behind it.'} copy={zh ? '这里收录主播故事、公会动态、活动记录与值得被记住的高光时刻。' : 'Creator stories, agency news, events and moments worth remembering.'} />
      <section className="bg-[#f8f3f2] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6">{loading && !posts.length ? <p className="text-sm text-gray-400">{zh ? '正在读取最新动态…' : 'Loading updates…'}</p> : <UpdateGrid posts={posts} />}</div></section>
    </>
  )
}
