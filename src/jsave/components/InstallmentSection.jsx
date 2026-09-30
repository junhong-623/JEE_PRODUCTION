import { useEffect, useMemo, useState } from 'react'
import { useJSave } from '../hooks/useJSave'
import { formatCurrency } from '../utils/currency'
import { dueInstallmentCount, estimatedAnnualFinancingRate, estimatedFinancingDifference, fromCents, installmentLink, installmentProgress, makeFixedInstallments, makeInstallments, toCents } from '../utils/installments'

const textFor = (lang, zh, en) => lang === 'zh' ? zh : en

export function InstallmentPlanFields({ plan, initialPlan, onChange, cost, purchaseDate, transactions, accounts, itemId, lang, cur, validationError }) {
  const [showSchedule, setShowSchedule] = useState(false)
  const [showAllScheduleRows, setShowAllScheduleRows] = useState(false)
  const [showPlanFields, setShowPlanFields] = useState(!initialPlan)
  const [enableError, setEnableError] = useState('')
  const [autoPastCount, setAutoPastCount] = useState(!initialPlan)
  const [recreated, setRecreated] = useState(false)
  const linkedNumbers = useMemo(() => new Set(itemId ? transactions.filter(tx => tx.type === 'expense' && tx.installmentItemId === itemId).map(tx => Number(tx.installmentNumber)) : []), [itemId, transactions])
  const hasLinked = linkedNumbers.size > 0
  const hasRecorded = Boolean(plan && (hasLinked || (!recreated && Number(initialPlan?.openingPaidCount) > 0)))
  const label = (zh, en) => textFor(lang, zh, en)
  const paymentCount = Number(plan?.paymentCount ?? plan?.installments?.length ?? 0)
  const amountMode = plan?.amountMode === 'monthly' ? 'monthly' : 'total'
  const suggestedPastCount = dueInstallmentCount(plan?.startDate, paymentCount)
  const financingDifference = estimatedFinancingDifference(cost, plan?.upfrontAmount, plan?.totalPayable)
  const annualFinancingRate = estimatedAnnualFinancingRate(cost, plan?.upfrontAmount, plan?.installments)
  const progress = plan?.installments?.length ? installmentProgress({ id: itemId, installmentPlan: plan }, transactions) : null
  const paidCount = progress?.paidCount || 0
  const progressPercent = paymentCount ? Math.round(paidCount / paymentCount * 100) : 0
  const scheduleRows = plan?.installments?.map((row, index) => ({
    row,
    index,
    paid: row.number <= Number(plan.openingPaidCount || 0) || linkedNumbers.has(row.number),
  })) || []
  const upcomingScheduleRows = scheduleRows.filter(entry => !entry.paid).slice(0, 5)
  const paidPreviewSlots = 5 - upcomingScheduleRows.length
  const recentPaidScheduleRows = paidPreviewSlots > 0 ? scheduleRows.filter(entry => entry.paid).slice(-paidPreviewSlots) : []
  const previewScheduleRows = [...recentPaidScheduleRows, ...upcomingScheduleRows]

  useEffect(() => { if (validationError) setShowPlanFields(true) }, [validationError])

  function scheduleFor(next) {
    const count = Number(next.paymentCount ?? next.installments.length)
    if (next.amountMode === 'monthly') {
      const rows = makeFixedInstallments(next.monthlyAmount, count, next.startDate, next.lastPaymentAmount === '' || next.lastPaymentAmount == null ? next.monthlyAmount : next.lastPaymentAmount)
      return { ...next, totalPayable: fromCents(rows.reduce((sum, row) => sum + toCents(row.amount), 0)), installments: rows, ...(autoPastCount && { openingPaidCount: dueInstallmentCount(next.startDate, count) }) }
    }
    return { ...next, installments: makeInstallments(next.totalPayable, count, next.startDate), ...(autoPastCount && { openingPaidCount: dueInstallmentCount(next.startDate, count) }) }
  }

  function enable(checked) {
    if (checked && Number(cost) <= 0) {
      setEnableError(label('请先填写物品价格。', 'Enter the item price first.'))
      return
    }
    if (!checked && hasLinked) return
    if (!checked && initialPlan && Number(plan?.openingPaidCount) > 0 && !window.confirm(label('移除分期计划也会删除过去已付进度。确定继续？', 'Removing this plan also removes the past-payment progress. Continue?'))) return
    setEnableError('')
    if (checked && !plan) {
      setAutoPastCount(true)
      setShowPlanFields(true)
      onChange({ provider: '', chargeAccountId: '', upfrontAmount: 0, totalPayable: 0, startDate: purchaseDate || '', openingPaidCount: dueInstallmentCount(purchaseDate, 3), paymentCount: 3, amountMode: 'monthly', monthlyAmount: '', lastPaymentAmount: '', installments: [] })
    } else if (!checked) { setRecreated(true); onChange(null) }
  }

  function updateBasics(fields) {
    const next = { ...plan, ...fields }
    if (amountMode === 'total' && 'upfrontAmount' in fields && toCents(plan.totalPayable) === toCents(Number(cost) - Number(plan.upfrontAmount))) {
      next.totalPayable = fromCents(toCents(cost) - toCents(fields.upfrontAmount))
    }
    onChange(scheduleFor(next))
  }

  function chooseMode(mode) {
    if (mode === amountMode || hasRecorded) return
    if (mode === 'monthly') {
      const monthlyAmount = plan.installments[0]?.amount || fromCents(Math.ceil(toCents(plan.totalPayable) / (paymentCount || 1)))
      onChange(scheduleFor({ ...plan, amountMode: 'monthly', paymentCount, monthlyAmount, lastPaymentAmount: '' }))
    } else {
      const { monthlyAmount, lastPaymentAmount, ...withoutMonthly } = plan
      onChange(scheduleFor({ ...withoutMonthly, amountMode: 'total', paymentCount, totalPayable: Number(plan.totalPayable) || fromCents(toCents(cost) - toCents(plan.upfrontAmount)) }))
    }
  }

  function updateTerm(years, months) {
    const count = Number(years) * 12 + Number(months)
    if (!Number.isInteger(count) || count < 0 || count > 120) return
    onChange(scheduleFor({ ...plan, paymentCount: count }))
  }

  function updateRow(index, fields) {
    const rows = plan.installments.map((row, i) => i === index ? { ...row, ...fields } : row)
    const next = { ...plan, ...(index === 0 && fields.dueDate ? { startDate: fields.dueDate } : {}), installments: rows }
    if (index === 0 && fields.dueDate && autoPastCount) next.openingPaidCount = dueInstallmentCount(fields.dueDate, paymentCount)
    if ('amount' in fields && !hasRecorded) {
      next.totalPayable = fromCents(rows.reduce((sum, row) => sum + toCents(row.amount), 0))
      if (amountMode === 'monthly' && index === rows.length - 1) next.lastPaymentAmount = fields.amount
    }
    onChange(next)
  }

  return <section className="jsave-installment-editor" aria-label={label('分期付款', 'Installments')}>
    <div className="jsave-installment-toggle">
      <span><strong>{label('分期付款', 'Installment payments')}</strong><small>{label('在物品里追踪未来待扣款；实际支出仍按每期交易记录。', 'Track future installments here. Actual spending follows each payment transaction.')}</small></span>
      <label className="jsave-toggle"><input type="checkbox" checked={Boolean(plan)} disabled={Boolean(plan && hasLinked)} onChange={event => enable(event.target.checked)} /><span className="jsave-toggle-track" /></label>
    </div>
    {enableError && <p className="jsave-error" role="alert">{enableError}</p>}
    {hasLinked && <p className="jsave-installment-hint">{label('如需移除计划，请先在下方取消所有付款关联。', 'Unlink every recorded payment below before removing the plan.')}</p>}
    {plan && <div className="jsave-installment-editor-body">
      <div className="jsave-installment-progress-summary">
        <div><strong>{label('还款进度', 'Payment progress')}</strong><span>{paidCount}/{paymentCount} {label('期已付', 'payments made')} · {progressPercent}%</span></div>
        <div className="jsave-installment-progress-track" role="progressbar" aria-label={label('还款进度', 'Payment progress')} aria-valuemin={0} aria-valuemax={paymentCount || 1} aria-valuenow={paidCount}><i style={{ width: `${progressPercent}%` }} /></div>
      </div>
      <button type="button" className="jsave-installment-fields-toggle" aria-expanded={showPlanFields} onClick={() => setShowPlanFields(value => !value)}>
        <span>{showPlanFields ? label('收起分期设置', 'Hide installment settings') : label('展开分期设置', 'Show installment settings')}</span><span aria-hidden="true">{showPlanFields ? '⌃' : '⌄'}</span>
      </button>
      {showPlanFields && <>
      <div className="jsave-installment-mode" role="group" aria-label={label('金额输入方式', 'Amount entry method')}>
        <button type="button" className={amountMode === 'monthly' ? 'active' : ''} aria-pressed={amountMode === 'monthly'} disabled={hasRecorded} onClick={() => chooseMode('monthly')}>{label('我知道每月供款', 'I know the monthly payment')}</button>
        <button type="button" className={amountMode === 'total' ? 'active' : ''} aria-pressed={amountMode === 'total'} disabled={hasRecorded} onClick={() => chooseMode('total')}>{label('我知道分期总额', 'I know the total')}</button>
      </div>
      <div className="jsave-installment-fields">
        <label><span>{label('付款平台 / 名称', 'Provider / plan')}</span><input className="jsave-input" value={plan.provider || ''} placeholder="Shopee / Grab PayLater" onChange={event => onChange({ ...plan, provider: event.target.value })} /></label>
        <label><span>{label('每期扣款账户（可选）', 'Account charged each time (optional)')}</span><select className="jsave-input" value={plan.chargeAccountId || ''} onChange={event => onChange({ ...plan, chargeAccountId: event.target.value })}><option value="">{label('每次记账时选择', 'Choose when recording')}</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label><span>{label('首付', 'Down payment')} ({cur})</span><input className="jsave-input" type="number" min="0" step="0.01" value={plan.upfrontAmount} disabled={hasRecorded} onChange={event => updateBasics({ upfrontAmount: event.target.value })} /></label>
        {amountMode === 'monthly' ? <>
          <label><span>{label('每月供款', 'Monthly payment')} ({cur})</span><input className="jsave-input" type="number" min="0.01" step="0.01" inputMode="decimal" value={plan.monthlyAmount ?? ''} disabled={hasRecorded} onChange={event => updateBasics({ monthlyAmount: event.target.value })} /></label>
          <label><span>{label('最后一期金额（可选）', 'Final payment (optional)')} ({cur})</span><input className="jsave-input" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder={label('与每月相同', 'Same as monthly')} value={plan.lastPaymentAmount ?? ''} disabled={hasRecorded} onChange={event => updateBasics({ lastPaymentAmount: event.target.value })} /></label>
        </> : <label><span>{label('分期总额（含手续费）', 'Installment total incl. fees')} ({cur})</span><input className="jsave-input" type="number" min="0.01" step="0.01" inputMode="decimal" value={plan.totalPayable} disabled={hasRecorded} onChange={event => updateBasics({ totalPayable: event.target.value })} /></label>}
        <label><span>{label('第一期日期', 'First due date')}</span><input className="jsave-input" type="date" value={plan.startDate || ''} disabled={hasRecorded} onChange={event => updateBasics({ startDate: event.target.value })} /></label>
        <div className="jsave-installment-term"><span>{label('供款期限', 'Payment term')}</span><div>
          <label><select className="jsave-input" aria-label={label('供款年数', 'Payment years')} value={Math.floor(paymentCount / 12)} disabled={hasRecorded} onChange={event => updateTerm(event.target.value, Math.floor(paymentCount / 12) === 0 && Number(event.target.value) > 0 ? 0 : paymentCount % 12)}>{Array.from({ length: 11 }, (_, years) => <option key={years} value={years}>{years} {label('年', years === 1 ? 'year' : 'years')}</option>)}</select></label>
          <label><select className="jsave-input" aria-label={label('额外月数', 'Additional months')} value={paymentCount % 12} disabled={hasRecorded} onChange={event => updateTerm(Math.floor(paymentCount / 12), event.target.value)}>{Array.from({ length: 12 }, (_, months) => <option key={months} value={months} disabled={paymentCount >= 120 && months > 0}>{months} {label('个月', months === 1 ? 'month' : 'months')}</option>)}</select></label>
        </div><small>{label(`每月一期 · 共 ${paymentCount} 期`, `One payment per month · ${paymentCount} payments`)}</small></div>
        <div className="jsave-installment-past"><label><span>{label('过去已付期数', 'Past payments already made')}</span><input className="jsave-input" type="number" min="0" max={paymentCount} step="1" value={plan.openingPaidCount ?? 0} disabled={hasLinked} onChange={event => { setAutoPastCount(false); onChange({ ...plan, openingPaidCount: event.target.value }) }} /></label><small>{label(`按日期推算有 ${suggestedPastCount} 期已到期；请确认实际已付期数。`, `${suggestedPastCount} payments are due by date; confirm how many were actually paid.`)}</small>{!autoPastCount && !hasLinked && <button type="button" onClick={() => { setAutoPastCount(true); onChange({ ...plan, openingPaidCount: suggestedPastCount }) }}>{label('按日期重新填入', 'Fill from dates')}</button>}</div>
      </div>
      {hasRecorded && <p className="jsave-installment-hint">{label('已有付款后，基础期数与总额会锁定。未来各期的日期和金额仍可调整，但合计须保持相同。', 'Once payments are recorded, the basic terms are locked. You can adjust future dates and amounts if their total stays the same.')}</p>}
      <p className="jsave-installment-hint">{label('物品价格用于日均成本。首付请另记实际支出；过去已付期数不会自动补造历史交易。修改供款或期限会重算未来每期金额。', 'Item cost is used for cost per day. Record the down payment separately; past payments do not create historical transactions. Changing payments or term recalculates the schedule.')}</p>
      </>}
      <div className="jsave-installment-cost-breakdown">
        <div><span>{label('预计总供款', 'Estimated installment total')}</span><strong>{plan.installments.length ? formatCurrency(plan.totalPayable, cur, lang) : '—'}</strong></div>
        <div><span>{label('加上首付后预计支付', 'Estimated total incl. down payment')}</span><strong>{plan.installments.length ? formatCurrency(Number(plan.upfrontAmount) + Number(plan.totalPayable), cur, lang) : '—'}</strong></div>
        {plan.installments.length && financingDifference != null && annualFinancingRate != null ? <>
          <div><span>{label('与物品价格的差额', 'Difference from item price')}</span><strong>{formatCurrency(financingDifference, cur, lang)}</strong></div>
          <div><span>{label('估算年化融资成本率', 'Estimated annual financing rate')}</span><strong>{annualFinancingRate.toFixed(2)}%</strong></div>
          <small>{label('按扣除首付后的物品价格及每月供款推算，假设首期在融资后一个月；若含手续费、保险或实际贷款额不同，不能当作银行合同利率。', 'Inferred from the item price after down payment and monthly payments, assuming the first payment is one month later. Fees, insurance or a different loan amount can change the contracted rate.')}</small>
        </> : <small>{plan.installments.length ? label('请检查物品价格、首付、期限及供款金额。', 'Check the item price, down payment, term and payment amount.') : label('填写每月供款和期限后显示预计金额。', 'Enter the monthly payment and term to see the estimate.')}</small>}
      </div>
      <button type="button" className="jsave-installment-details-toggle" onClick={() => setShowSchedule(value => !value)} aria-expanded={showSchedule}>{showSchedule ? label('收起每期明细', 'Hide payment schedule') : label('查看 / 调整每期金额与日期', 'View / edit payment schedule')} <span>{showSchedule ? '⌃' : '⌄'}</span></button>
      {showSchedule && <div className="jsave-installment-schedule-edit">
        {(showAllScheduleRows ? scheduleRows : previewScheduleRows).map(({ row, index, paid }) => {
          return <div className="jsave-installment-schedule-edit-row" key={row.number}>
            <strong>{label('第', 'No. ')}{row.number}{lang === 'zh' ? '期' : ''}</strong>
            <input className="jsave-input" type="date" aria-label={`${label('第', 'No. ')}${row.number} ${label('期日期', 'due date')}`} value={row.dueDate} disabled={paid} onChange={event => updateRow(index, { dueDate: event.target.value })} />
            <input className="jsave-input" type="number" min="0.01" step="0.01" aria-label={`${label('第', 'No. ')}${row.number} ${label('期金额', 'amount')}`} value={row.amount} disabled={paid} onChange={event => updateRow(index, { amount: event.target.value })} />
          </div>
        })}
        {scheduleRows.length > 5 && <button type="button" className="jsave-installment-more-toggle" aria-expanded={showAllScheduleRows} onClick={() => setShowAllScheduleRows(value => !value)}>
          {showAllScheduleRows ? label('收起其余期数', 'Show fewer payments') : label(`查看其余 ${scheduleRows.length - previewScheduleRows.length} 期（含已付）`, `Show ${scheduleRows.length - previewScheduleRows.length} more payments, including paid`)} <span aria-hidden="true">{showAllScheduleRows ? '⌃' : '⌄'}</span>
        </button>}
        <div className="jsave-installment-schedule-total"><span>{label('每期合计 / 分期总额', 'Schedule / installment total')}</span><strong>{formatCurrency(fromCents(plan.installments.reduce((sum, row) => sum + toCents(row.amount), 0)), cur, lang)} / {formatCurrency(Number(plan.totalPayable), cur, lang)}</strong></div>
      </div>}
    </div>}
  </section>
}

