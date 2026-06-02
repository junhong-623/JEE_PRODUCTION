// 商品规格价格工具
// 支持三种格式：
//   A. 加法格式（新）：modifiers[].options[].priceDelta
//   B. 矩阵格式（旧新）：modifiers[0].options[].variants[]
//   C. 旧格式：colors[].sizes[]

function parsePrice(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseDelta(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ─── 格式检测 ─────────────────────────────────────────────────────────────────

function hasModifiers(product) {
  return Array.isArray(product?.modifiers) && product.modifiers.length > 0
}

// 判断是否为加法定价格式（选项上有 priceDelta 字段）
export function hasAdditiveModifiers(product) {
  if (!hasModifiers(product)) return false
  const firstOpt = product.modifiers[0]?.options?.[0]
  return firstOpt !== undefined && 'priceDelta' in firstOpt
}

// ─── 加法定价 API ─────────────────────────────────────────────────────────────

// selectedMods: { groupName: selectedOptionLabel }
// 最终价格 = 基础价 + 各已选选项 priceDelta 之和
export function effectivePriceFromMods(product, selectedMods) {
  const base = Number(product?.price) || 0
  if (!selectedMods || !hasAdditiveModifiers(product)) return base
  let total = base
  for (const mod of product.modifiers) {
    const label = selectedMods[mod.name]
    if (!label) continue
    const opt = mod.options?.find(o => o.label === label)
    if (opt) total += parseDelta(opt.priceDelta)
  }
  return Math.max(0, total)
}

// 加法定价下的价格范围（min = 每组最小加价之和, max = 每组最大加价之和）
export function priceRangeAdditive(product) {
  const base = Number(product?.price) || 0
  if (!hasAdditiveModifiers(product)) return { min: base, max: base, isRange: false }
  let minDelta = 0, maxDelta = 0
  for (const mod of product.modifiers) {
    if (!mod.options?.length) continue
    const deltas = mod.options.map(o => parseDelta(o.priceDelta))
    minDelta += Math.min(...deltas)
    maxDelta += Math.max(...deltas)
  }
  const min = Math.max(0, base + minDelta)
  const max = Math.max(0, base + maxDelta)
  return { min, max, isRange: min !== max }
}

// ─── 旧格式 API（向后兼容） ────────────────────────────────────────────────────

function getMod1Options(product) {
  return product.modifiers?.[0]?.options || []
}

export function getModifier1Options(product) {
  if (hasModifiers(product)) return getMod1Options(product)
  return product?.colors || []
}

export function getModifier2Options(product, mod1Label) {
  if (hasModifiers(product)) {
    return (product.modifiers[1]?.options || [])
  }
  if (!mod1Label || !product?.colors) return []
  const c = product.colors.find(c => c.label === mod1Label)
  return c?.sizes ?? []
}

export function getColorSizes(product, colorLabel) {
  return getModifier2Options(product, colorLabel)
}

// 旧格式有效价格（mod1+mod2 组合价 > mod1 价 > 基础价）
export function effectivePrice(product, mod1Label, mod2Label) {
  const base = Number(product?.price) || 0
  if (!mod1Label) return base

  if (hasModifiers(product)) {
    const opt = getMod1Options(product).find(o => o.label === mod1Label)
    if (!opt) return base
    if (mod2Label && Array.isArray(opt.variants)) {
      const v = opt.variants.find(v => v.label === mod2Label)
      const vp = parsePrice(v?.price)
      if (vp !== null) return vp
    }
    return parsePrice(opt.price) ?? base
  }

  if (!product?.colors) return base
  const c = product.colors.find(c => c.label === mod1Label)
  if (!c) return base
  if (mod2Label && Array.isArray(c.sizes)) {
    const s = c.sizes.find(s => s.label === mod2Label)
    const sp = parsePrice(s?.price)
    if (sp !== null) return sp
  }
  return parsePrice(c?.price) ?? base
}

export function effectiveCostPrice(product, mod1Label, mod2Label) {
  const base = parsePrice(product?.costPrice) ?? null
  if (!mod1Label) return base

  if (hasModifiers(product)) {
    const opt = getMod1Options(product).find(o => o.label === mod1Label)
    if (!opt) return base
    if (mod2Label && Array.isArray(opt.variants)) {
      const v = opt.variants.find(v => v.label === mod2Label)
      const vp = parsePrice(v?.costPrice)
      if (vp !== null) return vp
    }
    return parsePrice(opt.costPrice) ?? base
  }

  if (!product?.colors) return base
  const c = product.colors.find(c => c.label === mod1Label)
  if (!c) return base
  if (mod2Label && Array.isArray(c.sizes)) {
    const s = c.sizes.find(s => s.label === mod2Label)
    const sp = parsePrice(s?.costPrice)
    if (sp !== null) return sp
  }
  return parsePrice(c?.costPrice) ?? base
}

// 全局价格范围（自动检测格式）
export function priceRange(product) {
  if (hasAdditiveModifiers(product)) return priceRangeAdditive(product)

  const base = Number(product?.price) || 0

  if (hasModifiers(product)) {
    const opts = getMod1Options(product)
    if (!opts.length) return { min: base, max: base, isRange: false }
    const all = []
    for (const opt of opts) {
      if (Array.isArray(opt.variants) && opt.variants.length) {
        for (const v of opt.variants) all.push(parsePrice(v.price) ?? parsePrice(opt.price) ?? base)
      } else {
        all.push(parsePrice(opt.price) ?? base)
      }
    }
    if (!all.length) return { min: base, max: base, isRange: false }
    const min = Math.min(...all), max = Math.max(...all)
    return { min, max, isRange: min !== max }
  }

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
  const min = Math.min(...all), max = Math.max(...all)
  return { min, max, isRange: min !== max }
}

export function colorPriceRange(product, mod1Label) {
  const base = Number(product?.price) || 0

  if (hasModifiers(product)) {
    const opt = getMod1Options(product).find(o => o.label === mod1Label)
    if (!opt) return { min: base, max: base, isRange: false }
    const optPrice = parsePrice(opt.price) ?? base
    if (!Array.isArray(opt.variants) || !opt.variants.length) {
      return { min: optPrice, max: optPrice, isRange: false }
    }
    const all = opt.variants.map(v => parsePrice(v.price) ?? optPrice)
    const min = Math.min(...all), max = Math.max(...all)
    return { min, max, isRange: min !== max }
  }

  const c = product?.colors?.find(c => c.label === mod1Label)
  if (!c) return { min: base, max: base, isRange: false }
  const colorPrice = parsePrice(c.price) ?? base
  if (!Array.isArray(c.sizes) || !c.sizes.length) {
    return { min: colorPrice, max: colorPrice, isRange: false }
  }
  const all = c.sizes.map(s => parsePrice(s.price) ?? colorPrice)
  const min = Math.min(...all), max = Math.max(...all)
  return { min, max, isRange: min !== max }
}

export function formatPriceDisplay(product, rmPrefix = 'RM') {
  const { min, max, isRange } = priceRange(product)
  if (isRange) return `${rmPrefix} ${min.toFixed(2)} - ${max.toFixed(2)}`
  return `${rmPrefix} ${min.toFixed(2)}`
}

// ─── 工具函数：格式化 selectedMods 为显示字符串 ───────────────────────────────

// 将 selectedMods 对象或旧的 color/size 格式化为显示字符串
// e.g. { 口味: "草莓", 大小: "中杯" } → "草莓 · 中杯"
export function formatVariants(item) {
  if (item?.selectedMods && Object.keys(item.selectedMods).length > 0) {
    return Object.values(item.selectedMods).filter(Boolean).join(' · ')
  }
  return [item?.color, item?.size].filter(Boolean).join(' · ')
}

// ─── 管理员编辑用：旧格式 → 加法格式转换 ────────────────────────────────────────

export function convertToAdditiveModifiers(product) {
  // 已经是加法格式，直接返回
  if (hasAdditiveModifiers(product)) return product.modifiers

  const base = Number(product?.price) || 0
  const mods = []

  if (product?.colors?.length) {
    mods.push({
      name: '颜色',
      withImage: true,
      options: product.colors.map(c => ({
        label: c.label,
        imageUrl: c.imageUrl ?? null,
        priceDelta: c.price != null ? Math.max(0, Number(c.price) - base) : 0,
      })),
    })
  }
  if (product?.sizes?.length) {
    mods.push({
      name: '尺码',
      options: product.sizes.map(s => ({ label: typeof s === 'string' ? s : s.label, priceDelta: 0 })),
    })
  }
  // 旧矩阵格式 modifiers（有 variants，无 priceDelta）
  if (!mods.length && product?.modifiers?.length) {
    return product.modifiers.map((mod, i) => ({
      name: mod.name,
      withImage: mod.withImage ?? false,
      options: mod.options.map(opt => ({
        label: opt.label,
        imageUrl: opt.imageUrl ?? null,
        priceDelta: i === 0 ? Math.max(0, (parsePrice(opt.price) ?? base) - base) : 0,
      })),
    }))
  }
  return mods
}

// ─── 管理员保存用：生成旧格式 colors/sizes（向后兼容历史订单显示）────────────────

export function modifiersToLegacy(modifiers) {
  const mod1 = modifiers?.[0]
  const mod2 = modifiers?.[1]
  return {
    colors: mod1 ? mod1.options.map(o => ({
      label: o.label,
      imageUrl: o.imageUrl ?? null,
      price: null,
      costPrice: null,
      sizes: [],
    })) : [],
    sizes: mod2 ? mod2.options.map(o => o.label) : [],
  }
}
