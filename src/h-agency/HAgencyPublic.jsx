import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { db } from '../lib/firebase'

const EJ = {
  key: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  service: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  template: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
}

const T = {
  zh: {
    home: '首页', about: '关于', benefits: '福利', leaderboard: '排行榜', posts: '动态', apply: '立即报名',
    heroBadge: '✨ 2026 招募季正式启动',
    heroLine1: '加入', heroName: '希望公会', heroLine2: '成为闪耀主播',
    heroSub: '专业培训 · 流量扶持 · 高额提成 · 业绩奖励',
    heroSub2: '让你的才华在这里绽放光芒',
    heroCta1: '立即报名', heroCta2: '了解更多',
    aboutTitle: '为什么选择希望公会', aboutSub: '专业团队 · 完善体系 · 成长保障',
    a1t: '专业平台', a1d: '娱乐直播领域专业公会，丰富的运营经验与成熟的主播培养体系，帮助每位主播快速成长。',
    a2t: '精准定位', a2d: '根据每位主播的特点与优势，量身定制发展方向，让你在最适合的领域发光发热。',
    a3t: '流量扶持', a3d: '强大的流量支持与推广资源，帮助新人快速积累粉丝，老主播持续增长人气。',
    a4t: '资源整合', a4d: '与多个直播平台深度合作，提供更多曝光机会与商业合作资源，拓展职业发展道路。',
    benefitsTitle: '丰厚福利待遇', benefitsSub: '为主播提供全方位的支持与保障',
    b1t: '保底薪资', b1d: '具有竞争力的底薪保障，让你专注直播无后顾之忧',
    b2t: '高额提成', b2d: '业内领先分成比例，收入上不封顶',
    b3t: '专业培训', b3d: '系统化培训课程，技能与魅力全面提升',
    b4t: '流量扶持', b4d: '公会流量倾斜与推广资源，快速积累粉丝',
    b5t: '业绩奖励', b5d: '多层级业绩奖励机制，付出必有回报',
    b6t: '节日福利', b6d: '节日礼品、生日祝福、丰富团建活动',
    lbTitle: '本月明星主播', lbSub: '优秀主播榜单 · 见证你的成长',
    income: '月收入', hours: '直播时长', fans: '粉丝增长', lbEmpty: '暂无排行榜数据',
    postsTitle: '最新动态', postsSub: '关注希望公会最新资讯',
    postsEmpty: '暂无动态更新，敬请期待',
    applyTitle: '立即加入我们', applySub: '填写报名表，开启你的主播之路',
    fName: '姓名', fAge: '年龄', fPhone: '联系电话', fWechat: '微信号', fEmail: '邮箱',
    fExp: '直播经验', fSpec: '擅长领域', fIntro: '个人简介', fSocial: '社交媒体账号',
    fNamePh: '请输入你的姓名', fAgePh: '请输入你的年龄', fPhonePh: '请输入你的手机号',
    fWechatPh: '请输入你的微信号（选填）', fEmailPh: '请输入你的邮箱（选填）',
    fIntroPh: '请简单介绍你自己，包括特长、优势和对直播的想法...',
    fSocialPh: '请输入你的抖音、TikTok 等账号（选填）',
    fSubmit: '提交申请', fSubmitting: '提交中...',
    sel: '请选择',
    expNone: '无经验', exp1to3: '1-3个月', exp3to12: '3-12个月', exp1plus: '1年以上',
    specSinging: '唱歌', specDancing: '跳舞', specChat: '聊天互动', specTalent: '才艺表演', specOther: '其他',
    required: '请填写所有必填项（姓名、年龄、电话、经验、擅长、简介）',
    successTitle: '申请已提交！', successMsg: '感谢你的报名！招募团队将在24小时内联系你。',
    errorTitle: '提交失败', errorMsg: '请稍后再试，或通过 Instagram 直接联系我们。',
    footerTagline: '让每个主播都闪闪发光',
    footerCopy: '© 2026 ℋ Agency 希望公会. All rights reserved.',
    followUs: '关注我们',
    poweredBy: 'Powered by jeeprod.com',
    backToJee: '← 返回 jeeprod',
  },
  en: {
    home: 'Home', about: 'About', benefits: 'Benefits', leaderboard: 'Leaderboard', posts: 'Updates', apply: 'Apply Now',
    heroBadge: '✨ 2026 Recruitment Season Now Open',
    heroLine1: 'Join', heroName: 'ℋ Agency', heroLine2: 'Become a Shining Star',
    heroSub: 'Professional Training · Traffic Support · High Commission · Performance Rewards',
    heroSub2: 'Unleash Your Talent Here',
    heroCta1: 'Apply Now', heroCta2: 'Learn More',
    aboutTitle: 'Why Choose ℋ Agency', aboutSub: 'Professional Team · Complete System · Growth Guarantee',
    a1t: 'Professional Platform', a1d: 'Professional streaming agency with rich operational experience and a mature streamer development system.',
    a2t: 'Precise Positioning', a2d: 'Custom development direction based on your unique strengths to maximize your potential.',
    a3t: 'Traffic Support', a3d: 'Powerful traffic allocation and promotional resources to grow your fanbase rapidly.',
    a4t: 'Resource Integration', a4d: 'Deep partnerships with multiple streaming platforms for more exposure and business opportunities.',
    benefitsTitle: 'Amazing Benefits', benefitsSub: 'Comprehensive Support & Security for All Streamers',
    b1t: 'Base Salary', b1d: 'Competitive guaranteed income so you can focus on streaming',
    b2t: 'High Commission', b2d: 'Industry-leading commission rate with unlimited earning potential',
    b3t: 'Professional Training', b3d: 'Systematic training to enhance your skills and appeal',
    b4t: 'Traffic Support', b4d: 'Traffic boost and promotional resources to grow your fanbase',
    b5t: 'Performance Rewards', b5d: 'Multi-tier reward system — your effort will be recognized',
    b6t: 'Holiday Benefits', b6d: 'Holiday gifts, birthday wishes, and team building events',
    lbTitle: 'Top Streamers This Month', lbSub: 'Excellence Board · Witness Your Growth',
    income: 'Income', hours: 'Stream Hours', fans: 'Fans Growth', lbEmpty: 'No leaderboard data yet',
    postsTitle: 'Latest Updates', postsSub: 'Stay Updated with ℋ Agency',
    postsEmpty: 'No updates yet — stay tuned!',
    applyTitle: 'Join Us Today', applySub: 'Fill out the form and start your streaming journey',
    fName: 'Name', fAge: 'Age', fPhone: 'Phone', fWechat: 'WeChat ID', fEmail: 'Email',
    fExp: 'Experience', fSpec: 'Specialization', fIntro: 'About Yourself', fSocial: 'Social Media',
    fNamePh: 'Enter your name', fAgePh: 'Enter your age', fPhonePh: 'Enter your phone number',
    fWechatPh: 'Enter your WeChat ID (optional)', fEmailPh: 'Enter your email (optional)',
    fIntroPh: 'Tell us about yourself, your strengths, and thoughts about streaming...',
    fSocialPh: 'Enter your TikTok, Douyin, or other social media links (optional)',
    fSubmit: 'Submit Application', fSubmitting: 'Submitting...',
    sel: 'Please select',
    expNone: 'No experience', exp1to3: '1-3 months', exp3to12: '3-12 months', exp1plus: '1+ years',
    specSinging: 'Singing', specDancing: 'Dancing', specChat: 'Chatting', specTalent: 'Talent Show', specOther: 'Other',
    required: 'Please fill in all required fields (name, age, phone, experience, specialization, introduction)',
    successTitle: 'Application Submitted!', successMsg: 'Thank you! Our recruitment team will contact you within 24 hours.',
    errorTitle: 'Submission Failed', errorMsg: 'Please try again or contact us directly via Instagram.',
    footerTagline: 'Making Every Streamer Shine',
    footerCopy: '© 2026 ℋ Agency. All rights reserved.',
    followUs: 'Follow Us',
    poweredBy: 'Powered by jeeprod.com',
    backToJee: '← Back to jeeprod',
  },
}

