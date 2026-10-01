import { useEffect, useRef, useState } from 'react'

const PROFILE_URL = 'https://www.instagram.com/j._save/'
const FEED_URL = import.meta.env.VITE_JSAVE_INSTAGRAM_FEED_URL || 'https://jsave.jeeprod.com/api/instagram'

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /></svg>
}

function useEntrance() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    }, { threshold: .08 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, visible]
}

function Post({ post, zh, index }) {
  const [cardRef, visible] = useEntrance()
  const [slide, setSlide] = useState(0)
  const [failed, setFailed] = useState({})
  const [expanded, setExpanded] = useState(false)
  const [captionHeight, setCaptionHeight] = useState(70)
  const [dragOffset, setDragOffset] = useState(0)
  const [jumping, setJumping] = useState(false)
  const captionRef = useRef(null)
  const gesture = useRef(null)
  const suppressClickUntil = useRef(0)
  const images = post.images?.length ? post.images : [null]
  useEffect(() => {
    const element = captionRef.current
    const measure = () => setCaptionHeight(element.scrollHeight)
    measure()
    if (!('ResizeObserver' in window)) return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const caption = post.caption || (zh ? 'JSave 的日常分享' : 'A little update from JSave')
  const date = post.timestamp ? new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-MY', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(post.timestamp)) : null
  const openLabel = zh ? '在 Instagram 查看帖子' : 'View post on Instagram'
  const multiple = images.length > 1
  const changeSlide = next => {
    const target = Math.max(0, Math.min(images.length - 1, typeof next === 'function' ? next(slide) : next))
    setJumping(Math.abs(target - slide) > 1)
    setSlide(target)
  }
  const finishGesture = event => {
    const start = gesture.current
    if (start?.pointerId !== event.pointerId) return
    if (start.dragging) {
      const distance = event.clientX - start.x
      suppressClickUntil.current = Date.now() + 500
      if (Math.abs(distance) > 40) changeSlide(value => value + (distance < 0 ? 1 : -1))
    }
    gesture.current = null
    setDragOffset(0)
  }

  return <article ref={cardRef} className={`ji-ig-card ji-ig-enter${visible ? ' is-visible' : ''}`} style={{ '--ig-delay': `${(index % 3) * 85}ms` }} aria-label={caption.split('\n')[0]}>
    <div className={`ji-ig-image${dragOffset ? ' is-dragging' : ''}${jumping ? ' is-jumping' : ''}`} role={multiple ? 'group' : undefined} aria-roledescription={multiple ? (zh ? '图片轮播' : 'carousel') : undefined} aria-label={multiple ? (zh ? '左右滑动或使用方向键翻图' : 'Swipe or use arrow keys to browse images') : undefined} tabIndex={multiple ? 0 : undefined}
      onKeyDown={event => {
        if (!multiple || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        if (event.key === 'Home') changeSlide(0)
        else if (event.key === 'End') changeSlide(images.length - 1)
        else changeSlide(value => value + (event.key === 'ArrowRight' ? 1 : -1))
      }}
      onPointerDown={event => { if (multiple && event.isPrimary && event.button === 0) gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, dragging: false } }}
      onPointerMove={event => {
        const start = gesture.current
        if (!start || start.pointerId !== event.pointerId) return
        const distance = event.clientX - start.x
        if (Math.abs(distance) > 12 && Math.abs(distance) > Math.abs(event.clientY - start.y) * 1.3) {
          start.dragging = true
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragOffset(Math.max(-80, Math.min(80, distance)))
        }
      }}
      onPointerUp={finishGesture}
      onPointerCancel={event => { if (gesture.current?.pointerId === event.pointerId) { gesture.current = null; setDragOffset(0) } }}>
      <a href={post.permalink} target="_blank" rel="noopener noreferrer" draggable="false" aria-label={`${openLabel} · ${caption.slice(0, 70)}`} onClick={event => { if (Date.now() < suppressClickUntil.current) event.preventDefault() }}>
        <div className="ji-ig-track" style={{ transform: `translateX(calc(${-slide * 100}% + ${dragOffset}px))` }}>
          {images.map((image, imageIndex) => <div className="ji-ig-frame" key={imageIndex} aria-hidden={imageIndex !== slide}>
            {image && !failed[image] ? (Math.abs(imageIndex - slide) <= 1 && <img src={image} alt={zh ? `JSave 帖子，第 ${imageIndex + 1} 张图片` : `JSave post, image ${imageIndex + 1}`} draggable="false" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(previous => ({ ...previous, [image]: true }))} />) : <div className="ji-ig-image-fallback"><InstagramIcon /><span>JSave</span><small>{openLabel} ↗</small></div>}
          </div>)}
        </div>
      </a>
      {multiple && <>
        <span className="ji-ig-count" aria-live="polite" aria-atomic="true">{slide + 1} / {post.images.length}</span>
        <div className="ji-ig-dots">{images.map((_, dotIndex) => <button aria-label={zh ? `查看第 ${dotIndex + 1} 张图片` : `View image ${dotIndex + 1}`} aria-pressed={slide === dotIndex} onClick={() => changeSlide(dotIndex)} key={dotIndex}><i /></button>)}</div>
      </>}
      {post.mediaType === 'VIDEO' && <span className="ji-ig-reel"><span aria-hidden="true">▷</span> Reel</span>}
    </div>
    <div className="ji-ig-card-body">
      {multiple && <p className="ji-ig-gesture-hint"><span aria-hidden="true">↔</span>{zh ? '左右滑动翻图' : 'Swipe to explore'}</p>}
      <div className={`ji-ig-caption-window${expanded ? ' is-expanded' : ''}${captionHeight > 70 ? ' is-collapsible' : ''}`} style={{ maxHeight: expanded ? `${captionHeight}px` : '4.95em' }}><p ref={captionRef} className="ji-ig-caption">{caption}</p></div>
      {captionHeight > 70 && <button className="ji-ig-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? (zh ? '收起' : 'Show less') : (zh ? '展开文字' : 'Read more')}</button>}
      <div className="ji-ig-card-foot">{date && <time dateTime={post.timestamp}>{date}</time>}<a href={post.permalink} target="_blank" rel="noopener noreferrer">{zh ? '查看帖子' : 'View post'} <span aria-hidden="true">↗</span></a></div>
    </div>
  </article>
}

export default function JSaveInstagram({ zh }) {
  const root = useRef(null)
  const [headingRef, headingVisible] = useEntrance()
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
    <div ref={headingRef} className={`ji-ig-heading ji-ig-enter${headingVisible ? ' is-visible' : ''}`}>
      <div><p className="ji-kicker">JSAVE ON INSTAGRAM</p><h2 id="instagram-title">{zh ? '生活里的小账，慢慢聊。' : 'Small money moments. Real life.'}</h2><p className="ji-ig-description">{zh ? '新功能、记账小习惯，还有那些「okay lah」的日常消费。来自 @j._save 的最新分享。' : 'New features, everyday money habits, and the little purchases that add up. The latest from @j._save.'}</p></div>
      <a className="ji-ig-profile" href={PROFILE_URL} target="_blank" rel="noopener noreferrer"><InstagramIcon /><span>@j._save</span><span aria-hidden="true">↗</span></a>
    </div>
    <div aria-busy={loading} aria-live="polite">
      {loading ? <div className="ji-ig-grid ji-ig-loading" aria-label={zh ? '正在加载 Instagram 帖子' : 'Loading Instagram posts'}>{[0, 1, 2].map(index => <div className="ji-ig-skeleton" key={index} aria-hidden="true"><div /><i /><i /></div>)}</div> : feed.posts.length ? <div className="ji-ig-grid">
        {feed.posts.map((post, index) => <Post post={post} zh={zh} index={index} key={post.id} />)}
        {feed.posts.length % 3 === 2 && <a className="ji-ig-follow" href={PROFILE_URL} target="_blank" rel="noopener noreferrer"><span className="ji-ig-follow-orbit" aria-hidden="true" /><InstagramIcon /><span>{zh ? '下一篇，\n在 Instagram 见。' : 'See you on\nInstagram.'}</span><p>{zh ? '关注 @j._save，一起花得清楚，存得从容。' : 'Follow @j._save. Spend clearly, save calmly.'}</p><b>{zh ? '关注 JSave' : 'Follow JSave'} <span aria-hidden="true">↗</span></b></a>}
      </div> : <div className="ji-ig-empty"><InstagramIcon /><h3>{zh ? '更多 JSave 日常，在这里。' : 'More everyday JSave moments, here.'}</h3><p>{zh ? '到 Instagram 看最新分享，和我们聊聊你的记账习惯。' : 'Find the latest posts on Instagram and share your money habits with us.'}</p><a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">{zh ? '打开 @j._save' : 'Visit @j._save'} ↗</a>{feed.status === 'unavailable' && <button onClick={() => setAttempt(value => value + 1)}>{zh ? '重新加载帖子' : 'Reload posts'}</button>}</div>}
    </div>
  </section>
}
