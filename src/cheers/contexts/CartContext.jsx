import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  // useRef instead of useState so the flag is never stale inside the onSnapshot closure
  const mergedRef = useRef(false)

  // Load from Firestore when logged in, merge local cart
  useEffect(() => {
    mergedRef.current = false  // reset on every user change

    if (!user) {
      setItems(loadLocal())
      return
    }

    const ref = doc(db, 'cheers_carts', user.uid)
    const localItems = loadLocal()

    const unsub = onSnapshot(ref, async (snap) => {
      const remote = snap.exists() ? (snap.data().items || []) : []

      if (!mergedRef.current && localItems.length > 0) {
        // Set flag BEFORE the async write to block any re-entrant snapshot
        mergedRef.current = true
        const merged = [...remote]
        for (const localItem of localItems) {
          const idx = merged.findIndex(i => i.productId === localItem.productId && i.size === localItem.size && i.color === localItem.color)
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + localItem.quantity }
          } else {
            merged.push(localItem)
          }
        }
        saveLocal([])
        await setDoc(ref, { items: merged }, { merge: true })
        setItems(merged)
      } else {
        mergedRef.current = true
        setItems(remote)
      }
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

  const addToCart = useCallback(async (product, quantity = 1, size = undefined, color = undefined) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id && i.size === size && i.color === color)
      let next
      if (idx >= 0) {
        next = prev.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i
        )
      } else {
        const rawName = product.name
        const name = typeof rawName === 'object' ? (rawName?.zh || rawName?.en || '') : (rawName || '')
        // 颜色价格快照：选了颜色且该颜色有独立价格时用颜色价，否则用主价
        let price = product.price
        if (color !== undefined && Array.isArray(product.colors)) {
          const c = product.colors.find(c => c.label === color)
          const colorPrice = c?.price
          if (colorPrice !== null && colorPrice !== undefined && !isNaN(Number(colorPrice)) && Number(colorPrice) > 0) {
            price = Number(colorPrice)
          }
        }
        next = [...prev, {
          productId: product.id,
          name,
          price,
          imageUrl: product.imageUrl || '',
          quantity,
          ...(size !== undefined && { size }),
          ...(color !== undefined && { color }),
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

  const removeFromCart = useCallback(async (productId, size = undefined, color = undefined) => {
    setItems(prev => {
      const next = prev.filter(i => !(i.productId === productId && i.size === size && i.color === color))
      if (user) {
        setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      } else {
        saveLocal(next)
      }
      return next
    })
  }, [user])

  const updateQuantity = useCallback(async (productId, quantity, size = undefined, color = undefined) => {
    if (quantity < 1) return removeFromCart(productId, size, color)
    setItems(prev => {
      const next = prev.map(i => i.productId === productId && i.size === size && i.color === color ? { ...i, quantity } : i)
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
