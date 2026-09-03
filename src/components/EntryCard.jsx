import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

export default function EntryCard({ entry, index }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const title = lang === 'zh' && entry.titleZh ? entry.titleZh : entry.title
  const description = lang === 'zh' && entry.descriptionZh ? entry.descriptionZh : entry.description
  const typePath = entry.type === 'bookmark' ? 'bookmarks' : 'portfolio'

  const opensDirectly = Boolean(entry.externalDirect && entry.url)
  const openEntry = () => {
    if (opensDirectly) {
      window.location.assign(entry.url)
      return
    }
    navigate(entry.internalPath || `/${typePath}/${entry.slug}`)
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openEntry}
      onKeyDown={(event) => event.key === 'Enter' && openEntry()}
      className={`entry-card animate-fade-up stagger-${Math.min(index + 1, 5)}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] border border-ink/8 bg-paper shadow-sm dark:border-paper/8 dark:bg-ink-soft">
            {entry.iconUrl ? (
              <img src={entry.iconUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-ink/35 dark:text-paper/35">
                {title?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/35 dark:text-paper/35">
              {entry.type === 'bookmark' ? t('bookmarks') : t('portfolio')}
            </p>
            <h3 className="mt-2 font-display text-2xl leading-none">{title}</h3>
          </div>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/28 dark:text-paper/28">
          /{entry.slug}
        </span>
      </div>

      <p className="mt-6 min-h-[4.5rem] text-sm leading-7 text-ink/60 dark:text-paper/60">
        {description || t('entryFallback')}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-ink/8 pt-4 font-mono text-xs uppercase tracking-[0.2em] text-ink/38 dark:border-paper/8 dark:text-paper/38">
        <span>{entry.internalPath && !opensDirectly ? t('openApp') : t('openLink')}</span>
        <span className="transition-transform group-hover:translate-x-1">+</span>
      </div>
    </article>
  )
}
