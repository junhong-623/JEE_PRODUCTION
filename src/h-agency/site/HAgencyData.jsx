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
    const source = leaderboard.length ? leaderboard : FALLBACK_TALENTS
    return source
      .filter(talent => talent.visible !== false)
      .map(talent => ({
        ...talent,
        slug: talentSlug(talent),
        platform: talent.platform || (talent.bigoUrl ? 'BIGO LIVE' : talent.tiktokUrl ? '抖音 / TikTok' : ''),
        socialUrl: talent.socialUrl || talent.bigoUrl || talent.tiktokUrl || talent.instaUrl || '',
      }))
  }, [leaderboard])

  const featuredTalents = useMemo(() => {
    const selected = talents
      .filter(talent => talent.homeFeatured)
      .sort((a, b) => (Number(a.homePosition) || 99) - (Number(b.homePosition) || 99))
      .slice(0, 3)
    const selectedIds = new Set(selected.map(talent => talent.id))
    const remaining = talents.filter(talent => !selectedIds.has(talent.id))
    return [...selected, ...remaining].slice(0, 3)
  }, [talents])

  const value = useMemo(() => ({ talents, featuredTalents, posts, loading }), [talents, featuredTalents, posts, loading])
  return <HAgencyDataContext.Provider value={value}>{children}</HAgencyDataContext.Provider>
}

export function useHAgencyData() {
  const context = useContext(HAgencyDataContext)
  if (!context) throw new Error('useHAgencyData must be used inside HAgencyDataProvider')
  return context
}
