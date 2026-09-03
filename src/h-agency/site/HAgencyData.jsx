import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FALLBACK_TALENTS } from './content'

const HAgencyDataContext = createContext(null)

function talentSlug(talent) {
  return talent.slug || talent.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || talent.id
}

export function HAgencyDataProvider({ children }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      getDocs(query(collection(db, 'hagency_leaderboard'), orderBy('order', 'asc'))),
      getDocs(query(collection(db, 'hagency_posts'), orderBy('createdAt', 'desc'))),
    ]).then(([talentSnap, postSnap]) => {
      if (!active) return
      setLeaderboard(talentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setPosts(postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const talents = useMemo(() => {
    const knownNames = new Set(FALLBACK_TALENTS.flatMap(t => [t.nameZh, t.nameEn].filter(Boolean).map(name => name.toLowerCase())))
    const additional = leaderboard.filter(talent => {
      const names = [talent.nameZh, talent.nameEn].filter(Boolean).map(name => name.toLowerCase())
      return !names.some(name => knownNames.has(name))
    })
    return [...FALLBACK_TALENTS, ...additional].map(talent => ({ ...talent, slug: talentSlug(talent) }))
  }, [leaderboard])

  const value = useMemo(() => ({ talents, posts, loading }), [talents, posts, loading])
  return <HAgencyDataContext.Provider value={value}>{children}</HAgencyDataContext.Provider>
}

export function useHAgencyData() {
  const context = useContext(HAgencyDataContext)
  if (!context) throw new Error('useHAgencyData must be used inside HAgencyDataProvider')
  return context
}
