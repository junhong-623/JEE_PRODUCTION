import { useCallback, useEffect, useState } from 'react'
import { DataFreshness, ErrorState, LoadingState, NumberDigits, SectionIntro } from '../components/Common'
import { formatDrawDate, OPERATOR_LABELS } from '../lib/fourD'

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
    <div className="lc-page lc-latest-page">
      <SectionIntro
        title="最新 4D 开奖结果"
        description="三大运营商最新一期结果。特别奖与安慰奖已完整列出；点击任何号码即可查看历史。"
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
