import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const COLOR_MAP = {
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  blue:   'bg-blue-100 text-blue-800',
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
}

export default function AnnouncementBanner() {
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      const ann = snap.data()?.announcement
      if (ann?.active && (ann.text?.zh || ann.text?.en)) {
        const key = `ann_${ann.text?.zh || ann.text?.en}`
        if (localStorage.getItem(key)) { setDismissed(true); return }
        setData({ ...ann, _key: key })
      }
    })
  }, [])

  if (!data || dismissed) return null

  const text = data.text?.[lang] || data.text?.zh || data.text?.en || ''
  const colors = COLOR_MAP[data.color] || COLOR_MAP.yellow

  return (
    <div className={`w-full px-4 py-2 text-sm font-medium text-center flex items-center justify-center gap-3 ${colors}`}>
      <span>{text}</span>
      <button onClick={() => { localStorage.setItem(data._key, '1'); setDismissed(true) }}
        className="opacity-50 hover:opacity-100 text-base leading-none flex-shrink-0">×</button>
    </div>
  )
}
