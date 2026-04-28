import { useState, useEffect } from 'react'

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getProduct, getCategories } from '../services/firestore'
import { useMall } from '../contexts/MallContext'
import { useMallLang } from '../hooks/useMallLang'
import MallNav from '../components/MallNav'
import CartDrawer from '../components/CartDrawer'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, setCartOpen, config } = useMall()
  const { lang, mt } = useMallLang()

  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedDesign, setSelectedDesign] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [showPop, setShowPop] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([getProduct(id), getCategories()]).then(([prod, cats]) => {
      setProduct(prod)
      if (prod?.categoryId) setCategory(cats.find(c => c.id === prod.categoryId) || null)
      setLoading(false)
    })
  }, [id])

  const sizes = product?.variants?.sizes?.filter(Boolean) || []
  const designs = product?.variants?.designs?.filter(Boolean) || []
  const needsSize = sizes.length > 0
  const needsDesign = designs.length > 0
  const canAdd = (!needsSize || selectedSize) && (!needsDesign || selectedDesign)

  function handleAddToCart() {
    if (!canAdd) return
    addToCart(product, qty, selectedSize, selectedDesign)
    setAdded(true)
    setShowPop(true)
    setTimeout(() => setAdded(false), 2200)
    setTimeout(() => setShowPop(false), 800)
  }

  function handleDisabledClick() {
    const missing = []
    if (needsSize && !selectedSize) missing.push(mt('size'))
    if (needsDesign && !selectedDesign) missing.push(mt('designColor'))
    if (!missing.length) return
    setToast(`Please select: ${missing.join(' & ')}`)
    setTimeout(() => setToast(''), 2800)
  }

  if (loading) return (
    <div className="mall-root">
      <MallNav />
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--mall-stone-soft)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div>
        {mt('loading')}
      </div>
      <CartDrawer />
    </div>
  )

  if (!product) return (
    <div className="mall-root">
      <MallNav />
      <div className="mall-empty" style={{ marginTop: 60 }}>
        <div className="mall-empty-icon">😕</div>
        <div className="mall-empty-text">{mt('productNotFound')}</div>
        <button style={{ marginTop: 16, color: 'var(--mall-ember)', fontWeight: 700 }} onClick={() => navigate('/mall')}>
          {mt('backToShop')}
        </button>
      </div>
      <CartDrawer />
    </div>
  )

  const images = product.images?.filter(Boolean) || []
  const displayName = (lang === 'zh' && product.nameZh) ? product.nameZh : product.name
  const displayDesc = (lang === 'zh' && product.descriptionZh) ? product.descriptionZh : product.description
  const catName = (lang === 'zh' && category?.nameZh) ? category.nameZh : category?.name

  const productName = lang === 'zh' ? (product.nameZh || product.name) : product.name
  const productDesc = lang === 'zh' ? (product.descriptionZh || product.description) : product.description
  const storeName = lang === 'zh' ? (config.storeNameZh || 'JeeProd 商城') : (config.storeName || 'JeeProd Mall')
  const metaTitle = `${productName} — ${storeName}`
  const metaDesc = productDesc?.replace(/<[^>]+>/g, '').slice(0, 160) || metaTitle
  const metaImage = product.images?.[0] || 'https://www.jeeprod.com/mall/screenshot/shop.webp'

  return (
    <div className="mall-root">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={`https://www.jeeprod.com/mall/product/${product.id}`} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:type" content="product" />
        <link rel="canonical" href={`https://www.jeeprod.com/mall/product/${product.id}`} />
      </Helmet>
      <MallNav />

      <div className="mall-product-page">
        <button className="mall-back-btn" onClick={() => navigate('/mall')}>
          {mt('backToShop')}
        </button>

        <div className="mall-product-layout">
          {/* Gallery */}
          <div className="mall-gallery">
            <div className="mall-gallery-main">
              {images.length > 0
                ? <img src={images[activeImg]} alt={displayName} />
                : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🛍️</div>}
            </div>
            {images.length > 1 && (
              <div className="mall-gallery-thumbs">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`mall-gallery-thumb ${i === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="mall-product-detail">
            {category && <div className="mall-detail-category">{category.image} {catName}</div>}
            <h1 className="mall-detail-name">{displayName}</h1>

            <div className="mall-detail-price-row">
              <span className={`mall-detail-price ${!product.onSale ? 'regular' : ''}`}>
                RM {Number(product.price).toFixed(2)}
              </span>
              {product.onSale && product.originalPrice > product.price && (
                <span className="mall-detail-orig-price">RM {Number(product.originalPrice).toFixed(2)}</span>
              )}
              {product.onSale && product.promoLabel && (
                <span className="mall-detail-promo-badge">{product.promoLabel}</span>
              )}
            </div>

            {displayDesc && (
              <p className="mall-detail-desc">{displayDesc}</p>
            )}

            {needsSize && (
              <div>
                <div className="mall-variant-label">
                  {mt('size')}
                  {!selectedSize && <span style={{ color: 'var(--mall-ember)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> {mt('selectOne')}</span>}
                </div>
                <div className="mall-variant-chips">
                  {sizes.map(s => (
                    <button
                      key={s}
                      className={`mall-variant-chip ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {needsDesign && (
              <div>
                <div className="mall-variant-label">
                  {mt('designColor')}
                  {!selectedDesign && <span style={{ color: 'var(--mall-ember)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> {mt('selectOne')}</span>}
                </div>
                <div className="mall-variant-chips">
                  {designs.map(d => (
                    <button
                      key={d}
                      className={`mall-variant-chip ${selectedDesign === d ? 'active' : ''}`}
                      onClick={() => setSelectedDesign(selectedDesign === d ? '' : d)}
                    >{d}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mall-variant-label">{mt('quantity')}</div>
              <div className="mall-qty-row">
                <div className="mall-qty-ctrl mall-qty-ctrl-large">
                  <button className="mall-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="mall-qty-val">{qty}</span>
                  <button className="mall-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="mall-cart-pop-wrap" onClick={!canAdd ? handleDisabledClick : undefined}>
              {toast && <div className="mall-add-toast">{toast}</div>}
              {showPop && <span className="mall-cart-pop-icon">🛒</span>}
              <button
                className={`mall-add-cart-btn${canAdd && !added ? ' can-add' : ''}`}
                onClick={handleAddToCart}
                disabled={!canAdd}
              >
                {added ? `✓ ${mt('addedToCart')}` : mt('addToCart')}
              </button>
            </div>
          </div>
        </div>

        {/* Content blocks */}
        {product.content?.length > 0 && (
          <div className="mall-content-section">
            <div className="mall-content-section-title">{mt('aboutProduct')}</div>
            {product.content.map((block, i) => (
              <div key={i} className="mall-content-block">
                {block.type === 'text' && <p className="mall-content-text">{block.value}</p>}
                {block.type === 'image' && block.value && (
                  <img src={block.value} alt="" className="mall-content-img" />
                )}
                {block.type === 'link' && block.value && (
                  <a href={block.value} target="_blank" rel="noopener noreferrer" className="mall-content-link">
                    🔗 {block.label || block.value}
                  </a>
                )}
                {block.type === 'youtube' && getYouTubeId(block.value) && (
                  <div className="mall-content-yt">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(block.value)}`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mall-footer">
        <div className="mall-footer-copy">© {new Date().getFullYear()} JeeProd Mall · Powered by jeeprod.com</div>
      </footer>

      <CartDrawer />
    </div>
  )
}
