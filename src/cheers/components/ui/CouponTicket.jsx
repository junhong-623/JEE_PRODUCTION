import React from 'react'

export function isCouponExpired(coupon) {
  if (!coupon.expiresAt) return false
  const exp = coupon.expiresAt?.toDate?.() || new Date(coupon.expiresAt)
  return exp < new Date()
}

export function isCouponEligible(coupon, subtotal) {
  if (isCouponExpired(coupon)) return false
  if (coupon.minSpend > 0 && subtotal !== undefined && subtotal < coupon.minSpend) return false
  return true
}

export function formatDiscount(coupon, lang) {
  const type = coupon.discountType || coupon.type || 'percentage'
  if (type === 'free_shipping') return lang === 'zh' ? '免运费' : 'Free Ship'
  if (type === 'fixed') return `RM ${Number(coupon.discount).toFixed(2)} OFF`
  return `${Math.round(coupon.discount * 100)}% OFF`
}

export function applyDiscount(subtotal, coupon) {
  const type = coupon.discountType || coupon.type || 'percentage'
  if (type === 'free_shipping') return subtotal
  if (type === 'fixed') return Math.max(0, subtotal - coupon.discount)
  return subtotal * (1 - coupon.discount)
}

export function computeSavings(subtotal, coupon) {
  if ((coupon.discountType || coupon.type) === 'free_shipping') return 0
  return subtotal - applyDiscount(subtotal, coupon)
}

export function findBestCoupon(coupons, subtotal) {
  const eligible = coupons.filter(c =>
    isCouponEligible(c, subtotal) &&
    (c.discountType || c.type) !== 'free_shipping'
  )
  if (!eligible.length) return null
  return eligible.reduce((best, c) =>
    computeSavings(subtotal, c) > computeSavings(subtotal, best) ? c : best
  )
}

export default function CouponTicket({ coupon, lang, subtotal }) {
  const expired = isCouponExpired(coupon)
  const shortfall = (!expired && coupon.minSpend > 0 && subtotal !== undefined && subtotal < coupon.minSpend)
    ? (coupon.minSpend - subtotal) : null
  const dim = expired || !!shortfall || coupon.used
  const discountLabel = formatDiscount(coupon, lang)
  const title = coupon.title || (lang === 'zh' ? '专属优惠' : 'Special Offer')
  const isFreeShip = (coupon.discountType || coupon.type) === 'free_shipping'

  const expiryDate = coupon.expiresAt
    ? (coupon.expiresAt?.toDate?.() || new Date(coupon.expiresAt))
    : null

  return (
    <div className={`coupon-ticket mx-3 transition-opacity ${dim ? 'opacity-50' : ''}`}>
      <div className="notch-left" />
      <div className="notch-right" />

      <div className="flex items-stretch overflow-hidden rounded-xl border border-cheers-cream/60">
        {/* Left — main info */}
        <div className="flex-1 bg-cheers-brown px-4 py-3">
          <p className="text-cheers-cream/60 text-[10px] uppercase tracking-widest mb-0.5">Cheers.co</p>
          <p className="text-cheers-cream font-serif text-sm font-semibold leading-tight">{title}</p>
          <p className={`text-cheers-cream font-bold mt-1 leading-none ${isFreeShip ? 'text-xl' : 'text-2xl'}`}>{discountLabel}</p>
          <p className="text-cheers-cream/50 text-[10px] mt-1">
            {coupon.minSpend > 0
              ? (lang === 'zh' ? `满 RM ${Number(coupon.minSpend).toFixed(2)} 可用` : `Min. RM ${Number(coupon.minSpend).toFixed(2)}`)
              : (!isFreeShip && (lang === 'zh' ? '仅限商品总额' : 'Subtotal only'))}
          </p>
        </div>

        {/* Perforation */}
        <div className="w-px flex flex-col justify-between py-2 bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 border-l-2 border-dashed border-cheers-cream mx-px" />
          ))}
        </div>

        {/* Right — code + status */}
        <div className="w-28 bg-white flex flex-col items-center justify-center px-3 py-3 gap-1">
          <p className="text-[10px] text-cheers-brown/40 uppercase tracking-widest">{lang === 'zh' ? '券码' : 'Code'}</p>
          <p className="font-mono text-sm font-bold text-cheers-brown tracking-wider text-center break-all">{coupon.code}</p>
          {expired ? (
            <span className="mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">
              {lang === 'zh' ? '已过期' : 'Expired'}
            </span>
          ) : shortfall ? (
            <span className="mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600 text-center leading-tight">
              {lang === 'zh' ? `差 RM ${shortfall.toFixed(2)}` : `+RM ${shortfall.toFixed(2)}`}
            </span>
          ) : coupon.used ? (
            <span className="mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">
              {lang === 'zh' ? '已使用' : 'Used'}
            </span>
          ) : (
            <span className="mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
              {lang === 'zh' ? '可使用' : 'Active'}
            </span>
          )}
          {expiryDate && !expired && (
            <p className="text-[9px] text-cheers-brown/30 text-center mt-0.5">
              {lang === 'zh' ? '至' : 'Until'}{' '}
              {expiryDate.toLocaleDateString('zh-MY', { month: 'numeric', day: 'numeric' })}
            </p>
          )}
          {coupon.rank && <p className="text-[9px] text-cheers-brown/30">#{coupon.rank}</p>}
        </div>
      </div>
    </div>
  )
}
