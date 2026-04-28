import { createContext, useContext, useState, useEffect } from 'react'
import { getMallConfig } from '../services/firestore'

const MallContext = createContext(null)

export function MallProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mall_cart') || '[]') } catch { return [] }
  })
  const [config, setConfig] = useState({
    whatsapp: '', email: '', storeName: 'JeeProd Mall', tagline: 'jeeprod.com',
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    getMallConfig().then(c => { setConfig(c); setConfigLoading(false) })
  }, [])

  useEffect(() => {
    localStorage.setItem('mall_cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product, qty, size, design) {
    const key = `${product.id}__${size || 'none'}__${design || 'none'}`
    setCart(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
      return [...prev, {
        key,
        productId: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.onSale ? product.price : product.price,
        originalPrice: product.originalPrice || product.price,
        onSale: !!product.onSale,
        qty,
        size: size || '',
        design: design || '',
      }]
    })
  }

  function updateQty(key, qty) {
    if (qty < 1) return removeFromCart(key)
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  }

  function removeFromCart(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  function clearCart() { setCart([]) }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <MallContext.Provider value={{
      cart, config, configLoading,
      cartOpen, setCartOpen,
      addToCart, updateQty, removeFromCart, clearCart,
      total, itemCount,
    }}>
      {children}
    </MallContext.Provider>
  )
}

export const useMall = () => useContext(MallContext)
