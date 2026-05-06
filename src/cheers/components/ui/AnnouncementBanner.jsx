import React, { useEffect, useState, useRef } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const COLOR_MAP = {
  yellow: { bar: 'bg-amber-50 border-amber-200',  text: 'text-amber-900',  dot: 'bg-amber-400' },
  orange: { bar: 'bg-orange-50 border-orange-200', text: 'text-orange-900', dot: 'bg-orange-400' },
  blue:   { bar: 'bg-blue-50 border-blue-200',     text: 'text-blue-900',   dot: 'bg-blue-400'   },
  green:  { bar: 'bg-green-50 border-green-200',   text: 'text-green-900',  dot: 'bg-green-500'  },
  red:    { bar: 'bg-red-50 border-red-200',        text: 'text-red-900',    dot: 'bg-red-400'    },
}

export default function AnnouncementBanner() {
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const trackRef = useRef(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      const ann = snap.data()?.announcement
      if (ann?.active && (ann.text?.zh || ann.text?.en)) {
        setData(ann)
      }
    })
  }, [])

  // Detect overflow to decide whether to scroll
  useEffect(() => {
    if (!trackRef.current || !data) return
    const el = trackRef.current
    setNeedsMarquee(el.scrollWidth > el.parentElement?.clientWidth * 1.5)
  }, [data, lang])

  if (!data || dismissed) return null

  const text = data.text?.[lang] || data.text?.zh || data.text?.en || ''
  const c = COLOR_MAP[data.color] || COLOR_MAP.yellow

  return (
    <div className={`sticky top-14 z-30 border-b ${c.bar} ${c.text}`}>
      <div className="max-w-6xl mx-auto px-10 h-9 flex items-center overflow-hidden relative">
        {/* Animated dot */}
        <span className={`absolute left-4 w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`}
          style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />

        {/* Text area */}
        <div className="flex-1 overflow-hidden mx-1">
          {needsMarquee ? (
            <div className="flex whitespace-nowrap animate-marquee" ref={trackRef}>
              <span className="text-xs font-medium pr-20">{text}</span>
              <span className="text-xs font-medium pr-20" aria-hidden="true">{text}</span>
            </div>
          ) : (
            <p ref={trackRef} className="text-xs font-medium text-center truncate">{text}</p>
          )}
        </div>

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)}
          className="absolute right-3 opacity-40 hover:opacity-80 text-base leading-none flex-shrink-0">×</button>
      </div>
    </div>
  )
}
