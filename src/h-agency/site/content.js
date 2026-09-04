export const COPY = {
  zh: {
    nav: { home: '首页', talents: '旗下主播', highlights: '主播高光', services: '运营服务', about: '关于我们', updates: '最新动态', join: '申请加入' },
    heroKicker: '主播经纪 · 内容成长 · 中文市场',
    heroTitle1: '让每一位主播，', heroTitle2: '成为值得被记住的名字。',
    heroCopy: '我们从定位、内容到运营，陪伴主播建立长期且有辨识度的个人品牌。',
    explore: '探索主播', apply: '申请加入', featured: '精选主播', signed: '签约主播', system: '成长体系', market: '中文市场',
    talentTitle: '正在发光的主播', talentSub: 'FEATURED TALENT', talentIntro: '每一位主播都有自己的节奏、风格与成长路线。我们不复制模板，我们放大个性。',
    honorsTitle: '百万主播 · 荣誉加冕', honorsSub: 'MILLION CREATOR HONORS', honorsIntro: '记录每一次跨越与抵达。舞台属于主播，荣誉属于长期坚持。',
    rankingTitle: '本期榜单 · 主播高光', rankingSub: 'CURRENT TALENT RANKING', rankingIntro: '冠军、亚军与季军，是一次阶段成果，也是下一次成长的起点。',
    growthTitle: '成长不靠运气，而是一套可被执行的方法', growthSub: 'FROM POTENTIAL TO PRESENCE',
    servicesTitle: '不只帮你开播，更帮你建立长期价值', servicesSub: 'WHAT WE BUILD TOGETHER',
    updatesTitle: '最新动态', updatesSub: 'THE H AGENCY JOURNAL', updatesEmpty: '新的主播故事与公会动态正在整理中。',
    aboutTitle: '关于希望公会', aboutSub: 'ABOUT ℋ AGENCY',
    joinTitle: '让我们认识你', joinSub: 'YOUR NEXT CHAPTER STARTS HERE',
    viewAll: '查看全部', viewProfile: '查看主播资料', readMore: '阅读全文', back: '返回',
    footerLine: '让每一位主播，成为值得被记住的名字。',
  },
  en: {
    nav: { home: 'Home', talents: 'Talent', highlights: 'Highlights', services: 'Services', about: 'About', updates: 'Journal', join: 'Apply' },
    heroKicker: 'TALENT MANAGEMENT · CREATOR GROWTH · CHINESE MARKET',
    heroTitle1: 'Turning live talent', heroTitle2: 'into names worth remembering.',
    heroCopy: 'From positioning and content to daily operations, we help every streamer build a distinct and lasting creator brand.',
    explore: 'Explore talent', apply: 'Apply now', featured: 'Featured talent', signed: 'Signed talent', system: 'Growth system', market: 'Chinese market',
    talentTitle: 'Talent in the spotlight', talentSub: 'FEATURED TALENT', talentIntro: 'Every talent has a distinct rhythm, voice and path. We do not copy a formula; we make individuality impossible to miss.',
    honorsTitle: 'Million Creators · Crowned in Honor', honorsSub: 'MILLION CREATOR HONORS', honorsIntro: 'Celebrating every breakthrough. The stage belongs to our talent; the honor belongs to lasting dedication.',
    rankingTitle: 'Current Ranking · Talent Highlights', rankingSub: 'CURRENT TALENT RANKING', rankingIntro: 'Champion, runner-up and third place mark one milestone—and the beginning of the next.',
    growthTitle: 'Growth is built on a method, not on luck', growthSub: 'FROM POTENTIAL TO PRESENCE',
    servicesTitle: 'We build value that lasts beyond the next stream', servicesSub: 'WHAT WE BUILD TOGETHER',
    updatesTitle: 'Latest updates', updatesSub: 'THE H AGENCY JOURNAL', updatesEmpty: 'New talent stories and agency updates are being prepared.',
    aboutTitle: 'About ℋ Agency', aboutSub: 'ABOUT ℋ AGENCY',
    joinTitle: 'Let us get to know you', joinSub: 'YOUR NEXT CHAPTER STARTS HERE',
    viewAll: 'View all', viewProfile: 'View profile', readMore: 'Read more', back: 'Back',
    footerLine: 'Turning live talent into names worth remembering.',
  },
}

