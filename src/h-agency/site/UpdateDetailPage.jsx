import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from './components'
import { useHAgencyData } from './HAgencyData'
import { useHAgencySite } from './SiteContext'
import { resolvePostCopy } from './postCopy'

function formatDate(value, lang) {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
}

function Icon({ name, filled = false }) {
  const paths = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.3l7.8-7.8 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function ProfileHeader({ username, permalink, zh }) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#e6bcc7] via-[#f9eef1] to-[#b96f84] p-[2px]">
        <img src="/hagency/logo.jpg" alt="ℋ Agency" className="h-full w-full rounded-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#24171c]">
          {username}
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#bc7187] text-[9px] text-white">ℋ</span>
        </span>
        <span className="mt-0.5 block text-[11px] text-[#8d7079]">ℋ Agency · {zh ? '希望公会动态' : 'Official journal'}</span>
      </span>
      <span className="text-sm text-[#9f4d65]">↗</span>
    </>
  )
  return permalink
    ? <a href={permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#fcf8f9] sm:px-5">{content}</a>
    : <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">{content}</div>
}

export default function UpdateDetailPage() {
  const { slug } = useParams()
  const { lang, path, t } = useHAgencySite()
  const { posts, loading } = useHAgencyData()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const post = posts.find(item => item.slug === slug || item.id === slug)
  const zh = lang === 'zh'

  if (loading && !post) return <div className="flex min-h-screen items-center justify-center bg-[#120c10] text-[#e6bcc7]">ℋ Agency</div>
  if (!post) return <div className="min-h-screen bg-[#f8f3f2] px-6 pb-28 pt-40 text-center"><p className="font-mono text-[10px] tracking-[.3em] text-[#b66b81]">THE H AGENCY JOURNAL</p><h1 className="mt-5 font-display text-5xl">{zh ? '这篇动态尚未找到' : 'Update not found'}</h1><Link to={path('/updates')} className="mt-7 inline-flex text-sm font-semibold text-[#9f4d65]">← {zh ? '返回最新动态' : 'Back to journal'}</Link></div>

  const { title, content } = resolvePostCopy(post, lang)
  const media = post.mediaUrl || post.imageUrl || ''
  const image = media && post.mediaType !== 'video' ? media : undefined
  const date = formatDate(post.createdAt, lang)
  const username = post.instagramUsername || 'h_agency21'

  const sharePost = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: content || title, url: window.location.href })
        return
      }
      await navigator.clipboard.writeText(window.location.href)
      setShareStatus(zh ? '链接已复制' : 'Link copied')
      window.setTimeout(() => setShareStatus(''), 1800)
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus(zh ? '暂时无法分享' : 'Unable to share')
    }
  }

  return (
    <>
      <Seo title={title || t.nav.updates} description={content || title || (zh ? 'ℋ Agency 希望公会最新动态' : 'Latest update from ℋ Agency')} image={image} />
      <article className="min-h-screen bg-[radial-gradient(circle_at_top,#fff_0%,#f8f2f3_42%,#f1e8eb_100%)] pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="mx-auto max-w-6xl px-3 sm:px-6">
          <div className="mb-5 flex items-center justify-between px-2 sm:px-0">
            <Link to={path('/updates')} className="inline-flex items-center gap-2 text-xs font-semibold text-[#9f4d65] transition hover:-translate-x-0.5">← {zh ? '返回最新动态' : 'Back to journal'}</Link>
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#b68a97]">H Agency Journal</p>
          </div>

          <div className={`mx-auto overflow-hidden rounded-[22px] border border-[#e4d4d8] bg-white shadow-[0_30px_90px_rgba(76,39,53,0.12)] ${media ? 'lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]' : 'max-w-2xl'}`}>
            <div className="border-b border-[#eee3e6] lg:hidden">
              <ProfileHeader username={username} permalink={post.permalink} zh={zh} />
            </div>

            {media && (
              <div className="flex min-h-[320px] items-center justify-center bg-[#130e11] lg:min-h-[650px]">
                {post.mediaType === 'video'
                  ? <video src={media} className="max-h-[78vh] w-full object-contain" controls playsInline />
                  : <img src={media} alt={title || ''} className="max-h-[78vh] w-full object-contain" />
                }
              </div>
            )}

            <aside className="flex min-h-0 flex-col bg-white lg:max-h-[78vh] lg:min-h-[650px]">
              <div className="hidden border-b border-[#eee3e6] lg:block">
                <ProfileHeader username={username} permalink={post.permalink} zh={zh} />
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
                <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#b66b81]">{post.source === 'instagram' ? 'Instagram' : 'H Agency Journal'}{date ? ` · ${date}` : ''}</p>
                <h1 className="mt-3 font-display text-[1.85rem] leading-[1.18] text-[#24171c] sm:text-4xl">{title || (zh ? 'ℋ Agency 动态' : 'ℋ Agency update')}</h1>
                {content && <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-[#5f5055]">{content}</p>}
              </div>

              <div className="border-t border-[#eee3e6] px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between text-[#2e2025]">
                  <div className="flex items-center gap-5">
                    <button type="button" onClick={() => setLiked(value => !value)} aria-label={zh ? '喜欢' : 'Like'} className={`transition hover:scale-110 ${liked ? 'text-[#d44f78]' : 'hover:text-[#c35f7e]'}`}><Icon name="heart" filled={liked} /></button>
                    <button type="button" onClick={sharePost} aria-label={zh ? '分享' : 'Share'} className="transition hover:-translate-y-0.5 hover:text-[#c35f7e]"><Icon name="send" /></button>
                  </div>
                  <button type="button" onClick={() => setSaved(value => !value)} aria-label={zh ? '收藏' : 'Save'} className={`transition hover:scale-105 ${saved ? 'text-[#9f4d65]' : 'hover:text-[#c35f7e]'}`}><Icon name="bookmark" filled={saved} /></button>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    {liked && <p className="text-xs font-semibold text-[#3a292f]">{zh ? '已喜欢这篇动态' : 'You liked this update'}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#a79399]">{shareStatus || date}</p>
                  </div>
                  {post.source === 'instagram' && post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-[#9f4d65] transition hover:text-[#c35f7e]">
                      {zh ? '查看原帖' : 'Original post'} ↗
                    </a>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  )
}
