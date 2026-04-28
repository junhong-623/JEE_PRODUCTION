import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

const Home             = lazy(() => import('./pages/Home'))
const Redirect         = lazy(() => import('./pages/Redirect'))
const Calculator       = lazy(() => import('./pages/Calculator'))
const UnserializeTool  = lazy(() => import('./pages/UnserializeTool'))
const MatetripPage     = lazy(() => import('./pages/Matetrip'))
const MatetripIntroPage = lazy(() => import('./pages/MatetripIntro'))
const MatetripAdminPage = lazy(() => import('./pages/MatetripAdmin'))
const HAgencyPage      = lazy(() => import('./pages/HAgency'))
const HAgencyAdminPage = lazy(() => import('./pages/HAgencyAdminPage'))
const LuckyCalc        = lazy(() => import('./pages/LuckyCalc'))
const MallPage         = lazy(() => import('./pages/Mall'))
const MallAdminPage    = lazy(() => import('./pages/MallAdmin'))
const FlowchartPage    = lazy(() => import('./pages/Flowchart'))
const JSavePage        = lazy(() => import('./pages/JSave'))
const JSaveIntroPage   = lazy(() => import('./pages/JSaveIntro'))

function NotFound() {
  useEffect(() => { window.location.replace('/404.html') }, [])
  return null
}

function ensureHeadTag(selector, createTag) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = createTag()
    document.head.appendChild(element)
  }

  return element
}

export default function App() {
  const { loading, admin } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const favicon = document.querySelector('#app-favicon')
    const isMatetrip = location.pathname.startsWith('/matetrip') && !location.pathname.startsWith('/matetrip-admin')
    const isMall = location.pathname.startsWith('/mall') && !location.pathname.startsWith('/mall/admin')
    const isJSave = location.pathname.startsWith('/jsave')

    const manifest = ensureHeadTag('link[data-app-manifest]', () => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'manifest')
      link.setAttribute('data-app-manifest', 'true')
      return link
    })
    const appleTouchIcon = ensureHeadTag('link[rel="apple-touch-icon"]', () => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'apple-touch-icon')
      return link
    })
    const themeColor = ensureHeadTag('meta[name="theme-color"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      return meta
    })
    const appleTitle = ensureHeadTag('meta[name="apple-mobile-web-app-title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'apple-mobile-web-app-title')
      return meta
    })
    const appleCapable = ensureHeadTag('meta[name="apple-mobile-web-app-capable"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'apple-mobile-web-app-capable')
      return meta
    })
    const appleStatusBar = ensureHeadTag('meta[name="apple-mobile-web-app-status-bar-style"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
      return meta
    })
    const viewport = ensureHeadTag('meta[name="viewport"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'viewport')
      return meta
    })

    // Per-app PWA config
    const cfg = isJSave
      ? {
          manifest: '/jsave/manifest.json',
          favicon: '/jsave/icons/icon-192.png',
          faviconType: 'image/png',
          touchIcon: '/jsave/icons/icon-512.png',
          theme: '#10b981',
          title: 'JSave',
          statusBar: 'black-translucent',
          viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        }
      : isMatetrip
      ? {
          manifest: '/matetrip/manifest.json',
          favicon: '/matetrip/icons/icon-192.png',
          faviconType: 'image/png',
          touchIcon: '/matetrip/icons/icon-512.png',
          theme: '#c97b4b',
          title: 'MateTrip',
          statusBar: 'default',
          viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        }
      : isMall
      ? {
          manifest: '/mall/manifest.json',
          favicon: '/logo.svg',
          faviconType: 'image/svg+xml',
          touchIcon: '/logo.svg',
          theme: '#0d1f09',
          title: 'JeeProd Mall',
          statusBar: 'black-translucent',
          viewport: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover',
        }
      : {
          manifest: '/manifest.webmanifest',
          favicon: '/logo.svg',
          faviconType: 'image/svg+xml',
          touchIcon: '/logo.svg',
          theme: '#eeeedd',
          title: 'Jee Production',
          statusBar: 'black-translucent',
          viewport: 'width=device-width, initial-scale=1.0',
        }

    if (favicon) {
      favicon.setAttribute('href', cfg.favicon)
      favicon.setAttribute('type', cfg.faviconType)
    }

    manifest.setAttribute('href', cfg.manifest)
    appleTouchIcon.setAttribute('href', cfg.touchIcon)
    themeColor.setAttribute('content', cfg.theme)
    appleTitle.setAttribute('content', cfg.title)
    appleCapable.setAttribute('content', 'yes')
    appleStatusBar.setAttribute('content', cfg.statusBar)
    viewport.setAttribute('content', cfg.viewport)
    document.title = cfg.title
  }, [location.pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center aurora-bg">
        <img src="/logo.svg" alt="Loading" className="w-16 animate-pulse" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center aurora-bg">
        <img src="/logo.svg" alt="Loading" className="w-16 animate-pulse" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/matetrip/intro" element={<MatetripIntroPage />} />
        <Route path="/matetrip" element={<MatetripPage />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/unserialize" element={<UnserializeTool />} />
        <Route path="/portfolio/:slug" element={<Redirect type="portfolio" />} />
        <Route path="/bookmarks/:slug" element={<Redirect type="bookmark" />} />
        <Route path="/matetrip-admin/*" element={admin ? <MatetripAdminPage /> : <Navigate to="/" replace />} />
        <Route path="/h-agency" element={<HAgencyPage />} />
        <Route path="/h-agency/admin" element={admin ? <HAgencyAdminPage /> : <Navigate to="/" replace />} />
        <Route path="/lucky-calc" element={<LuckyCalc />} />
        <Route path="/mall/admin/*" element={admin ? <MallAdminPage /> : <Navigate to="/" replace />} />
        <Route path="/mall/*" element={<MallPage />} />
        <Route path="/flowchart/*" element={<FlowchartPage />} />
        <Route path="/jsave-intro" element={<JSaveIntroPage />} />
        <Route path="/jsave/*" element={<JSavePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
