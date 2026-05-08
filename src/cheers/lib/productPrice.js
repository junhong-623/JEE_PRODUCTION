// 颜色价格工具：支持每个颜色独立定价，未填则回落主价格

function parsePrice(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// 取某个颜色的有效价格（颜色价格优先，否则回落主价格）
export function effectivePrice(product, colorLabel) {
  const base = Number(product?.price) || 0
  if (!colorLabel || !product?.colors) return base
  const c = product.colors.find(c => c.label === colorLabel)
  return parsePrice(c?.price) ?? base
}

// 取价格范围。包含：所有颜色的「有效价」（颜色价或回落到主价）。
// 如果没有颜色，就是单一主价。
export function priceRange(product) {
  const base = Number(product?.price) || 0
  const colors = product?.colors || []
  if (!colors.length) return { min: base, max: base, isRange: false }
  const all = colors.map(c => parsePrice(c.price) ?? base)
  const min = Math.min(...all)
  const max = Math.max(...all)
  return { min, max, isRange: min !== max }
}

// 格式化展示：统一使用此函数（列表卡片、详情页未选颜色时）
export function formatPriceDisplay(product, rmPrefix = 'RM') {
  const { min, max, isRange } = priceRange(product)
  if (isRange) return `${rmPrefix} ${min.toFixed(2)} - ${max.toFixed(2)}`
  return `${rmPrefix} ${min.toFixed(2)}`
}
