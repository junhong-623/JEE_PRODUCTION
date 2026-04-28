import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLang } from '../contexts/LangContext'
import MatetripApp from '../matetrip/App'

export default function MatetripPage() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  useEffect(() => {
    document.documentElement.classList.add('matetrip-html')
    document.body.classList.add('matetrip-body')

    return () => {
      document.documentElement.classList.remove('matetrip-html')
      document.body.classList.remove('matetrip-body')
    }
  }, [])

  return (
    <div className="matetrip-shell">
      <Helmet>
        <title>{zh ? 'MateTrip 伴旅 — 算清一路琐碎，存下全程风景。' : 'MateTrip — Travel Together, Split with Ease'}</title>
        <meta name="description" content={zh
          ? '专为旅行设计的 PWA — 智能分账、旅途相册、行程规划、旅伴聊天，全在一个应用内搞定。'
          : 'MateTrip: split trip expenses, share photos, plan itineraries, and chat with your travel crew — all in one PWA.'} />
        <meta property="og:title" content={zh ? 'MateTrip 伴旅' : 'MateTrip'} />
        <meta property="og:description" content={zh ? '算清一路琐碎，存下全程风景。' : 'Your all-in-one travel companion PWA.'} />
        <meta property="og:url" content="https://www.jeeprod.com/matetrip" />
        <meta property="og:image" content="https://www.jeeprod.com/matetrip/icons/icon-512.png" />
        <link rel="canonical" href="https://www.jeeprod.com/matetrip" />
      </Helmet>
      <MatetripApp />
    </div>
  )
}
