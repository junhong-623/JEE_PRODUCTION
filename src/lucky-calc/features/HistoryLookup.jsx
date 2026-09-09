import { useEffect, useMemo, useRef, useState } from 'react'
import { DataFreshness, ErrorState, LoadingState, NumberDigits, SectionIntro } from '../components/Common'
import {
  decodeHistoryRows,
  decodeSuffixRows,
  formatDrawDate,
  historyShardUrl,
  isValidFourD,
  OPERATOR_LABELS,
  PRIZE_LABELS,
  PRIZE_ORDER,
  sanitizeFourDInput,
  summarizeHistory,
  suffixShardUrl,
} from '../lib/fourD'

const shardCache = new Map()
const suffixShardCache = new Map()

async function loadShard(number) {
  const url = historyShardUrl(number)
  if (shardCache.has(url)) return shardCache.get(url)
  const request = fetch(url).then(response => {
    if (!response.ok) throw new Error('历史资料尚未部署')
    return response.json()
  })
  shardCache.set(url, request)
  try {
    return await request
  } catch (error) {
    shardCache.delete(url)
    throw error
  }
}

async function loadSuffixShard(number) {
  const url = suffixShardUrl(number)
  if (suffixShardCache.has(url)) return suffixShardCache.get(url)
  const request = fetch(url).then(response => {
    if (!response.ok) throw new Error('后三位索引尚未部署')
    return response.json()
  })
  suffixShardCache.set(url, request)
  try {
    return await request
  } catch (error) {
    suffixShardCache.delete(url)
    throw error
  }
}

