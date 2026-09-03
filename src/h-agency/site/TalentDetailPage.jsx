import { Link, useParams } from 'react-router-dom'
import { MILLION_HONORS } from './content'
import { Seo, TextLink } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

export default function TalentDetailPage() {
  const { slug } = useParams()
  const { lang, path } = useHAgencySite()
  const { talents, loading } = useHAgencyData()
  const talent = talents.find(item => item.slug === slug || item.id === slug)
  const honor = MILLION_HONORS.find(item => item.slug === slug || item.id === slug)
  const zh = lang === 'zh'

  if (loading && !talent) return <div className="flex min-h-screen items-center justify-center bg-[#120c10] text-[#e6bcc7]">ℋ Agency</div>
  if (!talent) return <div className="min-h-screen bg-[#f8f3f2] px-6 pb-28 pt-40 text-center"><p className="font-mono text-[10px] tracking-[.3em] text-[#b66b81]">TALENT PROFILE</p><h1 className="mt-5 font-display text-5xl">{zh ? '尚未找到这位主播' : 'Talent not found'}</h1><TextLink to={path('/talents')}>{zh ? '返回旗下主播' : 'Back to talent'}</TextLink></div>

  const name = zh ? talent.nameZh : (talent.nameEn || talent.nameZh)
  const intro = zh ? (talent.introZh || talent.introEn) : (talent.introEn || talent.introZh)
  const metrics = [
    [zh ? '月收入' : 'Monthly income', talent.income],
    [zh ? '直播时长' : 'Stream hours', talent.hours],
    [zh ? '粉丝增长' : 'Fan growth', talent.fans],
  ].filter(([, value]) => value)

  return (
    <>
      <Seo title={name} description={intro || `${name} · ℋ Agency 希望公会旗下主播`} image={honor ? `https://agency.jeeprod.com${honor.image}` : undefined} />
      <section className="bg-[#120c10] pb-20 pt-32 text-white sm:pb-28 sm:pt-40">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div className="relative mx-auto w-full max-w-[560px] overflow-hidden border border-white/10 bg-[#21151b]">
            <img src={talent.photoUrl || '/hagency/logo.jpg'} alt={name} className="aspect-[3/4] h-full w-full object-cover" />
            <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.2em] backdrop-blur-sm">{zh ? (talent.badgeZh || '签约主播') : (talent.badgeEn || talent.badgeZh || 'Signed Talent')}</span>
          </div>
          <div>
            <Link to={path('/talents')} className="font-mono text-[10px] uppercase tracking-[.25em] text-[#d99eb0]">← {zh ? '全部主播' : 'All talent'}</Link>
            <h1 className="mt-7 font-display text-6xl leading-none text-[#f5dce2] sm:text-8xl">{name}</h1>
            {talent.nameEn && zh && <p className="mt-3 font-display text-2xl italic text-white/30">{talent.nameEn}</p>}
            <p className="mt-8 max-w-xl text-base leading-8 text-white/55">{intro}</p>
            {(talent.platform || talent.handle) && <div className="mt-10 grid max-w-lg grid-cols-2 border-y border-white/10 py-5"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-white/30">Platform</p><p className="mt-2 text-sm text-white/75">{talent.platform || '—'}</p></div><div className="border-l border-white/10 pl-6"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-white/30">Account</p><p className="mt-2 text-sm text-white/75">{talent.handle ? `@${talent.handle}` : '—'}</p></div></div>}
            {talent.socialUrl && <a href={talent.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex rounded-full border border-[#e6bcc7]/40 px-6 py-3 text-sm text-[#efced6] transition hover:bg-[#e6bcc7] hover:text-[#24171c]">{zh ? '查看主播账号' : 'View creator account'} ↗</a>}
          </div>
        </div>
      </section>

      {(honor || metrics.length > 0) && <section className="bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-6">
        {metrics.length > 0 && <div className="mb-20 grid gap-px border border-[#eadde0] bg-[#eadde0] sm:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="bg-[#f8f3f2] p-7"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#b66b81]">{label}</p><p className="mt-3 font-display text-3xl">{value}</p></div>)}</div>}
        {honor && <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#b66b81]">MILLION CREATOR HONOR</p><h2 className="mt-4 font-display text-5xl leading-tight">{zh ? honor.accoladeZh : honor.accoladeEn}</h2><p className="mt-6 text-sm leading-7 text-gray-500">{zh ? '这张海报记录主播的重要成长里程碑。完整个人经历与更多作品将在收到原始人物资料后继续补充。' : 'This artwork marks an important creator milestone. The full story and portfolio will be expanded when the original portrait assets arrive.'}</p><TextLink to={path('/highlights')}>{zh ? '查看主播高光' : 'View all highlights'}</TextLink></div><img src={honor.image} alt="" className="mx-auto w-full max-w-[620px] border border-[#eadde0] shadow-[0_25px_80px_rgba(50,20,30,.12)]" /></div>}
      </div></section>}

      <section className="bg-[#ead2d8] py-20"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-6 md:flex-row md:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#9f4d65]">JOIN ℋ AGENCY</p><h2 className="mt-3 font-display text-4xl">{zh ? '想站上属于你的舞台？' : 'Ready for a stage of your own?'}</h2></div><Link to={path('/join')} className="rounded-full bg-[#24171c] px-7 py-3.5 text-sm font-semibold text-white">{zh ? '申请加入' : 'Apply now'} ↗</Link></div></section>
    </>
  )
}
