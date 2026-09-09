import { useRef, useState } from 'react'
import { ErrorState, NumberDigits, SectionIntro } from '../components/Common'
import { isValidQianziNumber, sanitizeFourDInput } from '../lib/fourD'

const QIANZI_API_URL = import.meta.env.VITE_LUCKY_QIANZI_API_URL || 'https://vercel-proxy-chi-coral.vercel.app/api/search'

export default function QianziLookup() {
  const [input, setInput] = useState('')
  const [number, setNumber] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef(null)

  const lookup = async event => {
    event?.preventDefault()
    if (!isValidQianziNumber(input)) {
      setError('请输入 1–4 位号码')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${QIANZI_API_URL}?num=${encodeURIComponent(input)}`, { signal: AbortSignal.timeout(12_000) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      if (data.error) throw new Error(data.error)
      if (!data.cn && !data.meanings?.length) throw new Error('这个号码暂时没有收录释义')
      setNumber(input)
      setResult(data)
      window.setTimeout(() => resultRef.current?.focus(), 0)
    } catch (fetchError) {
      setError(fetchError.name === 'TimeoutError' ? '查询超时，请稍后重试' : fetchError.message || '查询失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lc-page">
      <SectionIntro
        title="千字图查询"
        description="输入 1–4 位号码查询传统释义。系统会保留原始位数，001 与 0001 会分别查询。"
      />

      <div className="lc-tool-split">
        <section className="lc-panel lc-form-panel">
          <div className="lc-panel-illustration">
            <img src="/luck-calc/caishen.gif" alt="" aria-hidden="true" />
          </div>
          <form onSubmit={lookup}>
            <label htmlFor="lc-qianzi-number">号码（1–4 位）</label>
            <input
              id="lc-qianzi-number"
              className="lc-input lc-input-number"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="例如 001 或 0001"
              value={input}
              onChange={event => setInput(sanitizeFourDInput(event.target.value))}
            />
            <button type="submit" className="lc-btn lc-btn-primary lc-btn-block" disabled={loading}>
              {loading ? '查询中…' : '查询千字图'}
            </button>
          </form>
          <p className="lc-field-hint">不会自动补零：1、001、0001 会被视为不同号码。</p>
          {error && <ErrorState message={error} onRetry={isValidQianziNumber(input) ? lookup : undefined} />}
        </section>

        <section className="lc-panel lc-qianzi-result" aria-live="polite">
          {!result && !loading && (
            <div className="lc-empty-state">
              <span aria-hidden="true">▧</span>
              <h3>号码释义会显示在这里</h3>
              <p>同一个号码在不同运营商的千字图中可能有不同解释。</p>
            </div>
          )}
          {result && (
            <div ref={resultRef} tabIndex={-1}>
              <p className="lc-eyebrow">查询号码</p>
              <NumberDigits value={number} size="hero" fixedLength={false} />
              {result.meanings?.length ? (
                <div className="lc-meaning-list">
                  {result.meanings.map(meaning => (
                    <article key={meaning.operator} className="lc-meaning-card">
                      <small>{meaning.operator}</small>
                      <strong>{meaning.cn || '暂无中文释义'}</strong>
                      {meaning.en && <span>{meaning.en}</span>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="lc-meaning-card">
                  <strong>{result.cn || '暂无中文释义'}</strong>
                  {result.en && <span>{result.en}</span>}
                </div>
              )}
              <p className="lc-source-note">文字释义来源：Fast4DKing · 不同运营商版本可能有所不同。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
