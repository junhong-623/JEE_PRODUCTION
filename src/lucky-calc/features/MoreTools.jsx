import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ResultRow, SectionIntro } from '../components/Common'
import { bestWithSwap, calculateFinance, CARD_RANKS, CARD_VALUES, evaluateExpression, scoreNiuNiu, SUITS } from '../lib/calculators'
import { formatMYR } from '../lib/fourD'

const TOOL_TABS = [
  { id: 'random', label: '4D 随机号', icon: '✦' },
  { id: 'calculator', label: '算式计算器', icon: '∑' },
  { id: 'interest', label: '利息计算', icon: '%' },
  { id: 'niuniu', label: '牛牛算分', icon: '♣' },
]

function secureRandom4D() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1)
    globalThis.crypto.getRandomValues(values)
    return String(values[0] % 10_000).padStart(4, '0')
  }
  return String(Math.floor(Math.random() * 10_000)).padStart(4, '0')
}

function RandomTool() {
  const [count, setCount] = useState(4)
  const [numbers, setNumbers] = useState([])
  const [rolling, setRolling] = useState(false)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  const clearTimers = useCallback(() => {
    window.clearInterval(intervalRef.current)
    window.clearTimeout(timeoutRef.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const generate = () => {
    clearTimers()
    const amount = Math.min(10, Math.max(1, Number(count) || 1))
    const finalNumbers = Array.from({ length: amount }, secureRandom4D)
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setNumbers(finalNumbers)
      setRolling(false)
      return
    }
    setRolling(true)
    setNumbers(Array.from({ length: amount }, secureRandom4D))
    intervalRef.current = window.setInterval(() => setNumbers(Array.from({ length: amount }, secureRandom4D)), 70)
    timeoutRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current)
      setNumbers(finalNumbers)
      setRolling(false)
    }, 900)
  }

  return (
    <div className="lc-mini-tool">
      <div className="lc-mini-tool-header"><span>✦</span><div><h3>4D 随机号</h3><p>快速生成 1–10 组娱乐用随机号码。</p></div></div>
      <label><span>生成数量</span><input className="lc-input" type="number" min="1" max="10" value={count} onChange={event => setCount(event.target.value)} disabled={rolling} /></label>
      <button type="button" className="lc-btn lc-btn-primary lc-btn-block" onClick={generate} disabled={rolling}>{rolling ? '生成中…' : '生成号码'}</button>
      {numbers.length > 0 && <div className={`lc-random-grid ${rolling ? 'is-rolling' : ''}`} aria-live="polite">{numbers.map((number, index) => <strong key={`${index}-${number}`}>{number}</strong>)}</div>}
      <p className="lc-field-hint">随机号仅供娱乐，不会提高中奖概率。</p>
    </div>
  )
}

function applyPercent(expression) {
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/')
  const match = normalized.match(/^(.*)([+\-*/])(\d+(?:\.\d+)?)$/)
  if (!match) {
    const result = evaluateExpression(normalized)
    return result.error ? expression : String(result.value / 100)
  }
  const [, left, operator, percentValue] = match
  const leftResult = evaluateExpression(left)
  if (leftResult.error) return expression
  const replacement = ['+', '-'].includes(operator)
    ? leftResult.value * Number(percentValue) / 100
    : Number(percentValue) / 100
  return `${left.replace(/\*/g, '×').replace(/\//g, '÷')}${operator.replace('*', '×').replace('/', '÷')}${replacement}`
}

function CalculatorTool() {
  const [expression, setExpression] = useState('0')
  const [message, setMessage] = useState('')
  const keys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '%', '0', '.', '=']

  const press = key => {
    setMessage('')
    if (key === 'C') return setExpression('0')
    if (key === '%') return setExpression(value => applyPercent(value))
    if (key === '=') {
      const result = evaluateExpression(expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'))
      if (result.error) setMessage(result.error)
      else setExpression(String(result.value))
      return
    }
    setExpression(value => {
      const next = key === '−' ? '-' : key
      if (value === '0' && /\d/.test(next)) return next
      return value + next
    })
  }

  return (
    <div className="lc-mini-tool">
      <div className="lc-mini-tool-header"><span>∑</span><div><h3>算式计算器</h3><p>支持括号、运算优先级和连续计算。</p></div></div>
      <label className="lc-calculator-display">
        <span className="lc-sr-only">算式</span>
        <input value={expression} onChange={event => setExpression(event.target.value.replace(/[^0-9+\-−×÷*/.()]/g, ''))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); press('=') } }} />
      </label>
      {message && <p className="lc-inline-error" role="alert">{message}</p>}
      <div className="lc-calculator-keys">
        {keys.map(key => <button type="button" key={key} className={key === '=' ? 'is-equals' : /[+−×÷]/.test(key) ? 'is-operator' : ''} onClick={() => press(key)}>{key}</button>)}
      </div>
    </div>
  )
}

