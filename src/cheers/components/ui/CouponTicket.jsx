import React from 'react'

export function formatDiscount(coupon, lang) {
  const type = coupon.discountType || coupon.type || 'percentage'
  if (type === 'fixed') return `RM ${Number(coupon.discount).toFixed(2)} OFF`
  return `${Math.round(coupon.discount * 100)}% OFF`
}

export function applyDiscount(subtotal, coupon) {
  const type = coupon.discountType || coupon.type || 'percentage'
  if (type === 'fixed') return Math.max(0, subtotal - coupon.discount)
  return subtotal * (1 - coupon.discount)
}

export function computeSavings(subtotal, coupon) {
  return subtotal - applyDiscount(subtotal, coupon)
}

export function findBestCoupon(coupons, subtotal) {
  if (!coupons.length) return null
  return coupons.reduce((best, c) => {
    return computeSavings(subtotal, c) > computeSavings(subtotal, best) ? c : best
  })
}

export default function CouponTicket({ coupon, lang, dim = false }) {
  const discountLabel = formatDiscount(coupon, lang)
  const title = coupon.title || (lang === 'zh' ? '专属优惠' : 'Special Offer')

  return (
    <div className={`coupon-ticket mx-3 transition-opacity ${dim ? 'opacity-50' : ''}`}>
      <div className="notch-left" />
      <div className="notch-right" />

      <div className="flex items-stretch overflow-hidden rounded-xl border border-cheers-cream/60">
        {/* Left — main info */}
        <div className="flex-1 bg-cheers-brown px-4 py-3">
          <p className="text-cheers-cream/60 text-[10px] uppercase tracking-widest mb-0.5">Cheers.co</p>
          <p className="text-cheers-cream font-serif text-sm font-semibold leading-tight">{title}</p>
          <p className="text-cheers-cream text-2xl font-bold mt-1 leading-none">{discountLabel}</p>
          <p className="text-cheers-cream/50 text-[10px] mt-1">
            {lang === 'zh' ? '仅限商品总额' : 'Subtotal only'}
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
          <span className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${coupon.used ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}>
            {coupon.used ? (lang === 'zh' ? '已使用' : 'Used') : (lang === 'zh' ? '可使用' : 'Active')}
          </span>
          {coupon.rank && <p className="text-[9px] text-cheers-brown/30">#{coupon.rank}</p>}
        </div>
      </div>
    </div>
  )
}
