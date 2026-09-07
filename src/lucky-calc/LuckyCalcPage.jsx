import { useState, useCallback, useRef, useEffect } from 'react'

const PROXY_URL = 'https://vercel-proxy-chi-coral.vercel.app/api/search'

const TABS = [
  { id: 'calc',     label: '计算机',   icon: '🧮' },
  { id: '4d',       label: '4D 幸运号', icon: '🎰' },
  { id: 'qianzi',   label: '千字图',   icon: '📖' },
  { id: 'niuniu',   label: '牛牛算分', icon: '🃏' },
  { id: 'payout',   label: '4D 赔率',  icon: '💰' },
  { id: 'interest', label: '利息计算', icon: '📊' },
]

const BLESSINGS = [
  '福星高照，数字开运！', '财运亨通，吉祥如意！', '好运连连，必有收获！',
  '天赐良缘，此号大吉！', '金榜题名，鸿运当头！', '万事如意，大吉大利！',
]

const TOTO_PRIZES = {
  magnum: { '1st': 2500, '2nd': 1000, '3rd': 500, 'special': 180, 'consolation': 60 },
  toto:   { '1st': 2500, '2nd': 1000, '3rd': 500, 'special': 200, 'consolation': 60 },
  damacai: { '1st': 2500, '2nd': 1000, '3rd': 500, 'special': 180, 'consolation': 60 },
}

// ─── Calculator logic ──────────────────────────────────────────────────────────
function calcResult(expr) {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/.()%]/g, '').replace(/%/g, '/100')
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + sanitized + ')')()
    if (!isFinite(val)) return '错误'
    return String(parseFloat(val.toFixed(10)))
  } catch {
    return '错误'
  }
}

// ─── Niu Niu logic ─────────────────────────────────────────────────────────────
const CARD_VALUES = { 'A':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10 }
const CARD_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS = ['♠','♥','♦','♣']

function makeCard() {
  const rank = CARD_RANKS[Math.floor(Math.random() * 13)]
  const suit = SUITS[Math.floor(Math.random() * 4)]
  return { rank, suit, val: CARD_VALUES[rank] }
}

function scoreNiuNiu(cards) {
  if (cards.length !== 5) return null
  const vals = cards.map(c => c.val)
  const isFaceOrTen = cards.every(c => c.val === 10)
  if (isFaceOrTen) return { type: '五花牛', score: 10, level: 'max' }
  for (let i = 0; i < 3; i++) for (let j = i+1; j < 4; j++) for (let k = j+1; k < 5; k++) {
    if ((vals[i] + vals[j] + vals[k]) % 10 === 0) {
      const rest = vals.filter((_, idx) => idx !== i && idx !== j && idx !== k)
      const score = (rest[0] + rest[1]) % 10
      const type = score === 0 ? '牛牛' : `牛${score}`
      const level = score === 0 ? 'max' : score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low'
      return { type, score: score === 0 ? 10 : score, level }
    }
  }
  return { type: '没牛', score: 0, level: 'none' }
}

