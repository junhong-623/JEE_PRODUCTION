// 颜色+尺寸价格工具：支持每个颜色独立定价，每个颜色的尺寸也可独立定价

function parsePrice(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// 取某个颜色下可用的尺寸列表（来自 color.sizes 新格式）
export function getColorSizes(product, colorLabel) {
  if (!colorLabel || !product?.colors) return []
  const c = product.colors.find(c => c.label === colorLabel)
  return c?.sizes ?? []
}

// 取有效价格：颜色+尺寸价格 > 颜色价格 > 主价格
export function effectivePrice(product, colorLabel, sizeLabel) {
  const base = Number(product?.price) || 0
  if (!colorLabel || !product?.colors) return base
  const c = product.colors.find(c => c.label === colorLabel)
  if (!c) return base
  if (sizeLabel && Array.isArray(c.sizes)) {
    const s = c.sizes.find(s => s.label === sizeLabel)
    const sp = parsePrice(s?.price)
    if (sp !== null) return sp
  }
  return parsePrice(c?.price) ?? base
}

// 取价格范围，涵盖所有颜色×尺寸组合
export function priceRange(product) {
  const base = Number(product?.price) || 0
  const colors = product?.colors || []
  if (!colors.length) return { min: base, max: base, isRange: false }
  const all = []
  for (const c of colors) {
    if (Array.isArray(c.sizes) && c.sizes.length) {
      for (const s of c.sizes) all.push(parsePrice(s.price) ?? parsePrice(c.price) ?? base)
    } else {
      all.push(parsePrice(c.price) ?? base)
    }
  }
  if (!all.length) return { min: base, max: base, isRange: false }
  const min = Math.min(...all)
  const max = Math.max(...all)
  return { min, max, isRange: min !== max }
}

// 格式化展示（列表卡片、详情页未选颜色/尺寸时）
export function formatPriceDisplay(product, rmPrefix = 'RM') {
  const { min, max, isRange } = priceRange(product)
  if (isRange) return `${rmPrefix} ${min.toFixed(2)} - ${max.toFixed(2)}`
  return `${rmPrefix} ${min.toFixed(2)}`
}