const PARTICLES = [
  { w: 18, h: 18, top: '15%', left: '8%', delay: '0s', dur: '7s' },
  { w: 12, h: 12, top: '35%', left: '82%', delay: '1.5s', dur: '9s' },
  { w: 22, h: 22, top: '60%', left: '12%', delay: '3s', dur: '8s' },
  { w: 14, h: 14, top: '25%', left: '65%', delay: '0.8s', dur: '10s' },
  { w: 20, h: 20, top: '75%', left: '55%', delay: '4s', dur: '7.5s' },
  { w: 10, h: 10, top: '50%', left: '28%', delay: '2s', dur: '11s' },
  { w: 16, h: 16, top: '80%', left: '78%', delay: '5s', dur: '8.5s' },
  { w: 8,  h: 8,  top: '45%', left: '92%', delay: '1s', dur: '12s' },
]

const BENEFITS = [
  { icon: '💰', tk: 'b1t', dk: 'b1d' }, { icon: '📈', tk: 'b2t', dk: 'b2d' },
  { icon: '🎓', tk: 'b3t', dk: 'b3d' }, { icon: '🔥', tk: 'b4t', dk: 'b4d' },
  { icon: '🏆', tk: 'b5t', dk: 'b5d' }, { icon: '🎁', tk: 'b6t', dk: 'b6d' },
]

