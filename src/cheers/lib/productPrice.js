// 商品规格价格工具
// 支持新的 modifiers 格式 和 旧的 colors/sizes 格式（向后兼容）
//
// 新格式: product.modifiers = [{ name, options: [{ label, price, costPrice, imageUrl, variants: [{label, price, costPrice}] }] }, ...]
// 旧格式: product.colors = [{ label, price, costPrice, imageUrl, sizes: [{label, price, costPrice}] }], product.sizes = string[]

function parsePrice(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// ─── 格式检测 ─────────────────────────────────────────────────────────────────

function hasModifiers(product) {
  return Array.isArray(product?.modifiers) && product.modifiers.length > 0
}

// ─── 新格式 helper ─────────────────────────────────────────────────────────────

// 取 modifier1 的选项列表（新格式）
function getMod1Options(product) {
  return product.modifiers?.[0]?.options || []
}

// 取 modifier2 的选项标签列表（新格式），可选按 mod1Label 过滤 variants
function getMod2Labels(product) {
  return (product.modifiers?.[1]?.options || []).map(o => o.label)
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

// 取 modifier1 选项（新格式返回 option 对象；旧格式返回 color 对象，字段兼容）
export function getModifier1Options(product) {
  if (hasModifiers(product)) return getMod1Options(product)
  return product?.colors || []
}

// 取 modifier2 标签列表（给定 mod1 选项后可用的 mod2）
// 新格式：从 modifiers[1].options 获取
// 旧格式：从 color.sizes 获取（返回 {label, price, costPrice} 对象数组）
export function getModifier2Options(product, mod1Label) {
  if (hasModifiers(product)) {
    return (product.modifiers[1]?.options || [])
  }
  // 旧格式
  if (!mod1Label || !product?.colors) return []
  const c = product.colors.find(c => c.label === mod1Label)
  return c?.sizes ?? []
}

// 向后兼容：getColorSizes → getModifier2Options（旧调用方用）
export function getColorSizes(product, colorLabel) {
  return getModifier2Options(product, colorLabel)
}

// 取有效价格：mod1+mod2 组合价 > mod1 价 > 基础价
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

  // 旧格式
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

// 取有效成本价
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

  // 旧格式
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

// 取全局价格范围（所有规格组合）
export function priceRange(product) {
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

  // 旧格式
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

// 取指定 mod1 下的价格范围（涵盖该选项的所有 mod2 有效价）
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

  // 旧格式
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

// 格式化展示价格（列表卡片、未选规格时）
export function formatPriceDisplay(product, rmPrefix = 'RM') {
  const { min, max, isRange } = priceRange(product)
  if (isRange) return `${rmPrefix} ${min.toFixed(2)} - ${max.toFixed(2)}`
  return `${rmPrefix} ${min.toFixed(2)}`
}

// ─── 管理员编辑用：旧格式 → modifiers 转换 ─────────────────────────────────────

export function convertLegacyToModifiers(product) {
  if (product?.modifiers?.length) return product.modifiers  // 已是新格式
  const mods = []
  if (product?.colors?.length) {
    mods.push({
      name: '颜色',
      withImage: true,
      options: product.colors.map(c => ({
        label: c.label,
        imageUrl: c.imageUrl ?? null,
        price: parsePrice(c.price),
        costPrice: parsePrice(c.costPrice),
        variants: (c.sizes || []).map(s => ({
          label: s.label,
          price: parsePrice(s.price),
          costPrice: parsePrice(s.costPrice),
        })),
      })),
    })
  }
  if (product?.sizes?.length) {
    mods.push({
      name: '尺码',
      options: product.sizes.map(s => ({ label: typeof s === 'string' ? s : s.label })),
    })
  }
  return mods
}

// ─── 管理员保存用：modifiers → 旧格式（向后兼容订单历史）─────────────────────

export function modifiersToLegacy(modifiers) {
  const mod1 = modifiers?.[0]
  const mod2 = modifiers?.[1]
  return {
    colors: mod1 ? mod1.options.map(o => ({
      label: o.label,
      imageUrl: o.imageUrl ?? null,
      price: o.price ?? null,
      costPrice: o.costPrice ?? null,
      sizes: (o.variants || []).map(v => ({
        label: v.label,
        price: v.price ?? null,
        costPrice: v.costPrice ?? null,
      })),
    })) : [],
    sizes: mod2 ? mod2.options.map(o => o.label) : [],
  }
}
