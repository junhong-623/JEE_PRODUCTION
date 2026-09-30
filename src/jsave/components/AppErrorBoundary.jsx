import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('JSave page failed to render', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children

    const zh = this.props.lang === 'zh'
    return (
      <div className={`jsave-recovery${this.props.fullscreen ? ' jsave-recovery-fullscreen' : ''}`} role="alert">
        <div className="jsave-recovery-card">
          <span className="jsave-recovery-icon" aria-hidden="true">↻</span>
          <h2>{zh ? '这个页面暂时无法显示' : 'This page could not load'}</h2>
          <p>{zh
            ? '可能是连接中断或 JSave 刚更新。请重新载入，已保存的记录不会因此删除。'
            : 'Your connection may have dropped, or JSave may have just updated. Reloading will not delete saved records.'}</p>
          <div className="jsave-recovery-actions">
            <button type="button" className="jsave-btn-primary" onClick={() => window.location.reload()}>
              {zh ? '重新载入' : 'Reload'}
            </button>
            {this.props.onHome && (
              <button type="button" className="jsave-btn-ghost" onClick={this.props.onHome}>
                {zh ? '返回首页' : 'Go to home'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