const ABOUT_CARDS = [
  { icon: '🎭', tk: 'a1t', dk: 'a1d' }, { icon: '🎯', tk: 'a2t', dk: 'a2d' },
  { icon: '🚀', tk: 'a3t', dk: 'a3d' }, { icon: '💎', tk: 'a4t', dk: 'a4d' },
]

const RANK_STYLE = ['#FFD700', '#C0C0C0', '#CD7F32']

const STARS = Array.from({ length: 18 }, (_, i) => ({
  left: `${5 + i * 5.2}%`,
  delay: `${(i * 0.7) % 6}s`,
  dur: `${5 + (i * 1.1) % 5}s`,
  opacity: 0.4 + (i % 5) * 0.12,
  size: 10 + (i % 4) * 4,
}))

const PLATFORM_ICONS = {
  tiktok: <img src="/hagency/tiktok.svg"    alt="TikTok"    className="w-6 h-6 object-contain" />,
  bigo:   <img src="/hagency/bigo.svg"      alt="BIGO Live" className="w-6 h-6 object-contain" />,
  insta:  <img src="/hagency/Instagram.svg" alt="Instagram" className="w-6 h-6 object-contain" />,
}

const emptyForm = { name: '', age: '', phone: '', wechat: '', email: '', experience: '', specialization: '', introduction: '', social: '' }

