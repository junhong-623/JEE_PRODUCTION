import { useLang } from '../contexts/LangContext'

const TABS = [
  { key: 'dashboard', icon: '🏠' },
  { key: 'calendar',  icon: '📅' },
  { key: 'items',     icon: '🏷️' },
  { key: 'reports',   icon: '📊' },
  { key: 'settings',  icon: '⚙️' },
]

const LABEL_KEYS = {
  dashboard: 'navDashboard',
  calendar:  'navCalendar',
  items:     'navItems',
  reports:   'navReports',
  settings:  'navSettings',
}

export default function BottomNav({ active, onChange }) {
  const { t } = useLang()

  return (
    <nav className="jsave-bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`jsave-nav-btn${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="jsave-nav-icon">{tab.icon}</span>
          <span className="jsave-nav-label">{t(LABEL_KEYS[tab.key])}</span>
        </button>
      ))}
    </nav>
  )
}
