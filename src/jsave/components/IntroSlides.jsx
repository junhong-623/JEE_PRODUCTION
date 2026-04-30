import { useState, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { JSAVE_BASE } from '../utils/basePath'

const STORAGE_KEY = 'jsave-intro-seen'

const SLIDES = {
  en: [
    {
      isLogo: true,
      title: 'Welcome to JSave',
      sub: 'Your personal finance companion.\nJ-Save, J-Joy.',
    },
    {
      emoji: '💰',
      title: 'Track Every Transaction',
      sub: 'Log income, expenses & transfers across multiple accounts. See exactly where your money goes.',
    },
    {
      emoji: '📦',
      title: 'Cost Per Day',
      sub: "Add items you own and calculate cost-per-day. Discover what's truly great value.",
    },
    {
      emoji: '🔔',
      title: 'Smart Reminders',
      sub: "Get notified at 1PM & 8PM if you haven't logged today — even when the app is closed.",
    },
  ],
  zh: [
    {
      isLogo: true,
      title: '欢迎使用 J省',
      sub: 'J样省钱，J样享受！\n你的个人理财助手。',
    },
    {
      emoji: '💰',
      title: '记录每一笔交易',
      sub: '轻松记录多账户的收入、支出和转账，随时掌握你的财务状况。',
    },
    {
      emoji: '📦',
      title: '物品日均成本',
      sub: '追踪你买过的物品，计算每日成本，了解哪些东西真的超值。',
    },
    {
      emoji: '🔔',
      title: '智能提醒',
      sub: '若今日未记账，将在下午1点和晚8点推送通知提醒你记录消费。',
    },
  ],
}

export function hasSeenIntro() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export default function IntroSlides({ onDone }) {
  const { lang } = useLang()
  const slides = SLIDES[lang] ?? SLIDES.en
  const [idx, setIdx] = useState(0)
  const touchX = useRef(null)

  function finish() {
    localStorage.setItem(STORAGE_KEY, 'true')
    onDone()
  }

  function goNext() { idx < slides.length - 1 ? setIdx(i => i + 1) : finish() }
  function goPrev() { if (idx > 0) setIdx(i => i - 1) }

  function onTouchStart(e) { touchX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -40) goNext()
    else if (dx > 40) goPrev()
    touchX.current = null
  }

  const slide = slides[idx]
  const isLast = idx === slides.length - 1

  return (
    <div
      className="jsave-intro-overlay"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip */}
      {!isLast && (
        <button className="jsave-intro-skip" onClick={finish}>
          {lang === 'zh' ? '跳过' : 'Skip'}
        </button>
      )}

      {/* Slide */}
      <div className="jsave-intro-slide" key={idx}>
        {slide.isLogo ? (
          <>
            <div className="jsave-intro-logo-wrap">
              <img src={`${JSAVE_BASE}/icons/icon-192.png`} alt="JSave" className="jsave-intro-logo" />
            </div>
            <div className="jsave-intro-brand">
              <span className="jsave-intro-brand-en">JSave</span>
              <span className="jsave-intro-brand-zh">J省</span>
            </div>
          </>
        ) : (
          <div className="jsave-intro-emoji">{slide.emoji}</div>
        )}
        <h1 className="jsave-intro-title">{slide.title}</h1>
        <p className="jsave-intro-sub">{slide.sub}</p>
      </div>

      {/* Dots */}
      <div className="jsave-intro-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`jsave-intro-dot${i === idx ? ' active' : ''}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>

      {/* CTA */}
      <button className="jsave-intro-next" onClick={goNext}>
        {isLast
          ? (lang === 'zh' ? '开始使用' : 'Get Started')
          : (lang === 'zh' ? '下一步' : 'Next')}
      </button>
    </div>
  )
}
