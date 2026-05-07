export const FONTS_EN = [
  {
    id: 'Inter',
    label: 'Inter',
    desc: { zh: '当前默认 · 简洁中性', en: 'Current · Clean & neutral' },
    google: 'Inter:wght@300;400;500;600',
    preview: 'Aa Shopping',
  },
  {
    id: 'Jost',
    label: 'Jost',
    desc: { zh: '几何现代 · 日式简约感', en: 'Geometric · Japanese minimalist' },
    google: 'Jost:wght@300;400;500;600',
    preview: 'Aa Shopping',
  },
  {
    id: 'Lora',
    label: 'Lora',
    desc: { zh: '温暖衬线 · 精品文艺感', en: 'Warm serif · Curated & literary' },
    google: 'Lora:ital,wght@0,400;0,500;0,600;1,400',
    preview: 'Aa Shopping',
  },
  {
    id: 'Playfair Display',
    label: 'Playfair Display',
    desc: { zh: '高对比衬线 · 奢华质感', en: 'High contrast serif · Luxurious' },
    google: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400',
    preview: 'Aa Shopping',
  },
  {
    id: 'Cormorant Garamond',
    label: 'Cormorant Garamond',
    desc: { zh: '极致优雅 · 时尚杂志感', en: 'Ultra-refined · Fashion editorial' },
    google: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400',
    preview: 'Aa Shopping',
  },
  {
    id: 'DM Serif Display',
    label: 'DM Serif Display',
    desc: { zh: '当代衬线 · 编辑风格', en: 'Contemporary serif · Editorial' },
    google: 'DM+Serif+Display:ital@0;1',
    preview: 'Aa Shopping',
  },
  {
    id: 'Nunito',
    label: 'Nunito',
    desc: { zh: '圆润亲切 · 轻松友好', en: 'Rounded · Friendly & approachable' },
    google: 'Nunito:wght@300;400;500;600',
    preview: 'Aa Shopping',
  },
]

export const FONTS_ZH = [
  {
    id: 'Noto Sans SC',
    label: 'Noto Sans SC',
    desc: { zh: '当前默认 · 现代清晰', en: 'Current · Modern & readable' },
    google: 'Noto+Sans+SC:wght@300;400;500;700',
    preview: '代购精选',
  },
  {
    id: 'Noto Serif SC',
    label: 'Noto Serif SC',
    desc: { zh: '优雅衬线 · 与精品感搭配', en: 'Elegant serif · Pairs with luxury fonts' },
    google: 'Noto+Serif+SC:wght@400;500;600;700',
    preview: '代购精选',
  },
  {
    id: 'ZCOOL XiaoWei',
    label: 'ZCOOL XiaoWei',
    desc: { zh: '极细笔画 · 日系美学气质', en: 'Ultra-light strokes · Japanese aesthetic' },
    google: 'ZCOOL+XiaoWei',
    preview: '代购精选',
  },
  {
    id: 'ZCOOL QingKe HuangYou',
    label: 'ZCOOL QingKe HuangYou',
    desc: { zh: '圆润现代 · 年轻亲切感', en: 'Rounded modern · Youthful & friendly' },
    google: 'ZCOOL+QingKe+HuangYou',
    preview: '代购精选',
  },
  {
    id: 'Ma Shan Zheng',
    label: '马善政 (Ma Shan Zheng)',
    desc: { zh: '毛笔手写风 · 个性装饰感', en: 'Brush calligraphy · Decorative' },
    google: 'Ma+Shan+Zheng',
    preview: '代购精选',
  },
]

// Build a Google Fonts URL for a set of font objects
function buildGoogleFontsUrl(fonts) {
  const families = fonts.filter(f => f?.google).map(f => `family=${f.google}`)
  if (!families.length) return null
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

// Inject or update a <link> element for dynamic font loading
function injectFontLink(id, url) {
  if (!url) return
  let link = document.getElementById(id)
  if (!link) {
    link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== url) link.href = url
}

// Apply selected fonts to the page (called on app load + on admin save)
export function applyFonts(fontEn = 'Inter', fontZh = 'Noto Sans SC') {
  const enFont = FONTS_EN.find(f => f.id === fontEn)
  const zhFont = FONTS_ZH.find(f => f.id === fontZh)
  const url = buildGoogleFontsUrl([enFont, zhFont])
  injectFontLink('cheers-dynamic-fonts', url)
  const root = document.documentElement
  root.style.setProperty('--font-en', `'${fontEn}', sans-serif`)
  root.style.setProperty('--font-zh', `'${fontZh}', sans-serif`)
}

// Preload all fonts for preview in admin settings
export function preloadAllFonts() {
  const url = buildGoogleFontsUrl([...FONTS_EN, ...FONTS_ZH])
  injectFontLink('cheers-preview-fonts', url)
}
