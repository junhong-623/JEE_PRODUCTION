export function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h8M16 7h4M12 4v6M4 17h4M12 17h8M8 14v6" />
    </svg>
  )
}

export default function PageHeader({ code, title, onOpenSettings, settingsLabel = 'Settings', action = null }) {
  return (
    <header className="jsave-page-header">
      <div className="jsave-page-heading">
        <div className="jsave-page-mark">J</div>
        <div>
          <div className="jsave-page-code">{code}</div>
          <div className="jsave-page-title">{title}</div>
        </div>
      </div>
      {(action || onOpenSettings) && (
        <div className="jsave-page-actions">
          {action}
          {onOpenSettings && (
            <button className="jsave-header-action" type="button" onClick={onOpenSettings} aria-label={settingsLabel} title={settingsLabel}>
              <SettingsIcon />
            </button>
          )}
        </div>
      )}
    </header>
  )
}
