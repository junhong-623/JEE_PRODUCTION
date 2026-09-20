import { useCallback, useEffect, useState } from 'react'
import { DataFreshness, ErrorState, LoadingState, NumberDigits, SectionIntro } from '../components/Common'
import {
  drawYearUrl,
  formatDrawDate,
  latestCoverageDate,
  malaysiaDate,
  OPERATOR_LABELS,
} from '../lib/fourD'

const OPERATOR_META = {
  magnum: {
    mark: 'M',
    className: 'magnum',
    logo: 'https://storage-prod.magnum4d.my/assets/assets/contentitems/8f/8fef530c-ee6f-4c56-97b6-244bd221994f/2b73325c-4f0e-4071-add7-3757fbec7fdb/6c9802d5-d4d6-46db-abf1-0cd94374b6ee.png',
  },
  sportstoto: {
    mark: 'T',
    className: 'toto',
    logo: 'https://cdn.fast4dking.com/mobile/v2/img/logo_sportstoto.png',
  },
  damacai: {
    mark: 'D',
    className: 'damacai',
    logo: 'https://cdn.fast4dking.com/mobile/v2/img/logo_damacai.png',
  },
}

function OperatorLogo({ meta, label }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`lc-operator-logo ${failed ? 'is-fallback' : ''}`} aria-hidden="true">
      {!failed && <img src={meta.logo} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
      {failed && meta.mark}
      <span className="lc-sr-only">{label}</span>
    </span>
  )
}

function PrizeGroup({ label, numbers, onLookup }) {
  return (
    <div className="lc-number-cloud">
      <p>{label}</p>
      <div>
        {numbers.map(number => (
          <button type="button" key={number} onClick={() => onLookup(number)} aria-label={`查询 ${number} 历史`}>
            {number}
          </button>
        ))}
      </div>
    </div>
  )
}

function DrawCard({ operator, draw, onLookup }) {
  const meta = OPERATOR_META[operator]
  return (
    <article className={`lc-draw-card lc-operator-${meta.className}`}>
      <header>
        <OperatorLogo meta={meta} label={OPERATOR_LABELS[operator]} />
        <div>
          <h3>{OPERATOR_LABELS[operator]}</h3>
          <p>{formatDrawDate(draw.date)} · Draw {draw.drawNo}</p>
        </div>
      </header>

      <div className="lc-top-prizes">
        {[
          ['头奖', draw.first],
          ['二奖', draw.second],
          ['三奖', draw.third],
        ].map(([label, number], index) => (
          <button type="button" key={label} className={index === 0 ? 'is-first' : ''} onClick={() => onLookup(number)}>
            <span>{label}</span>
            <NumberDigits value={number} size={index === 0 ? 'large' : 'small'} />
          </button>
        ))}
      </div>

      <div className="lc-prize-board">
        <PrizeGroup label="特别奖" numbers={draw.special} onLookup={onLookup} />
        <PrizeGroup label="安慰奖" numbers={draw.consolation} onLookup={onLookup} />
      </div>
    </article>
  )
}

export default function LatestDraws({ onLookup }) {
  const [state, setState] = useState({ loading: true, manifest: null, error: '' })
  const [selectedDate, setSelectedDate] = useState('')
  const [drawState, setDrawState] = useState({ loading: false, data: null, error: '' })
  const [retryToken, setRetryToken] = useState(0)

  const load = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }))
    try {
      const response = await fetch('/luck-calc/data/manifest.json', { cache: 'no-cache' })
      if (!response.ok) throw new Error('历史资料尚未部署')
      const manifest = await response.json()
      const latestDate = latestCoverageDate(manifest)
      if (!latestDate) throw new Error('历史资料日期无效')
      setSelectedDate(previous => previous || latestDate)
      setState({ loading: false, manifest, error: '' })
    } catch (error) {
      setState({ loading: false, manifest: null, error: error.message || '网络错误' })
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selectedDate) return undefined
    const controller = new AbortController()
    const loadDraws = async () => {
      setDrawState({ loading: true, data: null, error: '' })
      try {
        const response = await fetch(drawYearUrl(selectedDate), {
          cache: 'no-cache',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('该年份的开奖资料尚未部署')
        const yearData = await response.json()
        setDrawState({ loading: false, data: yearData[selectedDate] || {}, error: '' })
      } catch (error) {
        if (error.name === 'AbortError') return
        setDrawState({ loading: false, data: null, error: error.message || '网络错误' })
      }
    }
    loadDraws()
    return () => controller.abort()
  }, [selectedDate, retryToken])

  const latestDate = latestCoverageDate(state.manifest)
  const earliestDate = Object.values(state.manifest?.coverage || {})
    .map(item => item.from)
    .filter(Boolean)
    .sort()
    .at(0) || ''
  const availableOperators = Object.keys(OPERATOR_LABELS)
    .filter(operator => drawState.data?.[operator])

  return (
    <div className="lc-page lc-latest-page">
      <SectionIntro
        title="4D 开奖结果"
        description="选择日期查看三大运营商的完整开奖记录；有今日开奖结果时会默认显示今天，否则显示最近一期。"
        action={<DataFreshness manifest={state.manifest} />}
      />

      {state.loading && <LoadingState label="正在载入最新开奖资料…" />}
      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}
      {!state.loading && state.manifest && (
        <>
          <div className="lc-draw-date-bar">
            <label>
              <span>开奖日期</span>
              <input
                type="date"
                value={selectedDate}
                min={earliestDate}
                max={malaysiaDate()}
                onChange={event => {
                  if (event.target.value) setSelectedDate(event.target.value)
                }}
              />
            </label>
            <div>
              <strong>{formatDrawDate(selectedDate)}</strong>
              <span>{drawState.loading
                ? '正在查询该日记录'
                : availableOperators.length > 0
                  ? `${availableOperators.length} 家运营商有开奖`
                  : '该日没有开奖'}</span>
            </div>
            <button
              type="button"
              className="lc-btn lc-btn-ghost"
              disabled={selectedDate === latestDate}
              onClick={() => setSelectedDate(latestDate)}
            >
              最近一期
            </button>
          </div>

          {drawState.loading && <LoadingState label={`正在载入 ${formatDrawDate(selectedDate)} 开奖资料…`} />}
          {!drawState.loading && drawState.error && (
            <ErrorState message={drawState.error} onRetry={() => setRetryToken(value => value + 1)} />
          )}
          {!drawState.loading && !drawState.error && availableOperators.length > 0 && (
            <div className="lc-draw-grid">
              {availableOperators.map(operator => (
                <DrawCard key={operator} operator={operator} draw={drawState.data[operator]} onLookup={onLookup} />
              ))}
            </div>
          )}
          {!drawState.loading && !drawState.error && selectedDate && availableOperators.length === 0 && (
            <div className="lc-empty-state lc-empty-state-compact">
              <span aria-hidden="true">○</span>
              <h3>该日期没有开奖记录</h3>
              <p>请选择其他日期，或返回最近一期查看最新结果。</p>
            </div>
          )}
        </>
      )}

      <aside className="lc-info-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>结果资料由各运营商的公开开奖资料整理。如有差异，以运营商正式结果为准。</p>
      </aside>
    </div>
  )
}
