import { Link, useParams } from 'react-router-dom'
import { Seo } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'

function formatDate(value, lang) {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
}

export default function UpdateDetailPage() {
  const { slug } = useParams()
  const { lang, path, t } = useHAgencySite()
  const { posts, loading } = useHAgencyData()
  const post = posts.find(item => item.slug === slug || item.id === slug)
  const zh = lang === 'zh'
  if (loading && !post) return <div className="flex min-h-screen items-center justify-center bg-[#120c10] text-[#e6bcc7]">ℋ Agency</div>
  if (!post) return <div className="min-h-screen bg-[#f8f3f2] px-6 pb-28 pt-40 text-center"><p className="font-mono text-[10px] tracking-[.3em] text-[#b66b81]">THE H AGENCY JOURNAL</p><h1 className="mt-5 font-display text-5xl">{zh ? '这篇动态尚未找到' : 'Update not found'}</h1><Link to={path('/updates')} className="mt-7 inline-flex text-sm font-semibold text-[#9f4d65]">← {zh ? '返回最新动态' : 'Back to journal'}</Link></div>
  const caption = zh ? (post.captionZh || post.captionEn) : (post.captionEn || post.captionZh)
  const title = zh ? (post.titleZh || post.titleEn || caption) : (post.titleEn || post.titleZh || caption)
  const media = post.mediaUrl || post.imageUrl || ''
  const image = media && post.mediaType !== 'video' ? media : undefined
  return (
    <>
      <Seo title={title || t.nav.updates} description={caption || (zh ? 'ℋ Agency 希望公会最新动态' : 'Latest update from ℋ Agency')} image={image} />
      <article className="bg-[#f8f3f2] pb-24 pt-36 sm:pt-44">
        <div className="mx-auto max-w-4xl px-6">
          <Link to={path('/updates')} className="font-mono text-[10px] uppercase tracking-[.24em] text-[#b66b81]">← {zh ? '最新动态' : 'Journal'}</Link>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[.25em] text-[#b66b81]">THE H AGENCY JOURNAL {formatDate(post.createdAt, lang) ? `· ${formatDate(post.createdAt, lang)}` : ''}</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">{title || (zh ? 'ℋ Agency 动态' : 'ℋ Agency update')}</h1>
          {media && <div className="mt-12 overflow-hidden bg-[#1a1116]">{post.mediaType === 'video' ? <video src={media} className="max-h-[78vh] w-full object-contain" controls playsInline /> : <img src={media} alt="" className="max-h-[82vh] w-full object-contain" />}</div>}
          {caption && caption !== title && <p className="mx-auto mt-10 max-w-2xl whitespace-pre-line text-base leading-8 text-gray-600">{caption}</p>}
        </div>
      </article>
    </>
  )
}
