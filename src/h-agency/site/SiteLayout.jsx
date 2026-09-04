import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useHAgencySite } from './SiteContext'

export default function SiteLayout({ children }) {
  const { lang, setLang, path, t } = useHAgencySite()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const home = location.pathname === path('/')

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const items = [
    ['home', '/'], ['talents', '/talents'], ['highlights', '/highlights'], ['services', '/services'], ['about', '/about'], ['updates', '/updates'],
  ]
  const solid = !home || scrolled || menuOpen

  return (
    <div className="ha-shell min-h-screen overflow-x-hidden bg-[#f8f3f2] font-sans text-[#24171c]">
      <style>{`
        @keyframes ha-page-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ha-page { animation: ha-page-in .42s ease-out both; }
        .ha-reveal { opacity: 0; filter: blur(3px); transform: translate3d(0,42px,0) scale(.992); transition: opacity .9s cubic-bezier(.16,1,.3,1), filter .9s cubic-bezier(.16,1,.3,1), transform 1.05s cubic-bezier(.16,1,.3,1); transition-delay: var(--ha-reveal-delay, 0ms); }
        .ha-reveal-left { transform: translate3d(-42px,0,0); }
        .ha-reveal-right { transform: translate3d(42px,0,0); }
        .ha-reveal-scale { transform: translate3d(0,18px,0) scale(.975); }
        .ha-reveal.is-visible { opacity: 1; filter: blur(0); transform: translate3d(0,0,0) scale(1); }
        .ha-reveal img { transition: transform 1.2s cubic-bezier(.16,1,.3,1), filter 1s ease; }
        .ha-reveal-scale:not(.is-visible) img { transform: scale(1.025); filter: saturate(.92); }
        .ha-hero-copy { transform: translate3d(0, calc(var(--hero-progress) * -38px), 0); opacity: calc(1 - var(--hero-progress) * .25); will-change: transform, opacity; }
        .ha-hero-stage { transform: translate3d(0, calc(var(--hero-progress) * -18px), 0); will-change: transform; }
        .ha-hero-portrait { position: absolute; display: block; overflow: hidden; border-radius: 30px; background: #f7f3f2; box-shadow: 0 35px 90px rgba(0,0,0,.28); will-change: transform; }
        .ha-hero-portrait-1 { left: 0; top: 21%; z-index: 1; width: 39%; height: 66%; transform: translate3d(calc(var(--hero-progress) * -64px), calc(var(--hero-progress) * -28px), 0) rotate(calc(-2deg + var(--hero-progress) * -1deg)); }
        .ha-hero-portrait-2 { left: 29.5%; top: 7%; z-index: 3; width: 41%; height: 79%; transform: translate3d(0, calc(var(--hero-progress) * 18px), 0) scale(calc(1 + var(--hero-progress) * .025)); }
        .ha-hero-portrait-3 { right: 0; top: 20%; z-index: 2; width: 39%; height: 67%; transform: translate3d(calc(var(--hero-progress) * 64px), calc(var(--hero-progress) * -20px), 0) rotate(calc(2deg + var(--hero-progress) * 1deg)); }
        .ha-scroll-cue { opacity: calc(1 - var(--hero-progress) * 3); }
        @media (max-width: 1023px) {
          .ha-hero-copy, .ha-hero-stage { transform: none; opacity: 1; }
          .ha-hero-portrait { border-radius: 20px; }
          .ha-hero-portrait-1 { left: 0; top: 14%; width: 39%; height: 70%; transform: rotate(-2deg); }
          .ha-hero-portrait-2 { left: 29.5%; top: 4%; width: 41%; height: 82%; transform: none; }
          .ha-hero-portrait-3 { right: 0; top: 15%; width: 39%; height: 70%; transform: rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) { .ha-shell *, .ha-shell *::before, .ha-shell *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
      `}</style>
      <header className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${solid ? 'border-white/10 bg-[#120c10]/95 shadow-[0_10px_35px_rgba(20,10,14,.18)] backdrop-blur-md' : 'border-transparent bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to={path('/')} className="flex items-center gap-3" aria-label="ℋ Agency 首页">
            <img src="/hagency/logo.jpg" alt="" className="h-10 w-10 rounded-full border border-white/15 object-cover" />
            <span><span className="block font-display text-xl italic leading-none text-[#e9c0ca]">ℋ Agency</span><span className="mt-0.5 block text-[9px] tracking-[0.32em] text-white/40">希望公会</span></span>
          </Link>
          <nav className="hidden items-center gap-6 xl:flex" aria-label={lang === 'zh' ? '主要导航' : 'Primary navigation'}>
            {items.map(([key, href]) => (
              <NavLink key={key} to={path(href)} end={href === '/'} className={({ isActive }) => `relative py-2 text-sm transition ${isActive ? 'text-[#efced6]' : 'text-white/55 hover:text-white'} after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-[#d99eb0] after:transition-transform ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`}>
                {t.nav[key]}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(value => value === 'zh' ? 'en' : 'zh')} className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[10px] text-[#edcbd3] transition hover:border-[#d99eb0]" aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}>{lang === 'zh' ? 'EN' : '中文'}</button>
            <Link to={path('/join')} className="hidden rounded-full bg-[#e6bcc7] px-4 py-2 text-xs font-semibold text-[#24171c] transition hover:bg-white sm:block">{t.nav.join}</Link>
            <button onClick={() => setMenuOpen(open => !open)} className="flex h-9 w-9 items-center justify-center text-xl text-[#edcbd3] xl:hidden" aria-expanded={menuOpen} aria-label={lang === 'zh' ? '打开菜单' : 'Open menu'}>{menuOpen ? '×' : '☰'}</button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#120c10] px-6 pb-6 pt-3 xl:hidden">
            {items.map(([key, href]) => <NavLink key={key} to={path(href)} end={href === '/'} className={({ isActive }) => `block border-b border-white/10 py-3 text-sm ${isActive ? 'text-[#efced6]' : 'text-white/55'}`}>{t.nav[key]}</NavLink>)}
            <Link to={path('/join')} className="mt-5 block rounded-full bg-[#e6bcc7] px-5 py-3 text-center text-sm font-semibold text-[#24171c]">{t.nav.join}</Link>
          </nav>
        )}
      </header>

      <main key={location.pathname} className="ha-page">{children}</main>

      <footer className="bg-[#120c10] py-14 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><div className="flex items-center gap-4"><img src="/hagency/logo.jpg" alt="ℋ Agency 希望公会" className="h-16 w-16 rounded-full object-cover" /><div><p className="font-display text-3xl text-[#edcbd3]">ℋ Agency</p><p className="mt-1 text-[10px] tracking-[0.3em] text-white/40">希望公会</p></div></div><p className="mt-5 max-w-md text-sm leading-7 text-white/40">{t.footerLine}</p></div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-white/50 sm:grid-cols-3">
              {items.slice(1).map(([key, href]) => <Link key={key} to={path(href)} className="transition hover:text-[#edcbd3]">{t.nav[key]}</Link>)}
              <Link to={path('/join')} className="transition hover:text-[#edcbd3]">{t.nav.join}</Link>
              <a href="https://www.instagram.com/h_agency21/" target="_blank" rel="noopener noreferrer" className="transition hover:text-[#edcbd3]">Instagram ↗</a>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-7 text-[10px] uppercase tracking-[0.16em] text-white/30 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 ℋ Agency 希望公会. All rights reserved.</p><a href="https://www.jeeprod.com/" className="transition hover:text-white/55">Powered by jeeprod.com</a></div>
        </div>
      </footer>
    </div>
  )
}
