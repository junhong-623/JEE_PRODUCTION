const crypto = require('crypto')

const STORE_COLLECTIONS = {
  transactions: 'jsave_transactions',
  accounts: 'jsave_accounts',
  items: 'jsave_items',
  goals: 'jsave_goals',
  settings: 'jsave_settings',
}

function validateSelection(input) {
  if (!Array.isArray(input) || !input.length || input.length > 5 || input.some(store => !STORE_COLLECTIONS[store]) || new Set(input).size !== input.length) {
    throw new Error('invalid-selection')
  }
  if (input.includes('accounts') && !input.includes('transactions')) throw new Error('transactions-required')
  return input
}

async function clearJSaveData({ db, uid, selected, destroyCover }) {
  validateSelection(selected)
  const chosen = new Set(selected)
  const affected = new Set(selected)
  if (chosen.has('items') && !chosen.has('transactions')) affected.add('transactions')
  if ((chosen.has('items') || chosen.has('accounts') || chosen.has('transactions')) && !chosen.has('settings')) affected.add('settings')
  const stateRef = db.collection('jsave_clear_state').doc(uid)
  const { epochs, revision } = await db.runTransaction(async tx => {
    const current = await tx.get(stateRef)
    if (current.data()?.clearingStores?.length) throw new Error('clear-in-progress')
    const next = { ...(current.data()?.epochs || {}) }
    for (const store of affected) next[store] = crypto.randomUUID()
    const revision = Number(current.data()?.revision || 0) + 1
    tx.set(stateRef, { epochs: next, revision, selected, clearingStores: [...affected], updatedAt: Date.now() })
    return { epochs: next, revision }
  })

  const user = db.collection('users').doc(uid)
  const coverPaths = []
  const counts = {}
  const writer = db.bulkWriter()
  const writeErrors = []
  try {
    try {
      for (const store of selected) {
        const snapshot = await user.collection(STORE_COLLECTIONS[store]).get()
        counts[store] = snapshot.size
        for (const document of snapshot.docs) {
          if ((store === 'items' || store === 'goals') && document.data().coverPath) coverPaths.push(document.data().coverPath)
          writer.delete(document.ref).catch(error => { writeErrors.push(error) })
        }
      }

      if (chosen.has('items') && !chosen.has('transactions')) {
        const snapshot = await user.collection('jsave_transactions').get()
        for (const document of snapshot.docs) {
          const patch = { syncEpoch: epochs.transactions }
          if (document.data().installmentItemId) {
            patch.installmentItemId = null
            patch.installmentNumber = null
          }
          writer.update(document.ref, patch).catch(error => { writeErrors.push(error) })
        }
      }

      if (affected.has('settings') && !chosen.has('settings')) {
        const config = user.collection('jsave_settings').doc('config')
        const current = await config.get()
        if (current.exists) {
          const patch = { syncEpoch: epochs.settings }
          if (chosen.has('accounts')) { patch.defaultAccountId = null; patch.salaryAccountId = null }
          if (chosen.has('items')) patch.homeItemId = null
          if (chosen.has('transactions') && current.data()?.autoSalary) {
            const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
            const [year, month, day] = today.split('-').map(Number)
            if (day >= Number(current.data().salaryDay || 1)) patch.lastAutoSalaryMonth = `${year}-${String(month).padStart(2, '0')}`
          }
          writer.update(config, patch).catch(error => { writeErrors.push(error) })
        }
      }
    } finally {
      await writer.close()
    }
    if (writeErrors.length) throw writeErrors[0]
  } finally {
    await stateRef.update({ clearingStores: [], updatedAt: Date.now() })
  }

  const failedCovers = []
  for (const path of coverPaths) {
    if (typeof path !== 'string' || !path.startsWith(`jsave/${uid}/`)) continue
    try { await destroyCover(path) } catch { failedCovers.push(path) }
  }
  return { epochs, revision, counts, failedCovers: failedCovers.length }
}

module.exports = { STORE_COLLECTIONS, validateSelection, clearJSaveData }