export default function HAgencyPublic() {
  const [lang, setLang] = useState('zh')
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { ok: bool, title, msg }
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const carouselRef = useRef(null)

  const t = T[lang]

  useEffect(() => {
    if (EJ.key) emailjs.init(EJ.key)
    loadLeaderboard()
    loadPosts()
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (lightboxIdx === null) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setLightboxIdx(i => Math.min(i + 1, posts.length - 1))
      else if (e.key === 'ArrowLeft') setLightboxIdx(i => Math.max(i - 1, 0))
      else if (e.key === 'Escape') setLightboxIdx(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIdx, posts.length])

  const loadLeaderboard = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'hagency_leaderboard'), orderBy('order', 'asc')))
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {}
  }

  const loadPosts = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'hagency_posts'), orderBy('createdAt', 'desc')))
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {}
  }

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, age, phone, experience, specialization, introduction } = form
    if (!name || !age || !phone || !experience || !specialization || !introduction) {
      setResult({ ok: false, title: t.errorTitle, msg: t.required })
      return
    }
    setSubmitting(true)
    setResult(null)
    let ok = false
    try {
      await addDoc(collection(db, 'hagency_submissions'), {
        ...form,
        status: 'pending',
        submittedAt: serverTimestamp(),
      })
      ok = true
    } catch {}
    try {
      await emailjs.send(EJ.service, EJ.template, {
        from_name: form.name,
        to_email: 'jeejunhong@gmail.com',
        to_name: 'ℋ Agency 招募团队',
        message: `新主播申请：${form.name}`,
        applicant_name: form.name,
        applicant_age: form.age,
        applicant_phone: form.phone,
        applicant_wechat: form.wechat || '未填写',
        applicant_email: form.email || '未填写',
        applicant_experience: form.experience,
        applicant_specialization: form.specialization,
        applicant_introduction: form.introduction,
        applicant_social: form.social || '未填写',
        submitted_at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }),
      })
      ok = true
    } catch {}
    if (ok) {
      setResult({ ok: true, title: t.successTitle, msg: t.successMsg })
      setForm(emptyForm)
    } else {
      setResult({ ok: false, title: t.errorTitle, msg: t.errorMsg })
    }
    setSubmitting(false)
  }

  // Color helpers
  const bg = dark ? 'bg-[#0f0009]' : 'bg-pink-100'
  const cardBg = dark ? 'bg-pink-950/60 border-pink-900/40' : 'bg-pink-50 border-pink-200'
  const textPrimary = dark ? 'text-pink-50' : 'text-gray-900'
  const textSub = dark ? 'text-pink-200/70' : 'text-gray-600'
  const sectionAlt = dark ? 'bg-[#130811]' : 'bg-pink-50'
  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${dark ? 'bg-pink-950/50 border-pink-800/40 text-pink-50 placeholder:text-pink-300/30 focus:border-pink-500' : 'bg-white border-pink-200 text-gray-800 placeholder:text-gray-300 focus:border-pink-400'}`
  const selectCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${dark ? 'bg-pink-950/50 border-pink-800/40 text-pink-50 focus:border-pink-500' : 'bg-white border-pink-200 text-gray-800 focus:border-pink-400'}`

  return (
    <div className={`ha-shell min-h-screen font-sans ${dark ? 'ha-dark' : ''} ${bg} ${textPrimary}`} style={{ overflowX: 'hidden' }}>
      <style>{`
        .ha-gradient-text {
          background: linear-gradient(135deg, #ec4899, #f9a8d4 50%, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ha-btn-primary {
          background: linear-gradient(135deg, #e91e8c, #c2185b);
          color: white;
          transition: all 0.2s;
        }
        .ha-btn-primary:hover { background: linear-gradient(135deg, #f06292, #e91e8c); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(233,30,140,0.35); }
        .ha-card-hover { transition: all 0.25s; }
        .ha-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(233,30,140,0.18); }
        @keyframes ha-float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.45; }
          50% { transform: translateY(-22px) rotate(180deg); opacity: 0.75; }
        }
        .ha-particle { animation: ha-float linear infinite; position: absolute; border-radius: 50%; pointer-events: none; background: linear-gradient(135deg, rgba(236,72,153,0.7), rgba(168,85,247,0.5)); }
        @keyframes ha-star-fall {
          0%   { transform: translateY(-40px) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(540deg) scale(0.4); opacity: 0; }
        }
        .ha-star { position: absolute; top: -40px; pointer-events: none; animation: ha-star-fall linear infinite; color: #f9a8d4; font-size: 14px; }
        .ha-lb-avatar-ring { box-shadow: 0 0 0 3px rgba(233,30,140,0.35), 0 0 20px rgba(233,30,140,0.2); }
      `}</style>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? (dark ? 'bg-[#0f0009]/95 shadow-[0_4px_30px_rgba(233,30,140,0.15)]' : 'bg-pink-100/95 shadow-sm') : 'bg-transparent'} backdrop-blur-sm`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={() => scrollTo('#home')} className="font-display text-2xl text-pink-500" style={{ fontStyle: 'italic' }}>ℋ Agency</button>
          <div className="hidden items-center gap-6 lg:flex">
            {['#home','#about','#benefits','#leaderboard','#posts','#apply'].map((href, i) => {
              const keys = ['home','about','benefits','leaderboard','posts','apply']
              return (
                <button key={href} onClick={() => scrollTo(href)} className={`text-sm transition-colors hover:text-pink-500 ${textSub}`}>
                  {t[keys[i]]}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${dark ? 'border-pink-800 text-pink-300 hover:border-pink-500' : 'border-pink-200 text-pink-500 hover:border-pink-400'}`}>
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <button onClick={() => setDark(d => !d)} className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${dark ? 'border-pink-800 text-pink-300 hover:border-pink-500' : 'border-pink-200 text-pink-500 hover:border-pink-400'}`}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => scrollTo('#apply')} className="ha-btn-primary hidden rounded-full px-4 py-1.5 text-sm font-medium lg:block">
              {t.heroCta1}
            </button>
            <button onClick={() => setMenuOpen(o => !o)} className={`rounded-lg p-2 lg:hidden ${dark ? 'text-pink-300' : 'text-pink-500'}`}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className={`border-t px-6 py-4 lg:hidden ${dark ? 'bg-[#0f0009] border-pink-900/30' : 'bg-pink-100 border-pink-200'}`}>
            {['#home','#about','#benefits','#leaderboard','#posts','#apply'].map((href, i) => {
              const keys = ['home','about','benefits','leaderboard','posts','apply']
              return (
                <button key={href} onClick={() => scrollTo(href)} className={`block w-full py-2.5 text-left text-sm ${textSub} hover:text-pink-500`}>
                  {t[keys[i]]}
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative flex min-h-screen items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0009 0%, #1a0318 45%, #0d0015 100%)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(233,30,140,0.22) 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(168,85,247,0.14) 0%, transparent 50%)' }} />
        {PARTICLES.map((p, i) => (
          <div key={i} className="ha-particle" style={{ width: p.w, height: p.h, top: p.top, left: p.left, animationDelay: p.delay, animationDuration: p.dur }} />
        ))}
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-pink-300">{t.heroBadge}</span>
          </div>
          <h1 className="font-display text-5xl leading-tight text-white sm:text-6xl md:text-7xl">
            {t.heroLine1} <span className="ha-gradient-text">{t.heroName}</span>
            <br />{t.heroLine2}
          </h1>
          <p className="mt-6 text-base text-pink-200/70 sm:text-lg">{t.heroSub}</p>
          <p className="mt-1 text-sm text-pink-200/50">{t.heroSub2}</p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => scrollTo('#apply')} className="ha-btn-primary rounded-full px-8 py-3.5 text-base font-medium">
              {t.heroCta1}
            </button>
            <button onClick={() => scrollTo('#about')} className="rounded-full border border-pink-500/40 px-8 py-3.5 text-base text-pink-300 transition-colors hover:border-pink-400 hover:text-pink-200">
              {t.heroCta2}
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-6 w-4 rounded-full border-2 border-pink-500/40 flex items-start justify-center pt-1">
            <div className="h-1.5 w-0.5 rounded-full bg-pink-400/60" />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className={`py-24 ${sectionAlt}`}>
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader title={t.aboutTitle} sub={t.aboutSub} dark={dark} pink />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_CARDS.map(({ icon, tk, dk }) => (
              <div key={tk} className={`ha-card-hover rounded-3xl border p-6 ${cardBg}`}>
                <div className="mb-4 text-3xl">{icon}</div>
                <h3 className={`mb-2 font-display text-xl ${textPrimary}`}>{t[tk]}</h3>
                <p className={`text-sm leading-6 ${textSub}`}>{t[dk]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className={`py-24 ${bg}`}>
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader title={t.benefitsTitle} sub={t.benefitsSub} dark={dark} pink />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon, tk, dk }) => (
              <div key={tk} className={`ha-card-hover rounded-3xl border p-6 ${cardBg} flex gap-4`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.12), rgba(168,85,247,0.08))' }}>
                  {icon}
                </div>
                <div>
                  <h3 className={`font-semibold ${textPrimary}`}>{t[tk]}</h3>
                  <p className={`mt-1 text-sm leading-5 ${textSub}`}>{t[dk]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section id="leaderboard" className="relative py-24 overflow-hidden" style={{ background: dark ? 'linear-gradient(135deg, #130811, #1a0318, #0f0009)' : 'linear-gradient(135deg, #fff0f6, #fce7f3, #fdf2f8)' }}>
        {/* Falling stars */}
        {STARS.map((s, i) => (
          <span key={i} className="ha-star" style={{ left: s.left, animationDelay: s.delay, animationDuration: s.dur, opacity: s.opacity, fontSize: s.size }}>✦</span>
        ))}

        <div className="relative mx-auto max-w-4xl px-6">
          <SectionHeader title={t.lbTitle} sub={t.lbSub} dark={dark} pink center />
          <div className="relative mt-12">
            {/* Fade hint at bottom when there are more than 3 */}
            {leaderboard.length > 3 && (
              <div
                className="pointer-events-none absolute bottom-0 inset-x-0 z-10 h-24 rounded-b-3xl"
                style={{ background: `linear-gradient(to top, ${dark ? '#1a0318' : '#fce7f3'}, transparent)` }}
              />
            )}
            <div
              className="space-y-4 overflow-y-auto pb-2"
              style={{ maxHeight: '480px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {leaderboard.length === 0 ? (
              <div className={`rounded-3xl border py-12 text-center ${dark ? 'border-pink-900/30 text-pink-300/50' : 'border-pink-100 text-pink-300'}`}>{t.lbEmpty}</div>
            ) : leaderboard.map((s, i) => {
              const rankColor = RANK_STYLE[i] || (dark ? '#f9a8d4' : '#e91e8c')
              const rankEmoji = ['🥇', '🥈', '🥉'][i]
              const cardBgLb = dark ? 'bg-pink-950/50 border-pink-900/40' : 'bg-white/80 border-pink-100'
              return (
                <div key={s.id} className="relative pl-9">
                  {/* Rank — floats outside the card */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex w-8 flex-col items-center select-none">
                    {rankEmoji
                      ? <span className="text-2xl leading-none">{rankEmoji}</span>
                      : <span className="font-mono text-sm font-bold leading-none" style={{ color: rankColor }}>{i + 1}</span>
                    }
                  </div>

                  <div className={`ha-card-hover rounded-3xl border p-4 backdrop-blur-sm ${cardBgLb}`}>
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.nameZh} className="ha-lb-avatar-ring h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
                        ) : (
                          <div className="ha-lb-avatar-ring flex h-16 w-16 items-center justify-center rounded-full text-2xl sm:h-20 sm:w-20 sm:text-3xl" style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.2), rgba(168,85,247,0.15))' }}>
                            🎤
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name + badge */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={`font-semibold leading-tight ${textPrimary}`}>{lang === 'zh' ? s.nameZh : (s.nameEn || s.nameZh)}</p>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-pink-500" style={{ background: dark ? 'rgba(233,30,140,0.15)' : 'rgba(233,30,140,0.08)' }}>
                            {lang === 'zh' ? (s.badgeZh || '优秀主播') : (s.badgeEn || 'Top Streamer')}
                          </span>
                        </div>

                        {/* Stats grid — 3 columns, mobile-friendly */}
                        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                          {[
                            { val: `¥${(s.income || 0).toLocaleString()}`, label: t.income },
                            { val: `${s.hours || 0}h`, label: t.hours },
                            { val: `+${(s.fansGrowth || 0).toLocaleString()}`, label: t.fans },
                          ].map(({ val, label }) => (
                            <div key={label} className={`rounded-xl py-1 ${dark ? 'bg-pink-950/40' : 'bg-pink-50/60'}`}>
                              <p className={`text-xs font-semibold leading-tight ${textPrimary}`}>{val}</p>
                              <p className={`mt-0.5 font-mono text-[9px] uppercase tracking-wide ${textSub} opacity-70`}>{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Platform icons */}
                        {(s.tiktokUrl || s.bigoUrl || s.instaUrl) && (
                          <div className="mt-2 flex gap-2">
                            {s.tiktokUrl && (
                              <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer" className={`transition-opacity hover:opacity-100 ${dark ? 'text-pink-300/70' : 'text-gray-500'}`} title="TikTok / 抖音">
                                {PLATFORM_ICONS.tiktok}
                              </a>
                            )}
                            {s.bigoUrl && (
                              <a href={s.bigoUrl} target="_blank" rel="noopener noreferrer" className={`transition-opacity hover:opacity-100 ${dark ? 'text-purple-300/70' : 'text-purple-400'}`} title="BIGO Live">
                                {PLATFORM_ICONS.bigo}
                              </a>
                            )}
                            {s.instaUrl && (
                              <a href={s.instaUrl} target="_blank" rel="noopener noreferrer" className={`transition-opacity hover:opacity-100 ${dark ? 'text-orange-300/70' : 'text-orange-400'}`} title="Instagram">
                                {PLATFORM_ICONS.insta}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>{/* end scrollable list */}
          </div>{/* end relative wrapper */}
        </div>
      </section>

      {/* Posts */}
      <section id="posts" className={`py-24 ${sectionAlt}`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between">
            <SectionHeader title={t.postsTitle} sub={t.postsSub} dark={dark} pink />
            {posts.length > 3 && (
              <div className="mb-1 flex shrink-0 gap-2">
                <button
                  onClick={() => { const el = carouselRef.current; if (!el) return; const c = el.querySelector('[data-card]'); el.scrollBy({ left: -((c?.offsetWidth ?? 300) + 20), behavior: 'smooth' }) }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-colors ${dark ? 'border-pink-800/60 text-pink-300/60 hover:border-pink-400 hover:text-pink-300' : 'border-pink-200 text-pink-300 hover:border-pink-400 hover:text-pink-500'}`}
                >‹</button>
                <button
                  onClick={() => { const el = carouselRef.current; if (!el) return; const c = el.querySelector('[data-card]'); el.scrollBy({ left: (c?.offsetWidth ?? 300) + 20, behavior: 'smooth' }) }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-colors ${dark ? 'border-pink-800/60 text-pink-300/60 hover:border-pink-400 hover:text-pink-300' : 'border-pink-200 text-pink-300 hover:border-pink-400 hover:text-pink-500'}`}
                >›</button>
              </div>
            )}
          </div>
          {posts.length === 0 ? (
            <div className={`mt-10 rounded-3xl border py-16 text-center ${dark ? 'border-pink-900/30 text-pink-300/50' : 'border-pink-100 text-pink-300'}`}>{t.postsEmpty}</div>
          ) : (
            <div
              ref={carouselRef}
              className="mt-6 flex gap-5 overflow-x-auto scroll-smooth pb-2"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {posts.map((p, i) => {
                const url = p.mediaUrl || p.imageUrl || ''
                const isVid = p.mediaType === 'video'
                return (
                  <div
                    key={p.id}
                    data-card
                    className={`ha-card-hover shrink-0 overflow-hidden rounded-3xl border cursor-pointer w-[80vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] ${cardBg}`}
                    style={{ scrollSnapAlign: 'start' }}
                    onClick={() => setLightboxIdx(i)}
                  >
                    {url && (
                      <div className="relative aspect-square overflow-hidden">
                        {isVid
                          ? <video src={url} className="h-full w-full object-cover" muted playsInline />
                          : <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                        }
                        {isVid && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                              <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6 translate-x-0.5"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {(p.captionZh || p.captionEn) && (
                      <div className="p-4">
                        <p className={`text-sm leading-6 ${textSub}`}>{lang === 'zh' ? (p.captionZh || p.captionEn) : (p.captionEn || p.captionZh)}</p>
                        {p.createdAt?.toDate && (
                          <p className={`mt-2 font-mono text-[11px] ${dark ? 'text-pink-300/30' : 'text-pink-200'}`}>
                            {p.createdAt.toDate().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (() => {
        const p = posts[lightboxIdx]
        if (!p) return null
        const url = p.mediaUrl || p.imageUrl || ''
        const isVid = p.mediaType === 'video'
        return (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm" onClick={() => setLightboxIdx(null)}>
            {/* Fixed top bar — always visible above video controls */}
            <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
              <span className="font-mono text-xs text-white/40">{lightboxIdx + 1} / {posts.length}</span>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(null) }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-lg text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >✕</button>
            </div>

            {/* Fixed side arrows */}
            {lightboxIdx > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i - 1) }}
                className="fixed left-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >‹</button>
            )}
            {lightboxIdx < posts.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i + 1) }}
                className="fixed right-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >›</button>
            )}

            {/* Content */}
            <div className="flex h-full flex-col items-center justify-center px-14 pt-14 pb-4" onClick={e => e.stopPropagation()}>
              <div className="w-full max-w-2xl">
                {url && (
                  isVid
                    ? <video src={url} className="w-full rounded-2xl bg-black object-contain max-h-[60vh] sm:max-h-[70vh]" controls autoPlay playsInline />
                    : <img src={url} alt="" className="w-full rounded-2xl object-contain max-h-[70vh]" />
                )}
                {(p.captionZh || p.captionEn) && (
                  <div className="mt-3 text-center">
                    <p className="text-white/90 text-sm leading-6">{lang === 'zh' ? (p.captionZh || p.captionEn) : (p.captionEn || p.captionZh)}</p>
                    {p.createdAt?.toDate && (
                      <p className="mt-1 font-mono text-[11px] text-white/40">{p.createdAt.toDate().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Apply */}
      <section id="apply" className={`py-24 ${bg}`}>
        <div className="mx-auto max-w-2xl px-6">
          <SectionHeader title={t.applyTitle} sub={t.applySub} dark={dark} pink center />
          <div className={`mt-10 rounded-3xl border p-8 ${cardBg}`}>
            {result && (
              <div className={`mb-6 rounded-2xl border p-4 ${result.ok ? (dark ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800') : (dark ? 'border-pink-500/30 bg-pink-950/40 text-pink-300' : 'border-pink-200 bg-pink-50 text-pink-700')}`}>
                <p className="font-semibold">{result.title}</p>
                <p className="mt-1 text-sm">{result.msg}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t.fName} *`} dark={dark}><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={t.fNamePh} className={inputCls} /></Field>
                <Field label={`${t.fAge} *`} dark={dark}><input type="number" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder={t.fAgePh} className={inputCls} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t.fPhone} *`} dark={dark}><input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder={t.fPhonePh} className={inputCls} /></Field>
                <Field label={t.fWechat} dark={dark}><input value={form.wechat} onChange={e=>setForm(f=>({...f,wechat:e.target.value}))} placeholder={t.fWechatPh} className={inputCls} /></Field>
              </div>
              <Field label={t.fEmail} dark={dark}><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder={t.fEmailPh} className={inputCls} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t.fExp} *`} dark={dark}>
                  <select value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} className={selectCls}>
                    <option value="">{t.sel}</option>
                    <option value="无经验">{t.expNone}</option>
                    <option value="1-3个月">{t.exp1to3}</option>
                    <option value="3-12个月">{t.exp3to12}</option>
                    <option value="1年以上">{t.exp1plus}</option>
                  </select>
                </Field>
                <Field label={`${t.fSpec} *`} dark={dark}>
                  <select value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} className={selectCls}>
                    <option value="">{t.sel}</option>
                    <option value="唱歌">{t.specSinging}</option>
                    <option value="跳舞">{t.specDancing}</option>
                    <option value="聊天互动">{t.specChat}</option>
                    <option value="才艺表演">{t.specTalent}</option>
                    <option value="其他">{t.specOther}</option>
                  </select>
                </Field>
              </div>
              <Field label={`${t.fIntro} *`} dark={dark}><textarea rows={4} value={form.introduction} onChange={e=>setForm(f=>({...f,introduction:e.target.value}))} placeholder={t.fIntroPh} className={inputCls} /></Field>
              <Field label={t.fSocial} dark={dark}><input value={form.social} onChange={e=>setForm(f=>({...f,social:e.target.value}))} placeholder={t.fSocialPh} className={inputCls} /></Field>
              <button type="submit" disabled={submitting} className="ha-btn-primary w-full rounded-2xl py-3.5 text-base font-medium disabled:opacity-60">
                {submitting ? t.fSubmitting : t.fSubmit}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: dark ? '#08000a' : '#1a0318' }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="font-display text-3xl text-pink-400" style={{ fontStyle: 'italic' }}>ℋ Agency</div>
          <p className="mt-2 text-sm text-pink-300/60">{t.footerTagline}</p>
          <div className="mt-5 flex justify-center gap-4">
            <a href="https://www.instagram.com/h_agency21/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-800/50 transition-colors hover:border-pink-500">
              <img src="/hagency/Instagram.svg" alt="Instagram" className="w-5 h-5 object-contain" />
            </a>
          </div>
          <div className="mt-6 border-t border-pink-900/30 pt-6">
            <p className="text-xs text-pink-300/40">{t.footerCopy}</p>
            <Link to="/" className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-pink-400/30 transition-colors hover:text-pink-400/60">
              {t.poweredBy}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({ title, sub, dark, center }) {
  return (
    <div className={`mb-2 ${center ? 'text-center' : ''}`}>
      <p className={`font-mono text-xs uppercase tracking-[0.28em] ${dark ? 'text-pink-400/60' : 'text-pink-400'}`}>{sub}</p>
      <h2 className={`mt-2 font-display text-4xl ${dark ? 'text-pink-50' : 'text-gray-900'}`}>{title}</h2>
    </div>
  )
}

function Field({ label, dark, children }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] ${dark ? 'text-pink-300/50' : 'text-pink-400/70'}`}>{label}</span>
      {children}
    </label>
  )
}

