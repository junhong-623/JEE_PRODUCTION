import { Link } from 'react-router-dom'
import { Seo } from './components'
import { useHAgencySite } from './SiteContext'

export default function NotFoundPage() {
  const { lang, path } = useHAgencySite()
  const zh = lang === 'zh'
  return <div className="flex min-h-screen items-center justify-center bg-[#120c10] px-6 text-center text-white"><Seo title="404" description="ℋ Agency" /><div><p className="font-display text-8xl text-[#e6bcc7]">404</p><h1 className="mt-5 font-display text-4xl">{zh ? '这个页面暂时没有登场' : 'This page is not on stage'}</h1><Link to={path('/')} className="mt-8 inline-flex rounded-full bg-[#e6bcc7] px-6 py-3 text-sm font-semibold text-[#24171c]">{zh ? '返回首页' : 'Back home'}</Link></div></div>
}
