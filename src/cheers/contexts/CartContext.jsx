import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useAuth } from './AuthContext'

const db = getFirestore(app)
const CartContext = createContext(null)
const LOCAL_KEY = 'cheers_cart'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [synced, setSynced] = useState(false)

  // Load from Firestore when logged in, merge local cart
  useEffect(() => {
    if (!user) {
      setItems(loadLocal())
      setSynced(true)
      return
    }

    const ref = doc(db, 'cheers_carts', user.uid)
    const localItems = loadLocal()

    const unsub = onSnapshot(ref, async (snap) => {
      const remote = snap.exists() ? (snap.data().items || []) : []

      if (!synced && localItems.length > 0) {
        // Merge: add local items not in remote
        const merged = [...remote]
        for (const localItem of localItems) {
          const idx = merged.findIndex(i => i.productId === localItem.productId)
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + localItem.quantity }
          } else {
            merged.push(localItem)
          }
        }
        await setDoc(ref, { items: merged }, { merge: true })
        saveLocal([])
        setItems(merged)
      } else {
        setItems(remote)
      }
      setSynced(true)
    })

    return unsub
  }, [user?.uid])

  const persist = useCallback(async (newItems) => {
    setItems(newItems)
    if (user) {
      await setDoc(doc(db, 'cheers_carts', user.uid), { items: newItems }, { merge: true })
    } else {
      saveLocal(newItems)
    }
  }, [user])

  const addToCart = useCallback(async (product, quantity = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id)
      let next
      if (idx >= 0) {
        next = prev.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i
        )
      } else {
        next = [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || '',
          quantity,
        }]
      }
      if (user) {
        setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      } else {
        saveLocal(next)
      }
      return next
    })
  }, [user])

  const removeFromCart = useCallback(async (productId) => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId)
      if (user) {
        setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      } else {
        saveLocal(next)
      }
      return next
    })
  }, [user])

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId)
    setItems(prev => {
      const next = prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      if (user) {
        setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      } else {
        saveLocal(next)
      }
      return next
    })
  }, [user, removeFromCart])

  const clearCart = useCallback(async () => {
    setItems([])
    if (user) {
      await setDoc(doc(db, 'cheers_carts', user.uid), { items: [] }, { merge: true })
    } else {
      saveLocal([])
    }
  }, [user])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalItems, subtotal, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
