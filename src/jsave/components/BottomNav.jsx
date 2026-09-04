import { useLang } from '../contexts/LangContext'

// SVG icons matching the PhoneTabbar design
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const LedgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)
const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 12L12 7"/>
    <path d="M12 12L16.5 14.5"/>
  </svg>
)
const GoalsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const TABS = [
  { key: 'dashboard', labelKey: 'navDashboard', Icon: HomeIcon },
  { key: 'calendar',  labelKey: 'navCalendar',  Icon: LedgerIcon },
  { key: 'add',       labelKey: '',             Icon: null }, // center + button
  { key: 'reports',   labelKey: 'navReports',   Icon: ReportsIcon },
  { key: 'goals',     labelKey: 'navGoals',     Icon: GoalsIcon },
]

export default function BottomNav({ active, onChange }) {
  const { t } = useLang()

  return (
    <nav aria-label={t('mainNavigation')} style={{
      position: 'fixed',
      bottom: 0, left: 14, right: 14,
      marginBottom: 'env(safe-area-inset-bottom, 12px)',
      padding: '8px',
      borderRadius: 24,
      background: 'rgba(8,18,32,0.78)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid rgba(241,245,249,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 200,
    }}>
      {TABS.map(tab => {
        // Center + button
        if (tab.key === 'add') {
          return (
            <button
              key="add"
              aria-label={t('addTransaction')}
              onClick={() => onChange('add')}
              style={{
                width: 44, height: 44,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 6px 18px rgba(16,185,129,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                color: '#04140d',
                fontSize: 22,
                fontWeight: 600,
                flexShrink: 0,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ＋
            </button>
          )
        }

        const isActive = active === tab.key
        const { Icon } = tab

        return (
          <button
            key={tab.key}
            aria-label={t(tab.labelKey)}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--js-emerald)' : 'rgba(241,245,249,0.4)',
              transition: 'color 0.15s',
            }}
          >
            <Icon />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              {t(tab.labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
