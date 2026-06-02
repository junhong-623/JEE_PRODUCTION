import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useAuth } from './AuthContext'
import { effectivePrice, effectivePriceFromMods, hasAdditiveModifiers } from '../lib/productPrice'
import { trackAddToCart } from '../lib/tracking'

const db = getFirestore(app)
const CartContext = createContext(null)
const LOCAL_KEY = 'cheers_cart'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

// 唯一标识一个购物车条目：新格式用 selectedMods，旧格式用 size+color
function itemMatchKey(item) {
  if (item.selectedMods != null) return JSON.stringify(item.selectedMods)
  return `${item.size ?? ''}|${item.color ?? ''}`
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const mergedRef = useRef(false)

  useEffect(() => {
    mergedRef.current = false

    if (!user) {
      setItems(loadLocal())
      return
    }

    const ref = doc(db, 'cheers_carts', user.uid)
    const localItems = loadLocal()

    const unsub = onSnapshot(ref, async (snap) => {
      const remote = snap.exists() ? (snap.data().items || []) : []

      if (!mergedRef.current && localItems.length > 0) {
        mergedRef.current = true
        const merged = [...remote]
        for (const localItem of localItems) {
          const idx = merged.findIndex(i =>
            i.productId === localItem.productId &&
            itemMatchKey(i) === itemMatchKey(localItem)
          )
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

  // selectedMods: { groupName: optionLabel } | null
  // 旧接口 addToCart(product, qty, size, color) 已废弃，现统一用 selectedMods
  const addToCart = useCallback(async (product, quantity = 1, selectedMods = null) => {
    const price = hasAdditiveModifiers(product)
      ? effectivePriceFromMods(product, selectedMods)
      : effectivePrice(product,
          selectedMods?.['color'] ?? Object.values(selectedMods || {})[0],
          selectedMods?.['size'] ?? Object.values(selectedMods || {})[1])

    trackAddToCart(product, quantity, price)

    setItems(prev => {
      const key = JSON.stringify(selectedMods)
      const idx = prev.findIndex(i =>
        i.productId === product.id &&
        itemMatchKey(i) === (selectedMods != null ? key : `|`)
      )
      let next
      if (idx >= 0) {
        next = prev.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i
        )
      } else {
        const rawName = product.name
        const name = typeof rawName === 'object' ? (rawName?.zh || rawName?.en || '') : (rawName || '')
        next = [...prev, {
          productId: product.id,
          name,
          price,
          imageUrl: product.imageUrl || '',
          quantity,
          ...(selectedMods != null ? { selectedMods } : {}),
        }]
      }
      if (user) setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      else saveLocal(next)
      return next
    })
  }, [user])

  // 接受完整 item 对象，用 itemMatchKey 精确匹配
  const removeFromCart = useCallback(async (item) => {
    setItems(prev => {
      const next = prev.filter(i =>
        !(i.productId === item.productId && itemMatchKey(i) === itemMatchKey(item))
      )
      if (user) setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      else saveLocal(next)
      return next
    })
  }, [user])

  const updateQuantity = useCallback(async (item, quantity) => {
    if (quantity < 1) return removeFromCart(item)
    setItems(prev => {
      const next = prev.map(i =>
        i.productId === item.productId && itemMatchKey(i) === itemMatchKey(item)
          ? { ...i, quantity }
          : i
      )
      if (user) setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      else saveLocal(next)
      return next
    })
  }, [user, removeFromCart])

  const updateCartItemVariant = useCallback((productId, oldSelectedMods, newSelectedMods, newPrice) => {
    setItems(prev => {
      const oldKey = JSON.stringify(oldSelectedMods)
      const newKey = JSON.stringify(newSelectedMods)
      const original = prev.find(i => i.productId === productId && itemMatchKey(i) === oldKey)
      if (!original) return prev
      const withoutOld = prev.filter(i => !(i.productId === productId && itemMatchKey(i) === oldKey))
      const existingIdx = withoutOld.findIndex(i => i.productId === productId && itemMatchKey(i) === newKey)
      let next
      if (existingIdx >= 0) {
        next = withoutOld.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + original.quantity, price: newPrice } : i
        )
      } else {
        next = [...withoutOld, { ...original, selectedMods: newSelectedMods, price: newPrice }]
      }
      if (user) setDoc(doc(db, 'cheers_carts', user.uid), { items: next }, { merge: true })
      else saveLocal(next)
      return next
    })
  }, [user])

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
    <CartContext.Provider value={{ items, totalItems, subtotal, addToCart, removeFromCart, updateQuantity, updateCartItemVariant, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
