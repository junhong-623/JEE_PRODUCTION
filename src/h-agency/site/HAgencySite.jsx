import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Route, Routes } from 'react-router-dom'
import AboutPage from './AboutPage'
import HighlightsPage from './HighlightsPage'
import HomePage from './HomePage'
import { HAgencyDataProvider } from './HAgencyData'
import JoinPage from './JoinPage'
import NotFoundPage from './NotFoundPage'
import ServicesPage from './ServicesPage'
import { SiteProvider } from './SiteContext'
import SiteLayout from './SiteLayout'
import TalentDetailPage from './TalentDetailPage'
import TalentsPage from './TalentsPage'
import UpdateDetailPage from './UpdateDetailPage'
import UpdatesPage from './UpdatesPage'
import { COPY } from './content'

export default function HAgencySite({ basePath = '' }) {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')
  const [lang, setLang] = useState(() => window.localStorage.getItem('hagency-language') === 'en' ? 'en' : 'zh')
  const path = useCallback(route => route === '/' ? (normalizedBase || '/') : `${normalizedBase}${route}`, [normalizedBase])
  const changeLanguage = useCallback(next => {
    setLang(current => {
      const value = typeof next === 'function' ? next(current) : next
      window.localStorage.setItem('hagency-language', value)
      return value
    })
  }, [])
  const value = useMemo(() => ({ lang, setLang: changeLanguage, t: COPY[lang], path, basePath: normalizedBase }), [lang, changeLanguage, path, normalizedBase])

  return (
    <SiteProvider value={value}>
      <HAgencyDataProvider>
        <Helmet><html lang={lang === 'zh' ? 'zh-CN' : 'en'} /></Helmet>
        <SiteLayout>
          <Routes>
            <Route path={path('/')} element={<HomePage />} />
            <Route path={path('/talents')} element={<TalentsPage />} />
            <Route path={path('/talents/:slug')} element={<TalentDetailPage />} />
            <Route path={path('/highlights')} element={<HighlightsPage />} />
            <Route path={path('/services')} element={<ServicesPage />} />
            <Route path={path('/about')} element={<AboutPage />} />
            <Route path={path('/updates')} element={<UpdatesPage />} />
            <Route path={path('/updates/:slug')} element={<UpdateDetailPage />} />
            <Route path={path('/join')} element={<JoinPage />} />
            <Route path={`${normalizedBase}/*`} element={<NotFoundPage />} />
          </Routes>
        </SiteLayout>
      </HAgencyDataProvider>
    </SiteProvider>
  )
}
