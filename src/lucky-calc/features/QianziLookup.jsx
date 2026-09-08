import { useRef, useState } from 'react'
import { ErrorState, NumberDigits, SectionIntro } from '../components/Common'
import { isValidFourD, sanitizeFourDInput } from '../lib/fourD'

const QIANZI_API_URL = import.meta.env.VITE_LUCKY_QIANZI_API_URL || 'https://vercel-proxy-chi-coral.vercel.app/api/search'

export default function QianziLookup() {
  const [input, setInput] = useState('')
  const [number, setNumber] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const resultRef = useRef(null)

  const lookup = async event => {
    event?.preventDefault()
    if (!isValidFourD(input)) {
      setError('请输入完整的 4 位号码')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setImageFailed(false)
    try {
      const response = await fetch(`${QIANZI_API_URL}?num=${input}`, { signal: AbortSignal.timeout(12_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (!data.image && !data.cn) throw new Error('没有找到对应的千字图')
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
        eyebrow="NUMBER DICTIONARY"
        title="千字图查询"
        description="输入 0000–9999 之间的四位号码，查看对应的传统图像与释义。"
      />

      <div className="lc-tool-split">
        <section className="lc-panel lc-form-panel">
          <div className="lc-panel-illustration">
            <img src="/luck-calc/caishen.gif" alt="" aria-hidden="true" />
          </div>
          <form onSubmit={lookup}>
            <label htmlFor="lc-qianzi-number">4D 号码</label>
            <input
              id="lc-qianzi-number"
              className="lc-input lc-input-number"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="0000"
              value={input}
              onChange={event => setInput(sanitizeFourDInput(event.target.value))}
            />
            <button type="submit" className="lc-btn lc-btn-primary lc-btn-block" disabled={loading}>
              {loading ? '查询中…' : '查询千字图'}
            </button>
          </form>
          {error && <ErrorState message={error} onRetry={isValidFourD(input) ? lookup : undefined} />}
        </section>

        <section className="lc-panel lc-qianzi-result" aria-live="polite">
          {!result && !loading && (
            <div className="lc-empty-state">
              <span aria-hidden="true">▧</span>
              <h3>千字图会显示在这里</h3>
              <p>结果包括传统图像、中文名称与英文释义。</p>
            </div>
          )}
          {result && (
            <div ref={resultRef} tabIndex={-1}>
              <p className="lc-eyebrow">查询号码</p>
              <NumberDigits value={number} size="hero" />
              <figure className="lc-qianzi-figure">
                {result.image && !imageFailed ? (
                  <img src={result.image} alt={`${number} ${result.cn || '千字图'}`} referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
                ) : (
                  <div className="lc-image-fallback"><span>{result.image ? '图像暂时无法载入' : '此资料源提供文字释义'}</span></div>
                )}
              </figure>
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