// Try all subsets of 3/6 swaps and return the best result + which indices were swapped
function bestWithSwap(cards) {
  // indices of cards that are 3 or 6
  const swappable = cards.reduce((acc, c, i) => {
    if (c.val === 3 || c.val === 6) acc.push(i)
    return acc
  }, [])

  if (swappable.length === 0) return { result: scoreNiuNiu(cards), swapped: [], cards }

  // generate all subsets of swappable indices
  const subsets = [[]] // include "no swap" baseline
  for (const idx of swappable) {
    const len = subsets.length
    for (let s = 0; s < len; s++) subsets.push([...subsets[s], idx])
  }

  let best = null
  let bestSwapped = []
  let bestCards = cards

  for (const subset of subsets) {
    const swappedCards = cards.map((c, i) => {
      if (!subset.includes(i)) return c
      const newVal = c.val === 3 ? 6 : 3
      const newRank = String(newVal)
      return { ...c, rank: newRank, val: newVal, swapped: true }
    })
    const result = scoreNiuNiu(swappedCards)
    if (!best || result.score > best.score) {
      best = result
      bestSwapped = subset
      bestCards = swappedCards
    }
  }

  return { result: best, swapped: bestSwapped, cards: bestCards }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function LuckyCalcPage() {
  const [activeTab, setActiveTab] = useState('calc')

  return (
    <div className="lc-shell min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, #0a0806 0%, #12090a 50%, #0a0806 100%)', color: '#f5e6c8' }}>
      <style>{`
        .lc-shell * { box-sizing: border-box; }
        .lc-gold { color: #ffd700; }
        .lc-red { color: #e53935; }
        .lc-btn { transition: all 0.15s; cursor: pointer; }
        .lc-btn:hover { transform: translateY(-1px); }
        .lc-btn:active { transform: scale(0.97); }
        .lc-calc-btn { background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.18); border-radius: 12px; padding: 14px; font-size: 18px; font-weight: 600; color: #f5e6c8; transition: all 0.12s; }
        .lc-calc-btn:hover { background: rgba(255,215,0,0.16); color: #ffd700; }
        .lc-calc-btn.op { color: #ffd700; background: rgba(255,215,0,0.12); }
        .lc-calc-btn.eq { background: linear-gradient(135deg, #cc0000, #e53935); color: white; border-color: transparent; }
        .lc-calc-btn.eq:hover { background: linear-gradient(135deg, #e53935, #f44336); }
        .lc-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.15); border-radius: 12px; padding: 10px 14px; color: #f5e6c8; width: 100%; font-size: 14px; outline: none; }
        .lc-input:focus { border-color: rgba(255,215,0,0.4); }
        .lc-select { background: rgba(20,12,8,0.95); border: 1px solid rgba(255,215,0,0.18); border-radius: 12px; padding: 10px 14px; color: #f5e6c8; width: 100%; font-size: 14px; outline: none; cursor: pointer; }
        .lc-card { background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15); border-radius: 16px; padding: 20px; }
        .lc-tag { display: inline-block; background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 2px 8px; font-size: 12px; color: #ffd700; }
        @keyframes lc-shine { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
        .lc-shine { animation: lc-shine 2s ease-in-out infinite; }
        @keyframes lc-roll { 0% { transform: translateY(-6px) scale(0.95); opacity: 0.4; } 60% { transform: translateY(2px) scale(1.04); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes lc-pop  { 0% { transform: scale(0.88); opacity: 0; } 65% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .lc-rolling { animation: lc-roll 0.1s ease-out; }
        .lc-final   { animation: lc-pop  0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-50 border-b" style={{ background: 'rgba(10,8,6,0.95)', borderColor: 'rgba(255,215,0,0.15)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="lc-gold lc-shine font-display text-2xl" style={{ fontStyle: 'italic' }}>幸运计算器</span>
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,215,0,0.4)' }}>Lucky Calc</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className="lc-btn rounded-full px-3 py-1.5 font-mono text-xs" style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #cc0000, #e53935)' : 'rgba(255,215,0,0.08)', border: `1px solid ${activeTab === t.id ? 'transparent' : 'rgba(255,215,0,0.15)'}`, color: activeTab === t.id ? 'white' : '#f5e6c8' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {activeTab === 'calc'     && <CalculatorTab />}
        {activeTab === '4d'       && <Lucky4DTab />}
        {activeTab === 'qianzi'   && <QianziTab />}
        {activeTab === 'niuniu'   && <NiuNiuTab />}
        {activeTab === 'payout'   && <PayoutTab />}
        {activeTab === 'interest' && <InterestTab />}
      </div>
    </div>
  )
}

// ─── Calculator Tab ─────────────────────────────────────────────────────────────
function CalculatorTab() {
  // expr  = the full expression string used for evaluation
  // display = what's shown in the big number area (current operand or result)
  // fresh = true means next digit press starts a new operand
  const [expr, setExpr]       = useState('')
  const [display, setDisplay] = useState('0')
  const [fresh, setFresh]     = useState(true)

  const press = useCallback((val) => {
    if (val === 'C') {
      setExpr(''); setDisplay('0'); setFresh(true); return
    }
    if (val === '=') {
      const full = fresh ? expr.slice(0, -1) : expr + display  // avoid trailing op
      const result = calcResult(full || display)
      setDisplay(result); setExpr(''); setFresh(true); return
    }
    if (val === '±') {
      setDisplay(d => { const n = String(-parseFloat(d)); return n; }); return
    }
    if (val === '%') {
      setDisplay(d => String(parseFloat(d) / 100)); return
    }
    if (['+', '-', '×', '÷'].includes(val)) {
      const op = val === '×' ? '*' : val === '÷' ? '/' : val
      // commit current display into expr, then append operator
      const base = fresh ? expr.replace(/[+\-*/]$/, '') : expr + display
      setExpr(base + op)
      setFresh(true)
      return
    }
    if (val === '.') {
      if (fresh) { setDisplay('0.'); setFresh(false); return }
      if (!display.includes('.')) setDisplay(d => d + '.')
      return
    }
    // digit or '00'
    if (fresh) {
      setDisplay(val === '00' ? '0' : val)
      setFresh(false)
    } else {
      setDisplay(d => {
        if (val === '00') return d === '0' ? '0' : d + '00'
        return d === '0' ? val : d + val
      })
    }
  }, [expr, display, fresh])

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') { press(e.key); return }
      if (e.key === '+') { press('+'); return }
      if (e.key === '-') { press('-'); return }
      if (e.key === '*') { press('×'); return }
      if (e.key === '/') { e.preventDefault(); press('÷'); return }
      if (e.key === '%') { press('%'); return }
      if (e.key === '.') { press('.'); return }
      if (e.key === 'Enter' || e.key === '=') { press('='); return }
      if (e.key === 'Escape') { press('C'); return }
      if (e.key === 'Backspace') {
        setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  // Build expression preview: show committed expr + current display
  const exprPreview = fresh ? expr : expr + display

  const keys = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['00', '0', '.', '='],
  ]

  return (
    <div className="mx-auto max-w-xs">
      <div className="lc-card mb-4 text-right">
        <p className="font-mono text-xs" style={{ color: 'rgba(255,215,0,0.4)', minHeight: '1rem', wordBreak: 'break-all' }}>{exprPreview || '0'}</p>
        <p className="mt-1 font-mono text-4xl font-bold" style={{ color: '#ffd700', wordBreak: 'break-all' }}>{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.flat().map((k, i) => {
          const isOp = ['+', '-', '×', '÷'].includes(k)
          const isEq = k === '='
          const isClear = k === 'C'
          return (
            <button key={i} onClick={() => press(k)} className={`lc-calc-btn lc-btn ${isOp ? 'op' : ''} ${isEq ? 'eq' : ''} ${isClear ? 'op' : ''}`}>
              {k}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-center font-mono text-xs" style={{ color: 'rgba(255,215,0,0.35)' }}>支持键盘输入 · Enter = 计算 · Esc = 清除 · ⌫ = 退格</p>
    </div>
  )
}

// ─── Lucky 4D Tab ───────────────────────────────────────────────────────────────
const ROLL_DURATION = 1400  // ms rolling per slot
const ROLL_INTERVAL = 75    // ms per frame

function Lucky4DTab() {
  const [slots, setSlots]       = useState([])   // [{ state: 'empty'|'rolling'|'settled', display }]
  const [blessing, setBlessing] = useState('')
  const [count, setCount]       = useState(1)
  const [animating, setAnimating] = useState(false)
  const intervalRef  = useRef(null)
  const rollTimerRef = useRef(null)

  const randNum = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  const generate = () => {
    if (animating) return
    const size   = Math.min(count, 10)
    const finals = Array.from({ length: size }, randNum)

    clearInterval(intervalRef.current)
    clearTimeout(rollTimerRef.current)
    setBlessing('')
    setAnimating(true)
    setSlots(Array.from({ length: size }, () => ({ state: 'empty', display: '----' })))

    const rollSlot = (idx) => {
      setSlots(prev => prev.map((s, i) => i === idx ? { state: 'rolling', display: randNum() } : s))
      let elapsed = 0
      intervalRef.current = setInterval(() => {
        elapsed += ROLL_INTERVAL
        if (elapsed >= ROLL_DURATION) {
          clearInterval(intervalRef.current)
          setSlots(prev => prev.map((s, i) => i === idx ? { state: 'settled', display: finals[idx] } : s))
          if (idx + 1 < size) {
            rollTimerRef.current = setTimeout(() => rollSlot(idx + 1), 180)
          } else {
            setBlessing(BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)])
            setAnimating(false)
          }
        } else {
          setSlots(prev => prev.map((s, i) => i === idx ? { ...s, display: randNum() } : s))
        }
      }, ROLL_INTERVAL)
    }

    rollTimerRef.current = setTimeout(() => rollSlot(0), 80)
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="lc-card text-center">
        <div className="lc-gold text-4xl">🎰</div>
        <h2 className="lc-gold mt-2 font-display text-2xl">4D 幸运号码</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(245,230,200,0.55)' }}>随机生成吉祥号码</p>
      </div>

      <div className="lc-card">
        <label className="block">
          <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>生成数量（最多10组）</span>
          <input type="number" min={1} max={10} value={count} onChange={e=>setCount(Math.min(10,Math.max(1,+e.target.value)))} className="lc-input" disabled={animating} />
        </label>
        <button onClick={generate} disabled={animating} className="lc-btn mt-4 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-70" style={{ background: 'linear-gradient(135deg, #cc0000, #e53935)' }}>
          {animating ? '🎲 生成中...' : '🎲 生成号码'}
        </button>
      </div>

      {slots.length > 0 && (
        <div className="lc-card space-y-3 text-center">
          {slots.map((slot, i) => (
            <div key={i} className="rounded-xl py-3" style={{
              background: slot.state === 'empty' ? 'rgba(255,215,0,0.02)' : 'rgba(255,215,0,0.06)',
              border: `1px solid ${slot.state === 'settled' ? 'rgba(255,215,0,0.4)' : 'rgba(255,215,0,0.12)'}`,
              transition: 'border-color 0.3s, background 0.3s',
              opacity: slot.state === 'empty' ? 0.35 : 1,
            }}>
              {slot.state === 'empty' ? (
                <p className="font-mono text-4xl font-bold tracking-[0.5em]" style={{ color: 'rgba(255,215,0,0.18)' }}>----</p>
              ) : (
                <p
                  key={`${i}-${slot.display}`}
                  className={`font-mono text-4xl font-bold tracking-[0.35em] ${slot.state === 'settled' ? 'lc-final' : 'lc-rolling'}`}
                  style={{ color: '#ffd700', textShadow: slot.state === 'settled' ? '0 0 28px rgba(255,215,0,0.6)' : '0 0 8px rgba(255,215,0,0.15)', display: 'block' }}
                >
                  {slot.display}
                </p>
              )}
            </div>
          ))}
          {!animating && blessing && (
            <p className="lc-red text-sm font-medium" style={{ animation: 'lc-pop 0.4s ease forwards' }}>{blessing}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Qianzi Tab ─────────────────────────────────────────────────────────────────
function QianziTab() {
  const [num, setNum] = useState('')
  const [queriedNum, setQueriedNum] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    const digits = String(num).replace(/\D/g, '')
    if (digits.length !== 4) { setError('请输入完整的 4 位号码'); return }
    const n = digits
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`${PROXY_URL}?num=${n}`, { signal: AbortSignal.timeout(12000) })
      const data = await res.json()
      if (data.error) { setError(data.error) } else { setResult(data); setQueriedNum(n) }
    } catch (e) {
      setError(e.name === 'TimeoutError' ? '查询超时，请重试' : '查询失败，请检查网络连接')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="lc-card text-center">
        <img src="/luck-calc/caishen.gif" alt="千字图" className="mx-auto h-16 w-16 object-contain" />
        <h2 className="lc-gold mt-2 font-display text-2xl">千字图查询</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(245,230,200,0.55)' }}>查询4D号码对应的千字图</p>
      </div>

      <div className="lc-card">
        <label className="block">
          <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>4D 号码</span>
          <input type="text" inputMode="numeric" maxLength={4} value={num} onChange={e=>setNum(e.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={e=>e.key==='Enter'&&lookup()} placeholder="0000 - 9999" className="lc-input text-center text-xl tracking-widest" style={{ fontSize: 16 }} />
        </label>
        <button onClick={lookup} disabled={loading} className="lc-btn mt-4 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #cc0000, #e53935)' }}>
          {loading ? '查询中...' : '🔍 查询'}
        </button>
        {error && <p className="mt-3 rounded-xl p-3 text-center text-sm text-red-400" style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.2)' }}>{error}</p>}
      </div>

      {result && (
        <div className="lc-card space-y-4">
          {/* Number */}
          <div className="text-center">
            <p className="font-mono text-xs" style={{ color: 'rgba(255,215,0,0.45)' }}>查询号码</p>
            <p className="mt-1 font-mono text-5xl font-bold tracking-[0.35em]" style={{ color: '#ffd700', textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>{queriedNum}</p>
          </div>

          <div style={{ height: 1, background: 'rgba(255,215,0,0.12)' }} />

          <figure className="overflow-hidden rounded-2xl p-3 text-center" style={{ background: '#fff', border: '1px solid rgba(255,215,0,0.25)' }}>
            <img
              src={result.image}
              alt={`${queriedNum} ${result.cn || '千字图'}`}
              className="mx-auto aspect-square w-full max-w-[280px] object-contain"
              referrerPolicy="no-referrer"
            />
          </figure>

          {(result.cn || result.en) && (
            <div className="rounded-xl px-4 py-5 text-center" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
              {result.cn && <p className="text-3xl font-bold" style={{ color: '#ffd700' }}>{result.cn}</p>}
              {result.en && <p className="mt-2 text-sm" style={{ color: 'rgba(245,230,200,0.5)' }}>{result.en}</p>}
            </div>
          )}

          <p className="text-center text-[11px]" style={{ color: 'rgba(245,230,200,0.35)' }}>图片与释义来源：4D2U Live</p>
        </div>
      )}
    </div>
  )
}

// ─── Niu Niu Tab ────────────────────────────────────────────────────────────────
function NiuNiuTab() {
  const [playerCount, setPlayerCount] = useState(3)
  const [hands, setHands] = useState([])
  const [swapMode, setSwapMode] = useState(false)

  const deal = () => {
    const deck = []
    for (const suit of SUITS) for (const rank of CARD_RANKS) deck.push({ rank, suit, val: CARD_VALUES[rank] })
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    const newHands = Array.from({ length: playerCount }, (_, i) => {
      const rawCards = deck.slice(i * 5, i * 5 + 5)
      return { player: i + 1, rawCards }
    })
    setHands(newHands)
  }

  const levelColor = { max: '#ffd700', high: '#e53935', mid: '#ff9800', low: 'rgba(245,230,200,0.7)', none: 'rgba(245,230,200,0.4)' }
  const suitColor = (suit) => ['♥','♦'].includes(suit) ? '#cc1111' : '#1a1a1a'

  // Compute displayed hands based on swapMode
  // Always show original rawCards — swap only affects scoring and highlight
  const displayHands = hands.map(h => {
    if (swapMode) {
      const { result, swapped } = bestWithSwap(h.rawCards)
      return { ...h, cards: h.rawCards, result, swapped }
    }
    return { ...h, cards: h.rawCards, result: scoreNiuNiu(h.rawCards), swapped: [] }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="lc-card text-center">
        <div className="lc-gold text-4xl">🃏</div>
        <h2 className="lc-gold mt-2 font-display text-2xl">牛牛算分</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(245,230,200,0.55)' }}>5张牌自动计算牛牛结果</p>
      </div>

      <div className="lc-card space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex-1">
            <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>玩家人数（2-6）</span>
            <select value={playerCount} onChange={e=>setPlayerCount(+e.target.value)} className="lc-select">
              {[2,3,4,5,6].map(n=><option key={n} value={n}>{n} 人</option>)}
            </select>
          </label>
          <button onClick={deal} className="lc-btn rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #cc0000, #e53935)' }}>
            🎴 发牌
          </button>
        </div>

        {/* 3/6 swap toggle */}
        <button
          onClick={() => setSwapMode(s => !s)}
          className="lc-btn flex w-full items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: swapMode ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${swapMode ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.1)'}` }}
        >
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: swapMode ? '#ffd700' : 'rgba(245,230,200,0.7)' }}>3 ↔ 6 换牌模式</p>
            <p className="mt-0.5 font-mono text-xs" style={{ color: 'rgba(245,230,200,0.4)' }}>自动计算最优 3/6 互换组合</p>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: 44, height: 24, borderRadius: 12,
            background: swapMode ? '#ffd700' : 'rgba(255,255,255,0.15)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 3, left: swapMode ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: swapMode ? '#0a0806' : 'rgba(255,255,255,0.6)',
              transition: 'left 0.2s',
            }} />
          </div>
        </button>
      </div>

      {displayHands.length > 0 && (
        <div className="space-y-3">
          {displayHands.map(h => (
            <div key={h.player} className="lc-card flex items-center gap-4">
              <div className="text-center" style={{ minWidth: 56 }}>
                <p className="font-mono text-xs" style={{ color: 'rgba(255,215,0,0.5)' }}>玩家 {h.player}</p>
                <p className="mt-1 text-lg font-bold" style={{ color: levelColor[h.result.level] }}>{h.result.type}</p>
                <p className="font-mono text-xs" style={{ color: levelColor[h.result.level] }}>
                  {h.result.score > 0 ? `${h.result.score}点` : ''}
                </p>
                {swapMode && h.swapped.length > 0 && (
                  <p className="mt-1 font-mono text-[10px]" style={{ color: 'rgba(255,215,0,0.55)' }}>已换牌</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {h.cards.map((c, i) => {
                  const wasSwapped = swapMode && h.swapped.includes(i)
                  return (
                    <div key={i} className="relative flex h-12 w-9 flex-col items-center justify-center rounded-lg text-xs font-bold"
                      style={{ background: wasSwapped ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.92)', color: suitColor(c.suit), outline: wasSwapped ? '2px solid #ffd700' : 'none' }}>
                      <span style={{ fontSize: 14 }}>{c.rank}</span>
                      <span>{c.suit}</span>
                      {wasSwapped && (
                        <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 10, background: '#e53935', color: '#fff', borderRadius: 4, padding: '0 2px', lineHeight: '14px' }}>换</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {displayHands.length > 1 && (() => {
            const maxScore = Math.max(...displayHands.map(h => h.result.score))
            const winners = displayHands.filter(h => h.result.score === maxScore)
            return (
              <div className="lc-card text-center" style={{ borderColor: 'rgba(255,215,0,0.4)' }}>
                {winners.length === 1 ? (
                  <p style={{ color: '#ffd700' }}>🏆 玩家 {winners[0].player} 获胜！（{winners[0].result.type}）</p>
                ) : (
                  <p style={{ color: '#ffd700' }}>🤝 平局！（玩家 {winners.map(w=>w.player).join(', ')}）</p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── 4D Payout Tab ──────────────────────────────────────────────────────────────
function PayoutTab() {
  const [company, setCompany] = useState('magnum')
  const [prize, setPrize] = useState('1st')
  const [betType, setBetType] = useState('big')
  const [amount, setAmount] = useState('1')
  const [result, setResult] = useState(null)

  const COMPANIES = { magnum: 'Magnum', toto: 'Sports Toto', damacai: 'Da Ma Cai' }
  const PRIZES = ['1st','2nd','3rd','special','consolation']
  const PRIZE_LABELS = { '1st':'头奖', '2nd':'二奖', '3rd':'三奖', 'special':'特别奖', 'consolation':'安慰奖' }
  const BIG_MULTIPLIER = { '1st':1, '2nd':1, '3rd':1, 'special':1, 'consolation':1 }
  const SMALL_MULTIPLIER = { '1st':3.5, '2nd':2, '3rd':1, 'special':0, 'consolation':0 }

  const calculate = () => {
    const base = TOTO_PRIZES[company][prize]
    const bet = parseFloat(amount) || 0
    const multiplier = betType === 'small' ? SMALL_MULTIPLIER[prize] : 1
    if (betType === 'small' && multiplier === 0) {
      setResult({ error: '小字（Small）不包含特别奖和安慰奖' })
      return
    }
    const payout = base * (betType === 'small' ? multiplier : 1) * bet
    setResult({ payout, base, bet, multiplier: betType === 'small' ? multiplier : 1 })
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="lc-card text-center">
        <div className="lc-gold text-4xl">💰</div>
        <h2 className="lc-gold mt-2 font-display text-2xl">4D 赔率计算</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(245,230,200,0.55)' }}>Magnum · Sports Toto · Da Ma Cai</p>
      </div>
      <div className="lc-card space-y-4">
        {[
          { label: '彩票公司', val: company, set: setCompany, opts: Object.entries(COMPANIES).map(([v,l])=>({v,l})) },
          { label: '奖项', val: prize, set: setPrize, opts: PRIZES.map(p=>({v:p,l:PRIZE_LABELS[p]})) },
          { label: '投注方式', val: betType, set: setBetType, opts: [{v:'big',l:'大字（Big）'},{v:'small',l:'小字（Small）'}] },
        ].map(({ label, val, set, opts }) => (
          <label key={label} className="block">
            <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>{label}</span>
            <select value={val} onChange={e=>set(e.target.value)} className="lc-select">
              {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </label>
        ))}
        <label className="block">
          <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>投注金额（RM）</span>
          <input type="number" min="0.5" step="0.5" value={amount} onChange={e=>setAmount(e.target.value)} className="lc-input" />
        </label>
        <button onClick={calculate} className="lc-btn w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #cc0000, #e53935)' }}>
          计算赔率
        </button>
      </div>
      {result && (
        <div className="lc-card text-center">
          {result.error ? (
            <p className="lc-red text-sm">{result.error}</p>
          ) : (
            <>
              <p className="font-mono text-sm" style={{ color: 'rgba(255,215,0,0.6)' }}>预计赢取</p>
              <p className="mt-2 font-mono text-5xl font-bold" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>RM {result.payout.toFixed(2)}</p>
              <p className="mt-3 text-xs" style={{ color: 'rgba(245,230,200,0.5)' }}>
                基础赔率 RM {result.base} × 倍率 {result.multiplier} × 投注 RM {result.bet}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Interest Calculator Tab ─────────────────────────────────────────────────────
function InterestTab() {
  const [mode, setMode] = useState('loan')
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('3.5')
  const [years, setYears] = useState('30')
  const [result, setResult] = useState(null)

  const MODES = [
    { id: 'loan', label: '贷款（月供）' },
    { id: 'fd', label: '定期存款' },
    { id: 'simple', label: '简单利息' },
  ]

  const calculate = () => {
    const P = parseFloat(principal) || 0
    const r = parseFloat(rate) / 100
    const n = parseFloat(years) || 0

    if (mode === 'loan') {
      const monthly = r / 12
      const months = n * 12
      if (monthly === 0) {
        setResult({ monthly: P / months, total: P, interest: 0 })
      } else {
        const monthly_payment = P * monthly * Math.pow(1 + monthly, months) / (Math.pow(1 + monthly, months) - 1)
        const total = monthly_payment * months
        setResult({ monthly: monthly_payment, total, interest: total - P })
      }
    } else if (mode === 'fd') {
      // Compound interest, compounded annually
      const final = P * Math.pow(1 + r, n)
      setResult({ final, earned: final - P })
    } else {
      // Simple interest
      const interest = P * r * n
      setResult({ total: P + interest, interest })
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="lc-card text-center">
        <div className="lc-gold text-4xl">📊</div>
        <h2 className="lc-gold mt-2 font-display text-2xl">利息计算器</h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(245,230,200,0.55)' }}>贷款 · 定存 · 简单利息</p>
      </div>
      <div className="lc-card space-y-4">
        <div className="flex gap-1">
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }} className="lc-btn flex-1 rounded-full py-2 text-xs font-medium" style={{ background: mode === m.id ? 'linear-gradient(135deg, #cc0000, #e53935)' : 'rgba(255,215,0,0.08)', border: `1px solid ${mode === m.id ? 'transparent' : 'rgba(255,215,0,0.15)'}`, color: mode === m.id ? 'white' : '#f5e6c8' }}>
              {m.label}
            </button>
          ))}
        </div>
        {[
          { label: mode === 'fd' ? '本金（RM）' : '贷款金额（RM）', val: principal, set: setPrincipal },
          { label: '年利率（%）', val: rate, set: setRate },
          { label: mode === 'loan' ? '贷款年限' : '年数', val: years, set: setYears },
        ].map(({ label, val, set }) => (
          <label key={label} className="block">
            <span className="mb-2 block font-mono text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>{label}</span>
            <input type="number" value={val} onChange={e=>set(e.target.value)} className="lc-input" />
          </label>
        ))}
        <button onClick={calculate} className="lc-btn w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #cc0000, #e53935)' }}>
          计算
        </button>
      </div>
      {result && (
        <div className="lc-card space-y-3">
          {mode === 'loan' && <>
            <ResultRow label="每月还款" val={`RM ${result.monthly.toFixed(2)}`} gold />
            <ResultRow label="总还款额" val={`RM ${result.total.toFixed(2)}`} />
            <ResultRow label="总利息" val={`RM ${result.interest.toFixed(2)}`} />
          </>}
          {mode === 'fd' && <>
            <ResultRow label="到期金额" val={`RM ${result.final.toFixed(2)}`} gold />
            <ResultRow label="利息收益" val={`RM ${result.earned.toFixed(2)}`} />
          </>}
          {mode === 'simple' && <>
            <ResultRow label="利息" val={`RM ${result.interest.toFixed(2)}`} gold />
            <ResultRow label="本利总额" val={`RM ${result.total.toFixed(2)}`} />
          </>}
        </div>
      )}
    </div>
  )
}

function ResultRow({ label, val, gold }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: gold ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gold ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
      <span className="text-sm" style={{ color: 'rgba(245,230,200,0.65)' }}>{label}</span>
      <span className="font-mono font-bold" style={{ color: gold ? '#ffd700' : '#f5e6c8' }}>{val}</span>
    </div>
  )
}
