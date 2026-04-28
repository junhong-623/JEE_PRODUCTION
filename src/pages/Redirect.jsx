import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { getEntry } from '../lib/projects'
import Navbar from '../components/Navbar'

export default function Redirect({ type }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const [entry, setEntry] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    setEntry(null)
    setNotFound(false)
    setCountdown(3)

    getEntry(type, slug)
      .then((item) => {
        if (!item || !item.visible) {
          setNotFound(true)
          return
        }
        setEntry(item)
      })
      .catch(() => setNotFound(true))
  }, [slug, type])

  const openDestination = () => {
    if (!entry?.url) return
    window.open(entry.url, '_blank', 'noopener,noreferrer')
    navigate('/')
  }

  useEffect(() => {
    if (!entry?.url) return
    if (countdown <= 0) {
      openDestination()
      return
    }

    const timerId = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timerId)
  }, [entry, countdown])

  const title = lang === 'zh' && entry?.titleZh ? entry.titleZh : entry?.title
  const description = lang === 'zh' && entry?.descriptionZh ? entry.descriptionZh : entry?.description
  const host = (() => {
    try {
      return entry?.url ? new URL(entry.url).hostname.replace(/^www\./, '') : ''
    } catch {
      return ''
    }
  })()
  const progress = `${((3 - countdown) / 3) * 100}%`

  return (
    <div className="min-h-screen midnight-bg text-paper">
      <Navbar />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[16%] h-64 w-64 -translate-x-1/2 rounded-full bg-accent/14 blur-3xl" />
          <div className="absolute bottom-[14%] right-[12%] h-56 w-56 rounded-full bg-emerald-400/12 blur-3xl" />
        </div>
        {notFound ? (
          <div className="space-y-4 animate-fade-up">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-paper/35">404</p>
            <h1 className="font-display text-3xl md:text-4xl">{t('notFound')}</h1>
            <Link to="/" className="text-sm text-paper/55 transition-colors hover:text-paper">
              {t('backHome')}
            </Link>
          </div>
        ) : entry ? (
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.6rem] border border-paper/10 bg-[#11161b]/86 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.34)] backdrop-blur md:p-12">
            <div className="absolute right-[-3rem] top-[-3rem] opacity-[0.06]">
              <img src="/logo.svg" alt="" className="w-52 md:w-72" />
            </div>
            <div className="relative grid items-center gap-10 animate-fade-up md:grid-cols-[0.95fr_1.05fr] md:text-left">
              <div className="space-y-6">
                <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-paper/8 bg-paper/10 shadow-sm md:mx-0">
                  {entry.iconUrl ? (
                    <img src={entry.iconUrl} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-5xl text-paper/35">
                      {title?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-xs uppercase tracking-[0.32em] text-paper/35">
                    {t('opening')}
                  </p>
                  <h1 className="font-display text-4xl leading-none md:text-6xl">{title}</h1>
                  {description && (
                    <p className="max-w-lg text-sm leading-7 text-paper/62">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-paper/10 bg-paper/[0.05] p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-[0.26em] text-paper/35">
                      {t('redirectIn')}
                    </span>
                    <span className="font-display text-4xl leading-none">{countdown}</span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-paper/10">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-1000"
                      style={{ width: progress }}
                    />
                  </div>

                  <div className="mt-5 rounded-[1.4rem] border border-paper/8 bg-black/20 px-4 py-3 text-left">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper/35">
                      {t('destination')}
                    </p>
                    <p className="mt-2 font-display text-2xl leading-none">{host || t('externalSite')}</p>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block break-all text-sm text-paper/60 transition-colors hover:text-accent"
                    >
                      {entry.url}
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openDestination}
                    className="rounded-full bg-accent px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.24em] text-paper transition-colors hover:bg-[#ff6d39]"
                  >
                    {t('openNow')}
                  </button>
                  <Link
                    to="/"
                    className="rounded-full border border-paper/12 px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.24em] transition-colors hover:border-paper"
                  >
                    {t('backHome')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-[2rem] border border-paper/10 bg-paper/10 p-8 animate-pulse">
            <div className="mx-auto h-24 w-24 rounded-[1.6rem] bg-paper/10" />
            <div className="mx-auto mt-6 h-8 w-40 rounded-full bg-paper/10" />
            <div className="mx-auto mt-4 h-4 w-56 rounded-full bg-paper/10" />
          </div>
        )}
      </main>
    </div>
  )
}