function InterestTool() {
  const [mode, setMode] = useState('loan')
  const [principal, setPrincipal] = useState('100000')
  const [rate, setRate] = useState('4')
  const [years, setYears] = useState('30')
  const result = useMemo(() => calculateFinance(mode, principal, rate, years), [mode, principal, rate, years])
  const modes = [
    ['loan', '房贷 / 余额递减'],
    ['flat', '车贷 / Flat Rate'],
    ['fd', '定期存款'],
    ['simple', '简单利息'],
  ]

  return (
    <div className="lc-mini-tool">
      <div className="lc-mini-tool-header"><span>%</span><div><h3>利息计算</h3><p>区分余额递减与 Flat Rate，避免贷款估算误差。</p></div></div>
      <label><span>计算方式</span><select className="lc-select" value={mode} onChange={event => setMode(event.target.value)}>{modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="lc-three-fields">
        <label><span>金额（RM）</span><input className="lc-input" type="number" min="0" value={principal} onChange={event => setPrincipal(event.target.value)} /></label>
        <label><span>年利率（%）</span><input className="lc-input" type="number" min="0" step="0.01" value={rate} onChange={event => setRate(event.target.value)} /></label>
        <label><span>年限</span><input className="lc-input" type="number" min="0" step="0.5" value={years} onChange={event => setYears(event.target.value)} /></label>
      </div>
      {result.error ? <p className="lc-inline-error" role="alert">{result.error}</p> : (
        <div className="lc-result-list">
          {result.monthly != null && <ResultRow label="每月金额" value={formatMYR(result.monthly)} highlight />}
          {result.total != null && <ResultRow label="总金额" value={formatMYR(result.total)} />}
          {result.interest != null && <ResultRow label="总利息" value={formatMYR(result.interest)} />}
          {result.final != null && <ResultRow label="到期金额" value={formatMYR(result.final)} highlight />}
          {result.earned != null && <ResultRow label="利息收益" value={formatMYR(result.earned)} />}
        </div>
      )}
      <p className="lc-field-hint">仅供估算，实际供款可能包含手续费、保险及不同计息周期。</p>
    </div>
  )
}

function makeDeck() {
  const deck = SUITS.flatMap(suit => CARD_RANKS.map(rank => ({ suit, rank, val: CARD_VALUES[rank] })))
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[target]] = [deck[target], deck[index]]
  }
  return deck
}

function NiuNiuTool() {
  const [playerCount, setPlayerCount] = useState(3)
  const [hands, setHands] = useState([])
  const [swapMode, setSwapMode] = useState(false)
  const displayedHands = hands.map(hand => {
    const optimized = swapMode ? bestWithSwap(hand.cards) : { result: scoreNiuNiu(hand.cards), cards: hand.cards, swapped: [] }
    return { ...hand, ...optimized }
  })

  const deal = () => {
    const deck = makeDeck()
    setHands(Array.from({ length: playerCount }, (_, index) => ({ player: index + 1, cards: deck.slice(index * 5, index * 5 + 5) })))
  }

  const topScore = displayedHands.length ? Math.max(...displayedHands.map(hand => hand.result.score)) : null

  return (
    <div className="lc-mini-tool">
      <div className="lc-mini-tool-header"><span>♣</span><div><h3>牛牛算分</h3><p>模拟发牌并计算每位玩家的牛牛结果。</p></div></div>
      <div className="lc-niuniu-controls">
        <label><span>玩家人数</span><select className="lc-select" value={playerCount} onChange={event => setPlayerCount(Number(event.target.value))}>{[2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value} 人</option>)}</select></label>
        <button type="button" className="lc-btn lc-btn-primary" onClick={deal}>发牌</button>
      </div>
      <button type="button" className={`lc-toggle ${swapMode ? 'is-active' : ''}`} aria-pressed={swapMode} onClick={() => setSwapMode(value => !value)}><span>3 ↔ 6 最优换牌</span><i aria-hidden="true" /></button>
      {displayedHands.length > 0 && (
        <div className="lc-hands" aria-live="polite">
          {displayedHands.map(hand => (
            <article key={hand.player} className={hand.result.score === topScore ? 'is-winning' : ''}>
              <header><span>玩家 {hand.player}</span><strong>{hand.result.type}</strong></header>
              <div className="lc-playing-cards">
                {hand.cards.map((card, index) => <span key={`${card.suit}-${card.rank}-${index}`} className={['♥', '♦'].includes(card.suit) ? 'is-red' : ''}><b>{card.rank}</b><i>{card.suit}</i>{card.swappedFrom && <em>{card.swappedFrom}→{card.rank}</em>}</span>)}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="lc-field-hint">牛牛规则存在地区差异，此工具使用标准五张牌计分。</p>
    </div>
  )
}

const TOOLS = { random: RandomTool, calculator: CalculatorTool, interest: InterestTool, niuniu: NiuNiuTool }

export default function MoreTools() {
  const [activeTool, setActiveTool] = useState('random')
  const ActiveTool = TOOLS[activeTool]
  return (
    <div className="lc-page">
      <SectionIntro eyebrow="MORE TOOLS" title="更多实用工具" description="将随机号、普通计算、利息与牛牛算分收纳在独立工具区，保持 4D 主功能清晰。" />
      <div className="lc-tools-layout">
        <nav className="lc-tool-picker" aria-label="更多工具">
          {TOOL_TABS.map(tool => <button type="button" key={tool.id} className={activeTool === tool.id ? 'is-active' : ''} aria-current={activeTool === tool.id ? 'page' : undefined} onClick={() => setActiveTool(tool.id)}><span>{tool.icon}</span><strong>{tool.label}</strong></button>)}
        </nav>
        <section className="lc-panel lc-active-tool"><ActiveTool /></section>
      </div>
    </div>
  )
}

