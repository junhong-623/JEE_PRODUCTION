import { useMemo, useState } from 'react'
import { ResultRow, SectionIntro } from '../components/Common'
import { formatMYR, getPayout, OPERATOR_LABELS, PRIZE_LABELS, PRIZE_ORDER, STRAIGHT_PAYOUT } from '../lib/fourD'

export default function PayoutCalculator() {
  const [operator, setOperator] = useState('magnum')
  const [betType, setBetType] = useState('big')
  const [prize, setPrize] = useState('first')
  const [amount, setAmount] = useState('1')
  const result = useMemo(() => getPayout({ betType, prize, amount }), [betType, prize, amount])

  const changeBetType = event => {
    const nextBetType = event.target.value
    setBetType(nextBetType)
    if (STRAIGHT_PAYOUT[nextBetType][prize] == null) setPrize('first')
  }

  return (
    <div className="lc-page">
      <SectionIntro
        eyebrow="STRAIGHT PLAY"
        title="4D 奖金计算器"
        description="根据直注 Straight Play 的 Big / Small 固定奖金表，估算每笔投注的中奖金额。"
      />

      <div className="lc-tool-split lc-payout-layout">
        <section className="lc-panel lc-form-panel">
          <div className="lc-form-grid">
            <label>
              <span>运营商</span>
              <select className="lc-select" value={operator} onChange={event => setOperator(event.target.value)}>
                {Object.entries(OPERATOR_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>投注方式</span>
              <select className="lc-select" value={betType} onChange={changeBetType}>
                <option value="big">大字（Big / ABC）</option>
                <option value="small">小字（Small / A）</option>
              </select>
            </label>
            <label>
              <span>奖项</span>
              <select className="lc-select" value={prize} onChange={event => setPrize(event.target.value)}>
                {PRIZE_ORDER.map(value => (
                  <option key={value} value={value} disabled={STRAIGHT_PAYOUT[betType][value] == null}>{PRIZE_LABELS[value]}</option>
                ))}
              </select>
            </label>
            <label>
              <span>投注金额（RM）</span>
              <input className="lc-input" type="number" inputMode="decimal" min="0.5" step="0.5" value={amount} onChange={event => setAmount(event.target.value)} />
            </label>
          </div>
          <p className="lc-field-hint">此计算只适用于直注，不包括 i-Perm、iBox、Jackpot 或其他特别玩法。</p>
        </section>

        <section className="lc-panel lc-payout-result" aria-live="polite">
          <p className="lc-eyebrow">ESTIMATED PRIZE</p>
          {result.error ? (
            <div className="lc-payout-error"><strong>无法计算</strong><p>{result.error}</p></div>
          ) : (
            <>
              <span className="lc-payout-operator">{OPERATOR_LABELS[operator]} · {betType === 'big' ? 'Big' : 'Small'} · {PRIZE_LABELS[prize]}</span>
              <strong className="lc-payout-total">{formatMYR(result.payout)}</strong>
              <div className="lc-result-list">
                <ResultRow label="每 RM1 奖金" value={formatMYR(result.unitPrize)} />
                <ResultRow label="投注金额" value={formatMYR(result.stake)} />
                <ResultRow label="预估奖金" value={formatMYR(result.payout)} highlight />
              </div>
            </>
          )}
          <p className="lc-source-note">奖金表最后核对：2026-09 · 如有差异，以运营商官方规则为准。</p>
        </section>
      </div>
    </div>
  )
}
