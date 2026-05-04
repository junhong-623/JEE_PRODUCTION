import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'

const db = getFirestore(app)

export default function PolicyPage({ type }) {
  const { t, lang } = useLang()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'policies')).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setContent(data[type]?.[lang] || data[type]?.zh || '')
      }
    }).finally(() => setLoading(false))
  }, [type, lang])

  const titles = { tos: t('policy.tos'), privacy: t('policy.privacy'), refund: t('policy.refund') }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl text-cheers-dark-brown mb-8">{titles[type]}</h1>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-cheers-cream/60 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      ) : content ? (
        <div className="prose prose-stone max-w-none text-cheers-dark-brown/80 leading-relaxed whitespace-pre-line">
          {content}
        </div>
      ) : (
        <p className="text-cheers-brown/50">{lang === 'zh' ? '内容即将更新' : 'Content coming soon'}</p>
      )}
    </div>
  )
}
