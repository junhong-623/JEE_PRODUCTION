import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const COLOR_MAP = {
  yellow: { bar: 'bg-amber-50 border-amber-200',  text: 'text-amber-900',  dot: 'bg-amber-400',  btn: 'bg-amber-300/60 hover:bg-amber-300 text-amber-900' },
  orange: { bar: 'bg-orange-50 border-orange-200', text: 'text-orange-900', dot: 'bg-orange-400', btn: 'bg-orange-300/60 hover:bg-orange-300 text-orange-900' },
  blue:   { bar: 'bg-blue-50 border-blue-200',     text: 'text-blue-900',   dot: 'bg-blue-400',   btn: 'bg-blue-300/60 hover:bg-blue-300 text-blue-900'   },
  green:  { bar: 'bg-green-50 border-green-200',   text: 'text-green-900',  dot: 'bg-green-500',  btn: 'bg-green-300/60 hover:bg-green-300 text-green-900'  },
  red:    { bar: 'bg-red-50 border-red-200',        text: 'text-red-900',    dot: 'bg-red-400',    btn: 'bg-red-300/60 hover:bg-red-300 text-red-900'    },
}

export default function AnnouncementBanner() {
  const { lang } = useLang()
  const [banners, setBanners] = useState([])
  const [color, setColor] = useState('yellow')
  // trackIdx points into the extended array [clone_last, ...real, clone_first]
  const [trackIdx, setTrackIdx] = useState(1)
  const [transitioning, setTransitioning] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      const d = snap.data() || {}
      let list = []
      if (d.announcements?.length) {
        list = d.announcements
      } else if (d.announcement?.active) {
        list = [d.announcement]
      }
      const active = list.filter(b => b.active && (b.text?.zh || b.text?.en))
      setBanners(active)
      setTrackIdx(active.length > 1 ? 1 : 0)
      if (d.announcementColor) setColor(d.announcementColor)
    })
  }, [])

  const n = banners.length
  // Infinite-loop clone technique: [last_clone, ...real, first_clone]
  const ext = n > 1 ? [banners[n - 1], ...banners, banners[0]] : banners
  const extN = ext.length

  // Dot index into real banners (0-based)
  const dotIdx = n > 1 ? ((trackIdx - 1) + n) % n : 0

  // Auto-rotate: resets whenever trackIdx changes
  useEffect(() => {
    if (n <= 1) return
    const t = setTimeout(() => {
      setTransitioning(true)
      setTrackIdx(i => i + 1)
    }, 5000)
    return () => clearTimeout(t)
  }, [trackIdx, n])

  // After slide ends, silently jump from clone to real counterpart
  function handleTransitionEnd() {
    if (n <= 1) return
    if (trackIdx === 0) {
      setTransitioning(false)
      setTrackIdx(n)           // clone of last → real last
    } else if (trackIdx === n + 1) {
      setTransitioning(false)
      setTrackIdx(1)           // clone of first → real first
    }
  }

  function go(delta) {
    setTransitioning(true)
    setTrackIdx(i => i + delta)
  }

  if (!n) return null

  const c = COLOR_MAP[color] || COLOR_MAP.yellow

  return (
    <div className={`sticky top-14 z-30 border-b ${c.bar} ${c.text}`}>
      <div className="max-w-6xl mx-auto px-3 h-12 flex items-center gap-2">
        {/* Left arrow */}
        {n > 1 && (
          <button onClick={() => go(-1)}
            className="flex-shrink-0 opacity-40 hover:opacity-80 w-7 h-7 flex items-center justify-center text-2xl leading-none">‹</button>
        )}

        {/* Sliding track */}
        <div className="flex-1 overflow-hidden h-full">
          <div
            className={`flex h-full will-change-transform ${transitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
            style={{ width: `${extN * 100}%`, transform: `translateX(-${trackIdx * (100 / extN)}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {ext.map((banner, i) => {
              const text = banner.text?.[lang] || banner.text?.zh || banner.text?.en || ''
              const btnText = banner.button?.text?.[lang] || banner.button?.text?.zh || banner.button?.text?.en
              const btnUrl = banner.button?.url
              return (
                <div key={i} className="flex items-center justify-center gap-2.5 h-full px-1"
                  style={{ width: `${100 / extN}%` }}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`}
                    style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                  <p className="text-sm font-medium">{text}</p>
                  {btnText && btnUrl && (
                    <a href={btnUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors whitespace-nowrap ${c.btn}`}>
                      {btnText}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right arrow */}
        {n > 1 && (
          <button onClick={() => go(1)}
            className="flex-shrink-0 opacity-40 hover:opacity-80 w-7 h-7 flex items-center justify-center text-2xl leading-none">›</button>
        )}

        {/* Dot indicators */}
        {n > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {banners.map((_, i) => (
              <button key={i} onClick={() => { setTransitioning(true); setTrackIdx(i + 1) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${c.dot} ${i === dotIdx ? 'opacity-100 scale-125' : 'opacity-30'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
