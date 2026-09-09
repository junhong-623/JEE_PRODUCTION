export function SectionIntro({ eyebrow, title, description, action, children }) {
  return (
    <section className="lc-section-intro">
      <div>
        {eyebrow && <p className="lc-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="lc-section-description">{description}</p>}
      </div>
      {action && <div className="lc-section-action">{action}</div>}
      {children}
    </section>
  )
}

export function LoadingState({ label = '资料载入中…' }) {
  return (
    <div className="lc-state" role="status" aria-live="polite">
      <span className="lc-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="lc-state lc-state-error" role="alert">
      <div>
        <strong>暂时无法载入</strong>
        <p>{message}</p>
      </div>
      {onRetry && <button type="button" className="lc-btn lc-btn-ghost" onClick={onRetry}>重试</button>}
    </div>
  )
}

export function NumberDigits({ value, size = 'normal', fixedLength = true }) {
  const rawValue = String(value ?? '')
  const digits = fixedLength ? (rawValue || '————').padStart(4, '—').slice(0, 4) : (rawValue || '—')
  return (
    <span className={`lc-number-digits lc-number-digits-${size}`} aria-label={`号码 ${value}`}>
      {[...digits].map((digit, index) => <span key={`${index}-${digit}`}>{digit}</span>)}
    </span>
  )
}

export function DataFreshness({ manifest, compact = false }) {
  if (!manifest) return null
  const latestDate = Object.values(manifest.coverage || {})
    .map(item => item.to)
    .filter(Boolean)
    .sort()
    .at(-1)
  return (
    <div className={`lc-freshness ${compact ? 'lc-freshness-compact' : ''}`}>
      <span className="lc-live-dot" aria-hidden="true" />
      <span>历史资料更新至 {latestDate || '—'}</span>
    </div>
  )
}

export function ResultRow({ label, value, highlight = false }) {
  return (
    <div className={`lc-result-row ${highlight ? 'is-highlighted' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