export const MILLION_HONORS = [
  { id: 'panxia', slug: 'panxia', nameZh: '盼夏', nameEn: 'Panxia', accoladeZh: '百万主播 · 再攀高峰', accoladeEn: 'Million Creator · Reaching New Heights', platform: 'BIGO LIVE', handle: 'panxia825', image: '/hagency/talents/panxia.jpg', objectPosition: '50% 45%' },
  { id: 'xiaonuan', slug: 'xiaonuan', nameZh: '小暖', nameEn: 'Xiaonuan', accoladeZh: '百万主播 · 高光时刻', accoladeEn: 'Million Creator · Spotlight Moment', platform: '抖音', handle: '07nuannuan15', image: '/hagency/talents/xiaonuan.jpg', objectPosition: '50% 44%' },
  { id: 'beibei', slug: 'beibei', nameZh: '贝贝', nameEn: 'Beibei', accoladeZh: '百万主播 · 荣耀加冕', accoladeEn: 'Million Creator · Crowned in Honor', platform: '抖音', handle: 'bellbell__00', image: '/hagency/talents/beibei-million.jpg', objectPosition: '50% 45%' },
]

export const CURRENT_RANKING = [
  { id: 'champion', rank: 1, rankZh: '冠军', rankEn: 'Champion', nameZh: '调皮的丝丝', nameEn: 'Isure', handle: 'isure_0506', image: '/hagency/talents/isure-champion.jpg' },
  { id: 'runner-up', rank: 2, rankZh: '亚军', rankEn: 'Runner-up', nameZh: '贝贝', nameEn: 'Beibei', handle: 'bellbell__00', image: '/hagency/talents/bellbell-runner-up.jpg' },
  { id: 'third', rank: 3, rankZh: '季军', rankEn: 'Third Place', nameZh: '@dyorewszr2gt', nameEn: '@dyorewszr2gt', handle: 'dyorewszr2gt', image: '/hagency/talents/dyorewszr2gt-third.jpg' },
]

export const FALLBACK_TALENTS = MILLION_HONORS.map((talent, index) => ({
  id: talent.id,
  slug: talent.slug,
  nameZh: talent.nameZh,
  nameEn: talent.nameEn,
  badgeZh: '百万主播',
  badgeEn: 'Million Creator',
  photoUrl: talent.image,
  platform: talent.platform,
  handle: talent.handle,
  homeFeatured: true,
  homePosition: index + 1,
  visible: true,
  order: index,
  introZh: `${talent.nameZh}是 ℋ Agency 希望公会旗下主播。完整人物资料正在整理中，现阶段以主播荣誉海报作为展示。`,
  introEn: `${talent.nameEn} is represented by ℋ Agency. Her full profile is being curated; the current feature uses her creator honor artwork.`,
}))

export const GROWTH_STEPS = {
  zh: [
    ['找到定位', '从个性、才艺、语言和受众出发，建立有辨识度的主播方向。'],
    ['完成开播准备', '优化镜头表现、直播节奏、互动话术与内容结构。'],
    ['用数据复盘', '从每场直播里找到可复制的有效时刻，而不是只看单一数字。'],
    ['建立长期成长', '将直播、短内容和粉丝经营连成一个可持续的个人品牌。'],
  ],
  en: [
    ['Find your position', 'Build a distinct direction from your personality, talent, language and audience.'],
    ['Prepare to go live', 'Improve camera presence, pacing, audience interaction and content structure.'],
    ['Review with data', 'Find repeatable moments that worked instead of judging a stream by one number.'],
    ['Build lasting growth', 'Connect live, short-form content and community into a sustainable creator brand.'],
  ],
}

export const SERVICES = {
  zh: [
    ['个人定位', '找到适合你的主播类型、视觉风格和内容方向。'],
    ['直播运营', '从排期、场控、互动到复盘，让每一场都为下一场积累价值。'],
    ['内容成长', '把直播中的高光时刻变成可被看见、记住和传播的内容。'],
  ],
  en: [
    ['Positioning', 'Define your category, visual identity and content direction.'],
    ['Live operations', 'Turn scheduling, interaction and review into compounding progress.'],
    ['Creator growth', 'Turn live moments into content people can discover and remember.'],
  ],
}
