import { useLang } from '../contexts/LangContext'

export default function LoadingScreen() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <div
      className="jsave-loading-screen"
      role="status"
      aria-live="polite"
      aria-label={zh ? 'JSave 正在载入' : 'JSave is loading'}
    >
      <div className="jsave-loading-glow jsave-loading-glow-left" aria-hidden="true" />
      <div className="jsave-loading-glow jsave-loading-glow-right" aria-hidden="true" />
      <div className="jsave-loading-grid" aria-hidden="true" />

      <div className="jsave-loading-content">
        <div className="jsave-loading-mark" aria-hidden="true">
          <span>J</span>
          <i />
        </div>
        <p className="jsave-loading-brand">JSave</p>
        <h1>{zh ? '花得清楚，存得从容。' : 'Spend clearly. Save calmly.'}</h1>
        <div className="jsave-loading-progress" aria-hidden="true"><i /></div>
        <p className="jsave-loading-status">
          {zh ? '正在准备你的空间' : 'Preparing your space'}<span aria-hidden="true">…</span>
        </p>
        <p className="jsave-loading-note"><i aria-hidden="true" />{zh ? '离线可用 · 资料按账号隔离' : 'Offline ready · Private by account'}</p>
      </div>
    </div>
  )
}
