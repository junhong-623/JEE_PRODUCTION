import { useCallback, useEffect, useState } from 'react'
import { DataFreshness, ErrorState, LoadingState, NumberDigits, SectionIntro } from '../components/Common'
import { formatDrawDate, OPERATOR_LABELS } from '../lib/fourD'

const OPERATOR_META = {
  magnum: { mark: 'M', className: 'magnum' },
  sportstoto: { mark: 'T', className: 'toto' },
  damacai: { mark: 'D', className: 'damacai' },
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
        <span className="lc-operator-mark" aria-hidden="true">{meta.mark}</span>
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

      <details className="lc-prize-details">
        <summary>展开特别奖与安慰奖 <span>{draw.special.length + draw.consolation.length} 个号码</span></summary>
        <PrizeGroup label="特别奖" numbers={draw.special} onLookup={onLookup} />
        <PrizeGroup label="安慰奖" numbers={draw.consolation} onLookup={onLookup} />
      </details>
    </article>
  )
}

export default function LatestDraws({ onLookup }) {
  const [state, setState] = useState({ loading: true, data: null, manifest: null, error: '' })

  const load = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }))
    try {
      const [drawsResponse, manifestResponse] = await Promise.all([
        fetch('/luck-calc/data/latest.json', { cache: 'no-cache' }),
        fetch('/luck-calc/data/manifest.json', { cache: 'no-cache' }),
      ])
      if (!drawsResponse.ok || !manifestResponse.ok) throw new Error('历史资料尚未部署')
      const [data, manifest] = await Promise.all([drawsResponse.json(), manifestResponse.json()])
      setState({ loading: false, data, manifest, error: '' })
    } catch (error) {
      setState({ loading: false, data: null, manifest: null, error: error.message || '网络错误' })
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="lc-page">
      <SectionIntro
        eyebrow="LATEST RESULTS"
        title="最新 4D 开奖结果"
        description="Magnum、Sports Toto 与 Da Ma Cai 的最新资料，点击任何号码即可查看完整历史。"
        action={<DataFreshness manifest={state.manifest} />}
      />

      {state.loading && <LoadingState label="正在载入最新开奖资料…" />}
      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}
      {!state.loading && state.data && (
        <div className="lc-draw-grid">
          {Object.keys(OPERATOR_LABELS).map(operator => (
            <DrawCard key={operator} operator={operator} draw={state.data[operator]} onLookup={onLookup} />
          ))}
        </div>
      )}

      <aside className="lc-info-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>结果资料由各运营商的公开开奖资料整理。如有差异，以运营商正式结果为准。</p>
      </aside>
    </div>
  )
}
