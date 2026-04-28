import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMall } from '../contexts/MallContext'
import { useMallLang } from '../hooks/useMallLang'
import { onCategories, onProducts } from '../services/firestore'
import CartDrawer from '../components/CartDrawer'
import MallNav from '../components/MallNav'

export default function ShopPage() {
  const { config } = useMall()
  const { lang, mt } = useMallLang()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub1 = onCategories(cats => setCategories(cats.filter(c => c.visible !== false)))
    const unsub2 = onProducts(prods => setProducts(prods.filter(p => p.visible !== false)))
    return () => { unsub1(); unsub2() }
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (activeCat !== 'all') list = list.filter(p => p.categoryId === activeCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.nameZh?.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeCat, search])

  const storeName = lang === 'zh' ? (config.storeNameZh || 'JeeProd 商城') : (config.storeName || mt('storeName'))
  const metaTitle = 'JeeProd Mall — Curated Products, WhatsApp Ordering'
  const metaDesc = 'Shop JeeProd Mall — handpicked quality products with easy WhatsApp ordering and real-time order tracking. Based in Malaysia.'

  return (
    <div className="mall-root">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content="https://www.jeeprod.com/mall" />
        <meta property="og:image" content="https://www.jeeprod.com/mall/screenshot/shop.webp" />
        <link rel="canonical" href="https://www.jeeprod.com/mall" />
      </Helmet>
      <MallNav search={search} onSearch={setSearch} />

      {/* Mobile search */}
      <div className="mall-mobile-search">
        <div className="mall-mobile-search-inner">
          <span>🔍</span>
          <input
            placeholder={mt('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Hero */}
      {!search && (
        <div className="mall-hero">
          {/* Floating campfire embers */}
          <span className="mall-hero-ember" style={{ left:'15%', '--dur':'3.2s', '--del':'0s',   '--drift':'12px'  }} />
          <span className="mall-hero-ember" style={{ left:'28%', '--dur':'4.1s', '--del':'0.7s', '--drift':'-18px' }} />
          <span className="mall-hero-ember" style={{ left:'45%', '--dur':'3.7s', '--del':'1.4s', '--drift':'8px'   }} />
          <span className="mall-hero-ember" style={{ left:'62%', '--dur':'2.9s', '--del':'0.3s', '--drift':'-10px' }} />
          <span className="mall-hero-ember" style={{ left:'78%', '--dur':'4.4s', '--del':'1.1s', '--drift':'20px'  }} />
          <span className="mall-hero-ember" style={{ left:'88%', '--dur':'3.5s', '--del':'0.5s', '--drift':'-14px' }} />

          <div className="mall-hero-inner">
            <div className="mall-hero-badge">🔥 {mt('newArrivals')}</div>
            <h1 className="mall-hero-title">
              {storeName}<br />
              <span>{config.tagline || 'jeeprod.com'}</span>
            </h1>
            <p className="mall-hero-sub">{mt('heroSub')}</p>
            <button
              className="mall-hero-cta"
              onClick={() => document.getElementById('mall-products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {mt('shopNow')} →
            </button>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="mall-cats-wrap">
        <div className="mall-cats">
          <button
            className={`mall-cat-btn ${activeCat === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCat('all')}
          >
            {mt('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`mall-cat-btn ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.image && <span className="mall-cat-btn-icon">{cat.image}</span>}
              {(lang === 'zh' && cat.nameZh) ? cat.nameZh : cat.name}
              {cat.promoLabel && <span className="mall-cat-promo-dot" />}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="mall-shop-body" id="mall-products">
        <div className="mall-section-header">
          <h2 className="mall-section-title">
            {activeCat === 'all'
              ? (search ? `${mt('results')} "${search}"` : mt('allProducts'))
              : (() => {
                  const cat = categories.find(c => c.id === activeCat)
                  return (lang === 'zh' && cat?.nameZh) ? cat.nameZh : (cat?.name || mt('allProducts'))
                })()}
          </h2>
          <span className="mall-section-count">
            {filtered.length} {filtered.length === 1 ? mt('item') : mt('items')}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="mall-empty">
            <div className="mall-empty-icon">🛍️</div>
            <div className="mall-empty-text">{mt('noGearFound')}</div>
          </div>
        ) : (
          <div className="mall-product-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} lang={lang} mt={mt} onClick={() => navigate(`/mall/product/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      <footer className="mall-footer">
        <div className="mall-footer-brand">
          <img src="/logo.svg" alt="JeeProd" style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
          {storeName}
        </div>
        <div className="mall-footer-links">
          <a href="/mall/cart">{mt('cart')}</a>
          {config.whatsapp && (
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          )}
          {config.email && (
            <a href={`mailto:${config.email}`}>Email</a>
          )}
          <a href="/">jeeprod.com</a>
        </div>
        <div className="mall-footer-copy">© {new Date().getFullYear()} {storeName} · Powered by jeeprod.com</div>
      </footer>

      <CartDrawer />
    </div>
  )
}

function ProductCard({ product, lang, mt, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  const img = product.images?.[0]
  const displayName = (lang === 'zh' && product.nameZh) ? product.nameZh : product.name

  return (
    <div className="mall-product-card" onClick={onClick}>
      <div className="mall-product-img-wrap">
        {img && !imgErr
          ? <img src={img} alt={displayName} onError={() => setImgErr(true)} />
          : <div className="mall-product-img-placeholder">🛍️</div>}
        {product.onSale && (
          <div className="mall-product-promo-badge">{product.promoLabel || 'SALE'}</div>
        )}
      </div>
      <div className="mall-product-info">
        <div className="mall-product-name">{displayName}</div>
        <div className="mall-product-price-row">
          <span className={`mall-product-price ${!product.onSale ? 'regular' : ''}`}>
            RM {Number(product.price).toFixed(2)}
          </span>
          {product.onSale && product.originalPrice > product.price && (
            <span className="mall-product-orig-price">RM {Number(product.originalPrice).toFixed(2)}</span>
          )}
        </div>
        <div className="mall-product-card-btn">{mt('viewDetails')}</div>
      </div>
    </div>
  )
}
