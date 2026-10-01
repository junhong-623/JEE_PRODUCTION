const { validateCategory } = require('./jsaveShortcut')
const { universalReceiptDraft, universalDocumentId, resolveUniversalAccounts, universalRoutingToken, rememberUniversalAccounts } = require('./jsaveReceiptUniversal')

async function importUniversalReceipt({ input, res, uid, keyRef, keyData, expectedHash, db, FieldValue }) {
  try {
    const parsed = universalReceiptDraft(input)
    if (parsed.pending) return res.status(422).json(parsed.pending)
    const draft = parsed.draft
    const accountCollection = db.collection('users').doc(uid).collection('jsave_accounts')
    const snapshots = await accountCollection.get()
    const accounts = snapshots.docs.filter(doc => !doc.data().deleted).map(doc => ({ ...doc.data(), id: doc.id }))
    const resolved = resolveUniversalAccounts(draft, input.text, accounts, keyData, input.accountSelections || {}, input.chooseAccounts === true || input.chooseAccounts === '1')
    if (resolved.pending) return res.status(409).json(resolved.pending)
    const selections = { source: resolved.sourceAccountId, target: resolved.targetAccountId }
    const source = accounts.find(account => account.id === selections.source)
    const target = accounts.find(account => account.id === selections.target)
    const routingToken = universalRoutingToken(expectedHash, draft, input.text, keyData, selections)
    if (input.action === 'preview') return res.json({ draft: {
      provider: draft.sourceLabel, type: draft.type, amount: draft.amount, currency: draft.currency,
      date: draft.date, time: draft.time, note: draft.note, reference: draft.reference || '',
      accountName: `${source.name || '未命名账户'}${target ? ` → ${target.name || '未命名账户'}` : ''}`,
      sourceAccountId: selections.source, targetAccountId: selections.target, routingToken,
      manualReview: draft.provider === 'manual',
    } })
    if (input.routingToken !== routingToken) return res.status(409).json({ error: 'account-configuration-changed' })
    if (draft.type !== 'transfer' && !validateCategory(draft.type, input.category)) return res.status(400).json({ error: 'invalid-category' })
    const transactionId = universalDocumentId(draft)
    const transactionRef = db.collection('users').doc(uid).collection('jsave_transactions').doc(transactionId)
    const now = Date.now()
    const usageRef = db.collection('jsave_shortcut_usage').doc(`${uid}_${new Date(now).toISOString().slice(0, 10)}`)
    const selectedAccounts = [source, ...(target ? [target] : [])]
    const result = await db.runTransaction(async transaction => {
      const [currentKey, existing, usage, ...currentAccounts] = await Promise.all([
        transaction.get(keyRef), transaction.get(transactionRef), transaction.get(usageRef),
        ...selectedAccounts.map(account => transaction.get(accountCollection.doc(account.id))),
      ])
      const currentData = currentKey.data() || {}
      if (currentData.keyHash !== expectedHash || universalRoutingToken(expectedHash, draft, input.text, currentData, selections) !== routingToken) return 'account-configuration-changed'
      if (currentAccounts.some(snapshot => !snapshot.exists || snapshot.data().deleted)) return 'account-not-found'
      if (currentAccounts.some((snapshot, index) => snapshot.data().type !== selectedAccounts[index].type)) return 'account-type-changed'
      try {
        resolveUniversalAccounts(draft, input.text, currentAccounts.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })), currentData, selections)
      } catch { return 'invalid-account-selection' }
      const remember = () => transaction.set(keyRef, { accountLinks: rememberUniversalAccounts(currentData.accountLinks, resolved.preferences), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      if (existing.exists) { remember(); return 'duplicate' }
      if (Number(usage.data()?.count || 0) >= 100) return 'daily-limit'
      transaction.create(transactionRef, {
        id: transactionId, userId: uid, type: draft.type, amount: draft.amount,
        category: draft.type === 'transfer' ? 'txTransfer' : input.category,
        ...(draft.type === 'transfer' ? { fromAccountId: selections.source, toAccountId: selections.target } : { accountId: selections.source }),
        date: draft.date, note: draft.note, source: `${draft.provider}-shortcut`, receiptProvider: draft.sourceLabel,
        sourceTransactionId: draft.sourceTransactionId, ...(draft.time ? { sourceTime: draft.time } : {}),
        ...(draft.provider === 'manual' ? { receiptReviewed: true } : {}),
        createdAt: now, updatedAt: now, deleted: false,
      })
      transaction.set(usageRef, { count: Number(usage.data()?.count || 0) + 1, updatedAt: FieldValue.serverTimestamp() })
      remember()
      return 'created'
    })
    if (result === 'daily-limit') return res.status(429).json({ error: result })
    if (!['created', 'duplicate'].includes(result)) return res.status(409).json({ error: result })
    return res.json({ status: result, transactionId })
  } catch (error) {
    if (/^(invalid-(?:ocr|review-|account-selection)|unsupported-provider)/.test(error.message)) return res.status(422).json({ error: error.message,
      message: ({ 'invalid-review-amount': '请填入大于零的金额（RM），最多两位小数。', 'invalid-review-date': '请核对交易日期。',
        'invalid-review-note': '请填写备注或交易对象。', 'invalid-review-type': '请选择收入、支出或转账。',
        'invalid-review-fields': '资料过长或格式不正确，请核对后重试。' })[error.message] || '请核对截图与账户后重试。' })
    console.error('[jsave-receipt-shortcut] universal import failed', error)
    return res.status(500).json({ error: 'server-error' })
  }
}

module.exports = { importUniversalReceipt }
