import { useEffect, useRef, useState } from 'react'

const PROFILE_URL = 'https://www.instagram.com/j._save/'
const FEED_URL = import.meta.env.VITE_JSAVE_INSTAGRAM_FEED_URL || 'https://jsave.jeeprod.com/api/instagram'

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /></svg>
}

function Post({ post, zh }) {
  const [slide, setSlide] = useState(0)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const image = post.images?.[slide]
  useEffect(() => { setFailed(false) }, [image])
  const caption = post.caption || (zh ? 'JSave 的日常分享' : 'A little update from JSave')
  const date = post.timestamp ? new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-MY', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(post.timestamp)) : null
  const openLabel = zh ? '在 Instagram 查看帖子' : 'View post on Instagram'
  const multiple = post.images?.length > 1

  return <article className="ji-ig-card" aria-label={caption.split('\n')[0]}>
    <div className="ji-ig-image">
      <a href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label={`${openLabel} · ${caption.slice(0, 70)}`}>
        {image && !failed ? <img key={image} src={image} alt={zh ? `JSave 帖子，第 ${slide + 1} 张图片` : `JSave post, image ${slide + 1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <div className="ji-ig-image-fallback"><InstagramIcon /><span>JSave</span><small>{openLabel} ↗</small></div>}
      </a>
      {multiple && <>
        <span className="ji-ig-count" aria-live="polite" aria-atomic="true">{slide + 1} / {post.images.length}</span>
        <button className="ji-ig-slide ji-ig-slide-prev" aria-label={zh ? '上一张图片' : 'Previous image'} disabled={slide === 0} onClick={() => setSlide(value => value - 1)}>‹</button>
        <button className="ji-ig-slide ji-ig-slide-next" aria-label={zh ? '下一张图片' : 'Next image'} disabled={slide === post.images.length - 1} onClick={() => setSlide(value => value + 1)}>›</button>
        <div className="ji-ig-dots" aria-hidden="true">{post.images.map((_, index) => <i className={slide === index ? 'is-active' : ''} key={index} />)}</div>
      </>}
      {post.mediaType === 'VIDEO' && <span className="ji-ig-reel"><span aria-hidden="true">▷</span> Reel</span>}
    </div>
    <div className="ji-ig-card-body">
      <p className={`ji-ig-caption${expanded ? ' is-expanded' : ''}`}>{caption}</p>
      {caption.length > 95 && <button className="ji-ig-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? (zh ? '收起' : 'Show less') : (zh ? '展开文字' : 'Read more')}</button>}
      <div className="ji-ig-card-foot">{date && <time dateTime={post.timestamp}>{date}</time>}<a href={post.permalink} target="_blank" rel="noopener noreferrer">{zh ? '查看帖子' : 'View post'} <span aria-hidden="true">↗</span></a></div>
    </div>
  </article>
}

export default function JSaveInstagram({ zh }) {
  const root = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [feed, setFeed] = useState({ status: 'idle', posts: [] })
  useEffect(() => {
    const controller = new AbortController()
    let timer
    let started = false
    let disposed = false
    // The landing page mounts after the app loader, so the native hash scroll
    // can run before this section exists. Restore direct links once it mounts.
    if (attempt === 0 && window.location.hash === '#instagram') root.current.scrollIntoView({ block: 'start', behavior: 'instant' })
    async function load() {
      if (started) return
      started = true
      setFeed({ status: 'loading', posts: [] })
      timer = setTimeout(() => controller.abort(), 12000)
      try {
        const response = await fetch(FEED_URL, { signal: controller.signal, credentials: 'omit' })
        if (!response.ok) throw new Error('unavailable')
        const data = await response.json()
        if (!Array.isArray(data.posts) || data.profile?.username !== 'j._save') throw new Error('invalid_feed')
        if (!controller.signal.aborted) setFeed({ status: 'ready', posts: data.posts.slice(0, 6) })
      } catch {
        // Keep the profile link useful when offline or when Instagram needs reconnecting.
        if (!disposed) setFeed({ status: 'unavailable', posts: [] })
      } finally { clearTimeout(timer) }
    }
    let observer
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load() }
      }, { rootMargin: '500px' })
      observer.observe(root.current)
    } else load()
    return () => { disposed = true; observer?.disconnect(); controller.abort(); clearTimeout(timer) }
  }, [attempt])

  const loading = ['idle', 'loading'].includes(feed.status)
  return <section id="instagram" className="ji-instagram" ref={root} aria-labelledby="instagram-title">
    <div className="ji-ig-heading">
      <div><p className="ji-kicker">JSAVE ON INSTAGRAM</p><h2 id="instagram-title">{zh ? '生活里的小账，慢慢聊。' : 'Small money moments. Real life.'}</h2><p className="ji-ig-description">{zh ? '新功能、记账小习惯，还有那些「okay lah」的日常消费。来自 @j._save 的最新分享。' : 'New features, everyday money habits, and the little purchases that add up. The latest from @j._save.'}</p></div>
      <a className="ji-ig-profile" href={PROFILE_URL} target="_blank" rel="noopener noreferrer"><InstagramIcon /><span>@j._save</span><span aria-hidden="true">↗</span></a>
    </div>
    <div aria-busy={loading} aria-live="polite">
      {loading ? <div className="ji-ig-grid ji-ig-loading" aria-label={zh ? '正在加载 Instagram 帖子' : 'Loading Instagram posts'}>{[0, 1, 2].map(index => <div className="ji-ig-skeleton" key={index} aria-hidden="true"><div /><i /><i /></div>)}</div> : feed.posts.length ? <div className="ji-ig-grid">
        {feed.posts.map(post => <Post post={post} zh={zh} key={post.id} />)}
        {feed.posts.length % 3 === 2 && <a className="ji-ig-follow" href={PROFILE_URL} target="_blank" rel="noopener noreferrer"><InstagramIcon /><span>{zh ? '下一篇，\n在 Instagram 见。' : 'See you on\nInstagram.'}</span><p>{zh ? '关注 @j._save，一起花得清楚，存得从容。' : 'Follow @j._save. Spend clearly, save calmly.'}</p><b>{zh ? '关注 JSave' : 'Follow JSave'} ↗</b></a>}
      </div> : <div className="ji-ig-empty"><InstagramIcon /><h3>{zh ? '更多 JSave 日常，在这里。' : 'More everyday JSave moments, here.'}</h3><p>{zh ? '到 Instagram 看最新分享，和我们聊聊你的记账习惯。' : 'Find the latest posts on Instagram and share your money habits with us.'}</p><a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">{zh ? '打开 @j._save' : 'Visit @j._save'} ↗</a>{feed.status === 'unavailable' && <button onClick={() => setAttempt(value => value + 1)}>{zh ? '重新加载帖子' : 'Reload posts'}</button>}</div>}
    </div>
  </section>
}
