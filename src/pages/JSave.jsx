import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import JSaveApp from '../jsave/App'
import { JSAVE_BASE } from '../jsave/utils/basePath'

export default function JSavePage() {
  useEffect(() => {
    document.documentElement.classList.add('jsave-html')
    document.body.classList.add('jsave-body')

    if ('serviceWorker' in navigator) {
      const swPath  = `${JSAVE_BASE}/sw.js`
      const scope   = JSAVE_BASE ? `${JSAVE_BASE}/` : '/'
      navigator.serviceWorker.register(swPath, { scope }).catch(() => {})
    }

    return () => {
      document.documentElement.classList.remove('jsave-html')
      document.body.classList.remove('jsave-body')
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>JSave — J-Save, J-Joy</title>
        <meta name="description" content="JSave: track savings, spending, and daily costs. J样省钱，J样享受！" />
        <meta property="og:title" content="JSave — J省" />
        <meta property="og:description" content="J-Save, J-Joy. Your personal finance tracker." />
        <meta property="og:url" content="https://www.jeeprod.com/jsave" />
        <meta property="og:image" content="https://www.jeeprod.com/jsave/icons/icon-512.png" />
        <link rel="canonical" href="https://www.jeeprod.com/jsave" />
      </Helmet>
      <JSaveApp />
    </>
  )
}