function FilterButton({ active, children, onClick }) {
  return <button type="button" className={`lc-filter ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onClick}>{children}</button>
}

export default function HistoryLookup({ initialNumber = '', onSearched }) {
  const [input, setInput] = useState(sanitizeFourDInput(initialNumber))
  const [number, setNumber] = useState('')
  const [records, setRecords] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [operator, setOperator] = useState('all')
  const [prize, setPrize] = useState('all')
  const [sort, setSort] = useState('desc')
  const [includeSuffixTop, setIncludeSuffixTop] = useState(false)
  const [suffixRecords, setSuffixRecords] = useState([])
  const [suffixLoading, setSuffixLoading] = useState(false)
  const [suffixError, setSuffixError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    fetch('/luck-calc/data/manifest.json', { cache: 'no-cache' })
      .then(response => response.ok ? response.json() : null)
      .then(setManifest)
      .catch(() => {})
  }, [])

  const search = async value => {
    const query = sanitizeFourDInput(value ?? input)
    setInput(query)
    if (!isValidFourD(query)) {
      setError('请输入完整的 4 位号码，例如 0063')
      return
    }
    setLoading(true)
    setError('')
    setOperator('all')
    setPrize('all')
    try {
      const shard = await loadShard(query)
      const decoded = decodeHistoryRows(shard[query] || [])
      setNumber(query)
      setRecords(decoded)
      onSearched?.(query)
      window.setTimeout(() => resultRef.current?.focus(), 0)
    } catch (fetchError) {
      setError(fetchError.message || '历史资料载入失败')
      setRecords(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const next = sanitizeFourDInput(initialNumber)
    if (isValidFourD(next) && next !== number) search(next)
    // Search only when navigation supplies a new number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNumber])

  const loadSuffixMatches = async query => {
    if (!isValidFourD(query)) return
    setSuffixLoading(true)
    setSuffixError('')
    try {
      const shard = await loadSuffixShard(query)
      const decoded = decodeSuffixRows(shard[query.slice(-3)] || [])
        .filter(record => record.number !== query)
      setSuffixRecords(decoded)
    } catch (fetchError) {
      setSuffixRecords([])
      setSuffixError(fetchError.message || '后三位记录载入失败')
    } finally {
      setSuffixLoading(false)
    }
  }

  useEffect(() => {
    if (!includeSuffixTop) {
      setSuffixRecords([])
      setSuffixError('')
      return
    }
    if (number) loadSuffixMatches(number)
    // Fetch only when the toggle or searched number changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSuffixTop, number])

  const filtered = useMemo(() => {
    if (!records) return []
    return records
      .filter(record => operator === 'all' || record.operator === operator)
      .filter(record => prize === 'all' || record.prize === prize)
      .sort((a, b) => sort === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  }, [records, operator, prize, sort])

  const summary = useMemo(() => summarizeHistory(records || []), [records])
  const filteredSuffix = useMemo(() => suffixRecords
    .filter(record => operator === 'all' || record.operator === operator)
    .filter(record => prize === 'all' || record.prize === prize)
    .sort((a, b) => sort === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)),
  [suffixRecords, operator, prize, sort])

  return (
    <div className="lc-page">
      <SectionIntro
        eyebrow="NUMBER HISTORY"
        title="4D 号码历史"
        description="查询一个 4D 号码在三大运营商的公开历史中曾获得的奖项。"
        action={<DataFreshness manifest={manifest} />}
      />

      <div className="lc-history-layout">
        <aside className="lc-search-panel">
          <form onSubmit={event => { event.preventDefault(); search() }}>
            <label htmlFor="lc-history-number">4D 号码</label>
            <div className="lc-number-search">
              <input
                id="lc-history-number"
                className="lc-input lc-input-number"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="0000"
                value={input}
                onChange={event => setInput(sanitizeFourDInput(event.target.value))}
                aria-describedby="lc-history-hint"
              />
              <button className="lc-btn lc-btn-primary" type="submit" disabled={loading}>查询历史</button>
            </div>
            <p id="lc-history-hint" className="lc-field-hint">前导零会被保留，例如 0063。</p>
          </form>

          <label className="lc-checkbox-option">
            <input
              type="checkbox"
              checked={includeSuffixTop}
              onChange={event => setIncludeSuffixTop(event.target.checked)}
            />
            <span>
              <strong>同时查后三位相同的前三奖</strong>
              <small>例如查询 1234，也显示 0234、5234 等头、二、三奖记录。</small>
            </span>
          </label>

          {records && (
            <div className="lc-history-summary">
              <div className="lc-summary-number">
                <span>查询号码</span>
                <NumberDigits value={number} size="large" />
              </div>
              <div className="lc-summary-grid">
                <div><strong>{summary.total}</strong><span>历史记录</span></div>
                <div><strong>{summary.lastWin ? formatDrawDate(summary.lastWin) : '—'}</strong><span>最近一次</span></div>
              </div>
              <div className="lc-prize-counts">
                {PRIZE_ORDER.map(key => <div key={key}><span>{PRIZE_LABELS[key]}</span><strong>{summary.byPrize[key]}</strong></div>)}
              </div>
            </div>
          )}

          {manifest && (
            <details className="lc-coverage">
              <summary>查看资料覆盖范围</summary>
              {Object.entries(manifest.coverage).map(([key, value]) => (
                <p key={key}><strong>{OPERATOR_LABELS[key]}</strong><span>{value.from} — {value.to}</span></p>
              ))}
              <a href={manifest.source} target="_blank" rel="noreferrer">资料源与方法说明 ↗</a>
            </details>
          )}
        </aside>

        <section className="lc-history-results" aria-live="polite">
          {loading && <LoadingState label="正在查询历史记录…" />}
          {!loading && error && <ErrorState message={error} onRetry={isValidFourD(input) ? () => search() : undefined} />}
          {!loading && records === null && !error && (
            <div className="lc-empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>输入一个 4D 号码</h3>
              <p>我们会在约 34 万条历史中进行查询。</p>
            </div>
          )}
          {!loading && records && (
            <>
              <header className="lc-results-toolbar" tabIndex={-1} ref={resultRef}>
                <div>
                  <p className="lc-eyebrow">SEARCH RESULT</p>
                  <h3>{number} · {filtered.length} 条结果</h3>
                </div>
                <button type="button" className="lc-btn lc-btn-ghost" onClick={() => setSort(value => value === 'desc' ? 'asc' : 'desc')}>
                  {sort === 'desc' ? '↓ 最新优先' : '↑ 最旧优先'}
                </button>
              </header>

              <div className="lc-filter-groups">
                <div aria-label="运营商筛选">
                  <FilterButton active={operator === 'all'} onClick={() => setOperator('all')}>全部运营商</FilterButton>
                  {Object.entries(OPERATOR_LABELS).map(([key, label]) => <FilterButton key={key} active={operator === key} onClick={() => setOperator(key)}>{label}</FilterButton>)}
                </div>
                <div aria-label="奖项筛选">
                  <FilterButton active={prize === 'all'} onClick={() => setPrize('all')}>全部奖项</FilterButton>
                  {PRIZE_ORDER.map(key => <FilterButton key={key} active={prize === key} onClick={() => setPrize(key)}>{PRIZE_LABELS[key]}</FilterButton>)}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="lc-empty-state lc-empty-state-compact">
                  <h3>在目前资料覆盖范围内没有找到记录</h3>
                  <p>可以清除筛选条件或查询其他号码。</p>
                </div>
              ) : (
                <div className="lc-timeline">
                  {filtered.map((record, index) => (
                    <article key={`${record.operator}-${record.date}-${record.prize}-${record.drawNo}-${index}`} className={`lc-history-row lc-prize-${record.prize}`}>
                      <time dateTime={record.date}>{formatDrawDate(record.date)}</time>
                      <div>
                        <strong>{PRIZE_LABELS[record.prize] || record.prize}</strong>
                        <span>{OPERATOR_LABELS[record.operator] || record.operator}</span>
                      </div>
                      <span className="lc-draw-number">Draw {record.drawNo}</span>
                    </article>
                  ))}
                </div>
              )}
              {includeSuffixTop && (
                <section className="lc-suffix-results" aria-label="后三位相同的前三奖记录">
                  <header>
                    <div>
                      <p className="lc-eyebrow">LAST 3 DIGITS · TOP PRIZES</p>
                      <h3>后三位 {number.slice(-3)} 相同 · {filteredSuffix.length} 条</h3>
                    </div>
                    <span>不包括 {number} 本身</span>
                  </header>
                  {suffixLoading && <LoadingState label="正在载入后三位记录…" />}
                  {!suffixLoading && suffixError && <ErrorState message={suffixError} onRetry={() => loadSuffixMatches(number)} />}
                  {!suffixLoading && !suffixError && filteredSuffix.length === 0 && (
                    <div className="lc-empty-state lc-empty-state-compact">
                      <h3>没有符合当前筛选的前三奖记录</h3>
                      <p>这里只收录完整号码不同、后三位相同的头奖、二奖和三奖。</p>
                    </div>
                  )}
                  {!suffixLoading && !suffixError && filteredSuffix.length > 0 && (
                    <div className="lc-timeline lc-suffix-timeline">
                      {filteredSuffix.map((record, index) => (
                        <article key={`${record.number}-${record.operator}-${record.date}-${record.prize}-${record.drawNo}-${index}`} className={`lc-history-row lc-history-row-match lc-prize-${record.prize}`}>
                          <time dateTime={record.date}>{formatDrawDate(record.date)}</time>
                          <div>
                            <strong>{PRIZE_LABELS[record.prize] || record.prize}</strong>
                            <span>{OPERATOR_LABELS[record.operator] || record.operator}</span>
                          </div>
                          <button type="button" className="lc-matched-number" onClick={() => search(record.number)} aria-label={`查询 ${record.number} 的完整历史`}>
                            {record.number}
                          </button>
                          <span className="lc-draw-number">Draw {record.drawNo}</span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </section>
      </div>

      <aside className="lc-info-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>历史记录只是对过去结果的整理，不会提高或预测任何未来号码的中奖概率。</p>
      </aside>
    </div>
  )
}

