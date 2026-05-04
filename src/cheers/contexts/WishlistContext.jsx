import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useAuth } from './AuthContext'

const db = getFirestore(app)
const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) { setItems([]); return }
    const ref = doc(db, 'cheers_wishlists', user.uid)
    return onSnapshot(ref, (snap) => {
      setItems(snap.exists() ? (snap.data().items || []) : [])
    })
  }, [user?.uid])

  const persist = useCallback(async (next) => {
    if (!user) return
    setItems(next)
    await setDoc(doc(db, 'cheers_wishlists', user.uid), { items: next }, { merge: true })
  }, [user])

  const addToWishlist = useCallback(async (product) => {
    if (!user) return
    setItems(prev => {
      if (prev.find(i => i.productId === product.id)) return prev
      const next = [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || '',
        addedAt: Date.now(),
      }]
      setDoc(doc(db, 'cheers_wishlists', user.uid), { items: next }, { merge: true })
      return next
    })
  }, [user])

  const removeFromWishlist = useCallback(async (productId) => {
    if (!user) return
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId)
      setDoc(doc(db, 'cheers_wishlists', user.uid), { items: next }, { merge: true })
      return next
    })
  }, [user])

  const isWishlisted = useCallback((productId) =>
    items.some(i => i.productId === productId), [items])

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}
