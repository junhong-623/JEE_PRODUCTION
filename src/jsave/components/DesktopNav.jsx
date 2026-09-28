import { useLang } from '../contexts/LangContext'

const PAGES = [
  { key: 'dashboard', label: 'navDashboard', number: '01' },
  { key: 'calendar', label: 'navCalendar', number: '02' },
  { key: 'reports', label: 'navReports', number: '03' },
  { key: 'goals', label: 'navGoals', number: '04' },
  { key: 'settings', label: 'navSettings', number: '05' },
]

export default function DesktopNav({ active, onChange, onAdd }) {
  const { t, lang } = useLang()

  return (
    <aside className="jsave-desktop-sidebar">
      <div className="jsave-desktop-brand" aria-label="JSave">
        <span className="jsave-desktop-brand-mark">J</span>
        <span><strong>JSave</strong><small>{lang === 'zh' ? 'J样省钱，J样享受' : 'J-Save, J-Joy'}</small></span>
      </div>
      <div className="jsave-desktop-nav-label">{lang === 'zh' ? '工作空间' : 'WORKSPACE'}</div>
      <nav className="jsave-desktop-nav" aria-label={t('mainNavigation')}>
        {PAGES.map(({ key, label, number }) => (
          <button
            key={key}
            type="button"
            className={`jsave-desktop-nav-item${active === key ? ' active' : ''}`}
            aria-current={active === key ? 'page' : undefined}
            onClick={() => onChange(key)}
          >
            <span className="jsave-desktop-nav-number">{number}</span>
            <span>{t(label)}</span>
            <span className="jsave-desktop-nav-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </nav>
      <button type="button" className="jsave-desktop-add" onClick={onAdd}>
        <span aria-hidden="true">＋</span>{t('addTransaction')}
      </button>
      <div className="jsave-desktop-sidebar-foot">JSAVE / {new Date().getFullYear()}</div>
    </aside>
  )
}