export function InstallmentPaymentManager({ item, onRecord, lang, cur }) {
  const { accounts, transactions, updateTransaction } = useJSave()
  const [showPayments, setShowPayments] = useState(false)
  const [showPaid, setShowPaid] = useState(false)
  const [showAllUnpaid, setShowAllUnpaid] = useState(false)
  const [linkingNumber, setLinkingNumber] = useState(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const progress = installmentProgress(item, transactions)
  const label = (zh, en) => textFor(lang, zh, en)
  const money = value => formatCurrency(value, cur, lang)
  const candidates = useMemo(() => {
    if (!progress || linkingNumber == null) return []
    const row = progress.rows.find(entry => entry.number === linkingNumber)
    const query = search.trim().toLowerCase()
    return transactions.filter(tx => tx.type === 'expense' && !installmentLink(tx) && (
      query ? `${tx.note || ''} ${tx.amount} ${tx.date}`.toLowerCase().includes(query) : toCents(tx.amount) === toCents(row?.amount)
    )).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8)
  }, [progress, linkingNumber, search, transactions])

  if (!progress) return null

  async function link(tx, row) {
    if (transactions.some(current => current.type === 'expense' && current.installmentItemId === item.id && Number(current.installmentNumber) === row.number)) return
    setBusy(true); setError('')
    try {
      await updateTransaction(tx.id, { installmentItemId: item.id, installmentNumber: row.number })
      setLinkingNumber(null); setSearch('')
    } catch {
      setError(label('关联失败，请重试。', 'Could not link this payment. Try again.'))
    } finally { setBusy(false) }
  }

  async function unlink(tx) {
    setBusy(true); setError('')
    try { await updateTransaction(tx.id, { installmentItemId: null, installmentNumber: null }) }
    catch { setError(label('取消关联失败，请重试。', 'Could not unlink this payment. Try again.')) }
    finally { setBusy(false) }
  }

  const unpaidRows = progress.rows.filter(row => !row.paid)
  const paidRows = progress.rows.filter(row => row.paid)

  function paymentRow(row) {
    return <div className={`jsave-installment-payment ${row.paid ? 'is-paid' : ''}`} key={row.number}>
      <div className="jsave-installment-payment-main"><span className="jsave-installment-payment-number">{row.number}</span><div><strong>{money(row.amount)}</strong><small>{row.dueDate} · {row.opening ? label('期初已付', 'Past payment') : row.transaction ? label('已关联支出', 'Expense linked') : label('尚未扣款', 'Not charged')}</small></div></div>
      {row.transaction ? <button type="button" className="jsave-installment-text-button" disabled={busy} onClick={() => unlink(row.transaction)}>{label('取消关联', 'Unlink')}</button> : !row.opening && <div className="jsave-installment-payment-actions"><button type="button" className="jsave-installment-record" onClick={() => onRecord(item, row)}>{label('记下这期', 'Record')}</button><button type="button" className="jsave-installment-text-button" onClick={() => { setLinkingNumber(linkingNumber === row.number ? null : row.number); setSearch('') }}>{label('关联已有', 'Link existing')}</button></div>}
      {row.transaction && toCents(row.transaction.amount) !== toCents(row.amount) && <small className="jsave-installment-actual">{label('实际扣款', 'Actual charge')} {money(row.transaction.amount)}</small>}
      {linkingNumber === row.number && <div className="jsave-installment-linker"><input className="jsave-input" type="search" placeholder={label('搜索商家、金额或日期', 'Search note, amount or date')} value={search} onChange={event => setSearch(event.target.value)} /><small>{search ? label('匹配的未关联支出', 'Matching unlinked expenses') : label('先显示相同金额的未关联支出', 'Showing unlinked expenses with the same amount')}</small>{candidates.length ? candidates.map(tx => <button type="button" key={tx.id} className="jsave-installment-candidate" disabled={busy} onClick={() => link(tx, row)}><span>{tx.note || label('无备注支出', 'Expense without note')}<small>{tx.date}</small></span><strong>{money(tx.amount)}</strong></button>) : <p>{label('找不到交易。可尝试搜索，或直接记下这期。', 'No matching expense. Search again or record this payment.')}</p>}</div>}
    </div>
  }

  return <section className="jsave-installment-manager" aria-label={label('分期进度', 'Installment progress')}>
    <div className="jsave-installment-manager-heading"><div><strong>{label('分期进度', 'Installment progress')}</strong><small>{item.installmentPlan.provider || label('付款计划', 'Payment plan')} · {progress.paidCount}/{progress.rows.length} {label('期已记录', 'payments recorded')}</small></div><span className={`jsave-installment-status ${progress.status}`}>{label(progress.status === 'settled' ? '已结清' : progress.status === 'notStarted' ? '未开始' : '分期中', progress.status === 'settled' ? 'Complete' : progress.status === 'notStarted' ? 'Not started' : 'In progress')}</span></div>
    <div className="jsave-installment-progress-summary jsave-installment-manager-progress">
      <div><strong>{label('还款进度', 'Payment progress')}</strong><span>{Math.round(progress.paidCount / progress.rows.length * 100)}%</span></div>
      <div className="jsave-installment-progress-track" role="progressbar" aria-label={label('还款进度', 'Payment progress')} aria-valuemin={0} aria-valuemax={progress.rows.length} aria-valuenow={progress.paidCount}><i style={{ width: `${progress.paidCount / progress.rows.length * 100}%` }} /></div>
    </div>
    <div className="jsave-installment-manager-meta"><span>{label('物品价格', 'Item price')} <strong>{money(item.cost)}</strong></span>{item.installmentPlan.chargeAccountId && <span>{label('扣款账户', 'Charge account')} <strong>{accounts.find(account => account.id === item.installmentPlan.chargeAccountId)?.name || label('账户已移除', 'Account removed')}</strong></span>}{progress.next && <span>{label('下一期', 'Next due')} <strong>{progress.next.dueDate} · {money(progress.next.amount)}</strong></span>}</div>
    <div className="jsave-installment-manager-total"><span>{label('未来待扣款', 'Future payments')}</span><strong>{money(progress.futureAmount)}</strong></div>
    <p className="jsave-installment-hint">{label('已扣到信用卡但未还卡的金额，请在信用卡账户余额查看。', 'Amounts charged to your card but not yet repaid remain in your credit card balance.')}</p>
    <button type="button" className="jsave-installment-details-toggle" aria-expanded={showPayments} aria-controls={`jsave-installment-payments-${item.id}`} onClick={() => { setShowPayments(value => !value); setLinkingNumber(null); setSearch('') }}>
      {showPayments ? label('收起每期明细', 'Hide payment details') : label('查看每期明细', 'View payment details')} · {progress.rows.length} {label('期', 'payments')} <span aria-hidden="true">{showPayments ? '⌃' : '⌄'}</span>
    </button>
    {showPayments && <div id={`jsave-installment-payments-${item.id}`} className="jsave-installment-payment-groups">
      {unpaidRows.length > 0 && <div className="jsave-installment-payment-group">
        <div className="jsave-installment-payment-group-title">{label('待付', 'Unpaid')} · {unpaidRows.length} {label('期', 'payments')}</div>
        <div className="jsave-installment-payment-list">{(showAllUnpaid ? unpaidRows : unpaidRows.slice(0, 5)).map(paymentRow)}</div>
        {unpaidRows.length > 5 && <button type="button" className="jsave-installment-more-toggle" aria-expanded={showAllUnpaid} onClick={() => { setShowAllUnpaid(value => !value); setLinkingNumber(null); setSearch('') }}>
          {showAllUnpaid ? label('收起其余待付期数', 'Show fewer unpaid payments') : label(`查看其余 ${unpaidRows.length - 5} 期待付`, `Show ${unpaidRows.length - 5} more unpaid payments`)} <span aria-hidden="true">{showAllUnpaid ? '⌃' : '⌄'}</span>
        </button>}
      </div>}
      {paidRows.length > 0 && <div className="jsave-installment-payment-group">
        <button type="button" className="jsave-installment-paid-toggle" aria-expanded={showPaid} aria-controls={`jsave-installment-paid-${item.id}`} onClick={() => setShowPaid(value => !value)}>
          {label('已付', 'Paid')} · {paidRows.length} {label('期', 'payments')} <span aria-hidden="true">{showPaid ? '⌃' : '⌄'}</span>
        </button>
        {showPaid && <div id={`jsave-installment-paid-${item.id}`} className="jsave-installment-payment-list">{paidRows.map(paymentRow)}</div>}
      </div>}
    </div>}
    {error && <p className="jsave-error">{error}</p>}
  </section>
}
