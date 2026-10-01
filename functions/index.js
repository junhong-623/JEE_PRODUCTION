const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { v2: cloudinary } = require('cloudinary')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore')
const webpush = require('web-push')
const crypto = require('crypto')
const { validateCategory } = require('./jsaveShortcut')
const { parseReceiptScreenshot, receiptTransactionDocumentId, receiptAccountKey, receiptTransferAccountKey, matchUobCreditAccount } = require('./jsaveReceiptShortcut')
const { RECEIPT_ACCOUNT_TYPES, normalizeReceiptAccounts, receiptRoutingToken, receiptSelectionToken, resolveReceiptAccounts } = require('./jsaveReceiptAccounts')

initializeApp()

const VAPID_PRIVATE = defineSecret('VAPID_PRIVATE_KEY')
const VAPID_PUBLIC = 'BMGKdp8QNMH0CXUHEcJc3PVSw6MXe45_ZafygoAZZF_fiFsG5Ufq3oCQrzVknLw7oG_VtQJYPxj8f9lddT_ce0A'

const CLOUDINARY_KEY    = defineSecret('CLOUDINARY_API_KEY')
const CLOUDINARY_SECRET = defineSecret('CLOUDINARY_API_SECRET')

const ADMIN_UIDS = [
  'QVLyCaNT5FgDDxXA95ZpHAiSCvy2',
  'IhcEvknXK1OQ24PdA3UmwnyxzSq1',
]

const HAGENCY_EXPERIENCE = new Set(['无经验', '1-3个月', '3-12个月', '1年以上'])
const HAGENCY_SPECIALIZATION = new Set(['唱歌', '跳舞', '聊天互动', '才艺表演', '其他'])

const receiptShortcutKeyRef = uid => getFirestore().collection('jsave_receipt_shortcut_tokens').doc(uid)
async function checkedReceiptAccounts(uid, input) {
  let accountIds
  try {
    accountIds = normalizeReceiptAccounts(input)
  } catch {
    throw new HttpsError('invalid-argument', 'Choose valid separate JSave accounts.')
  }
  const selected = Object.entries(accountIds).filter(([, id]) => id)
  const snapshots = await Promise.all(selected.map(([, id]) => getFirestore().collection('users').doc(uid)
    .collection('jsave_accounts').doc(id).get()))
  selected.forEach(([key], index) => {
    if (!snapshots[index].exists || snapshots[index].data().type !== RECEIPT_ACCOUNT_TYPES[key]) {
      throw new HttpsError('invalid-argument', 'Account type does not match the receipt source.')
    }
  })
  return accountIds
}

exports.jsaveReceiptShortcutKeyStatus = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  const snapshot = await receiptShortcutKeyRef(req.auth.uid).get()
  return { enabled: snapshot.exists, accountIds: snapshot.data()?.accountIds || {} }
})

exports.jsaveCreateReceiptShortcutKey = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  const accountIds = await checkedReceiptAccounts(req.auth.uid, req.data?.accountIds)
  const key = `jsv1_${req.auth.uid}_${crypto.randomBytes(32).toString('hex')}`
  await receiptShortcutKeyRef(req.auth.uid).set({
    keyHash: crypto.createHash('sha256').update(key).digest('hex'),
    accountIds,
    createdAt: FieldValue.serverTimestamp(),
  })
  return { key, accountIds }
})

exports.jsaveUpdateReceiptShortcutAccounts = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  const accountIds = await checkedReceiptAccounts(req.auth.uid, req.data?.accountIds)
  const keyRef = receiptShortcutKeyRef(req.auth.uid)
  if (!(await keyRef.get()).exists) throw new HttpsError('failed-precondition', 'Create a shortcut key first.')
  await keyRef.update({ accountIds, updatedAt: FieldValue.serverTimestamp() })
  return { accountIds }
})

exports.jsaveRevokeReceiptShortcutKey = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.')
  await receiptShortcutKeyRef(req.auth.uid).delete()
  return { revoked: true }
})

exports.jsaveReceiptShortcutImport = onRequest({ invoker: 'public', cors: false }, async (req, res) => {
  res.set('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })
  const authHeader = req.get('authorization') || ''
  const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const match = key.length <= 200 && key.match(/^jsv1_(.+)_([a-f0-9]{64})$/)
  if (!match || match[1].includes('/')) return res.status(401).json({ error: 'unauthorized' })
  const uid = match[1]
  const keyRef = receiptShortcutKeyRef(uid)
  const keySnapshot = await keyRef.get()
  const expectedHash = keySnapshot.data()?.keyHash
  const actualHash = crypto.createHash('sha256').update(key).digest('hex')
  if (!expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash) ||
      !crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(actualHash, 'hex'))) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  const input = req.body || {}
  if (typeof input !== 'object' || JSON.stringify(input).length > 10000 ||
      !['preview', 'commit'].includes(input.action)) return res.status(400).json({ error: 'invalid-request' })
  if (input.action === 'preview') {
    console.info(`[jsave-receipt-shortcut] OCR preview ${JSON.stringify({
      sourceHint: input.sourceHint || '',
      ocrText: typeof input.text === 'string' ? input.text.slice(0, 8000) : input.text,
    })}`)
  }
  let draft
  try {
    draft = parseReceiptScreenshot(input.text, input.sourceHint || '')
  } catch (error) {
    console.warn(`[jsave-receipt-shortcut] OCR parse failed ${JSON.stringify({
      action: input.action,
      sourceHint: input.sourceHint || '',
      error: error.message,
      ocrText: typeof input.text === 'string' ? input.text.slice(0, 8000) : input.text,
    })}`)
    return res.status(422).json({ error: error.message, ...(error.sources ? { sources: error.sources } : {}) })
  }
  const accountIds = keySnapshot.data().accountIds || {}
  const targetAccountKey = receiptTransferAccountKey(draft)
  const firstUseSelection = input.protocolVersion === 2
  if (input.protocolVersion != null && !firstUseSelection) return res.status(400).json({ error: 'unsupported-protocol' })
  const db = getFirestore()
  const accountCollection = db.collection('users').doc(uid).collection('jsave_accounts')
  let accountId = accountIds[receiptAccountKey(draft)]
  let targetAccountId = ''
  let resolved
  if (firstUseSelection) {
    if (input.accountSelections != null && (typeof input.accountSelections !== 'object' || Array.isArray(input.accountSelections))) {
      return res.status(400).json({ error: 'invalid-account-selection' })
    }
    try {
      const accounts = await accountCollection.get()
      resolved = resolveReceiptAccounts(draft, accounts.docs.map(doc => ({ ...doc.data(), id: doc.id })), accountIds, input.accountSelections || {})
    } catch (error) {
      if (error.message === 'invalid-account-selection') return res.status(409).json({ error: error.message })
      console.error('[jsave-receipt-shortcut] account lookup failed', error)
      return res.status(500).json({ error: 'server-error' })
    }
    if (resolved.pending) return res.status(409).json(resolved.pending)
    accountId = resolved.sourceAccountId
    targetAccountId = resolved.targetAccountId
  } else if (!accountId) {
    return res.status(409).json({ error: 'source-account-not-configured' })
  } else if (draft.type === 'transfer' && draft.transferTarget === 'uobCredit') {
    targetAccountId = accountIds.uobCreditAccountId || ''
    if (!targetAccountId) {
      const accounts = await accountCollection.get()
      targetAccountId = matchUobCreditAccount(accounts.docs.map(doc => ({ ...doc.data(), id: doc.id })), draft.note)
    }
    if (!targetAccountId) return res.status(409).json({ error: 'target-account-not-configured' })
  } else if (draft.type === 'transfer') {
    targetAccountId = accountIds[targetAccountKey] || ''
  }
  if (draft.type === 'transfer' && (!targetAccountId || targetAccountId === accountId)) {
    return res.status(409).json({ error: 'transfer-account-not-configured' })
  }
  const routingToken = firstUseSelection
    ? receiptSelectionToken(expectedHash, draft, accountIds, accountId, targetAccountId)
    : receiptRoutingToken(accountIds, targetAccountId)
  if (input.action === 'commit' && input.routingToken !== routingToken) {
    return res.status(409).json({ error: 'account-configuration-changed' })
  }
  const accountSnapshots = await Promise.all([
    accountCollection.doc(accountId).get(),
    ...(targetAccountId ? [accountCollection.doc(targetAccountId).get()] : []),
  ])
  if (accountSnapshots.some(snapshot => !snapshot.exists)) return res.status(409).json({ error: 'account-not-found' })
  const expectedSourceType = RECEIPT_ACCOUNT_TYPES[receiptAccountKey(draft)]
  const expectedTargetType = RECEIPT_ACCOUNT_TYPES[targetAccountKey]
  if (accountSnapshots[0].data().type !== expectedSourceType ||
      (targetAccountId && accountSnapshots[1].data().type !== expectedTargetType)) {
    return res.status(409).json({ error: 'account-type-changed' })
  }
  if (draft.type === 'transfer' && expectedTargetType === 'accCredit') {
    const namedLastFour = (accountSnapshots[1].data().name || '').match(/(?:^|\D)(\d{4})\s*\)?\s*$/)?.[1]
    const receiptLastFour = draft.note.replace(/\D/g, '').slice(-4)
    if (namedLastFour && receiptLastFour && namedLastFour !== receiptLastFour) {
      return res.status(409).json({ error: 'target-account-mismatch' })
    }
  }
  if (input.action === 'preview') {
    const sourceName = accountSnapshots[0].data().name || draft.provider.toUpperCase()
    const accountName = targetAccountId
      ? `${sourceName} → ${accountSnapshots[1].data().name || (expectedTargetType === 'accCredit' ? '信用卡' : 'TNG')}` : sourceName
    return res.json({ draft: {
      provider: draft.provider, type: draft.type, amount: draft.amount,
      currency: draft.currency, date: draft.date, time: draft.time,
      note: draft.note, accountName, routingToken,
      ...(firstUseSelection ? { sourceAccountId: accountId, targetAccountId } : {}),
    } })
  }
  if (draft.type !== 'transfer' && !validateCategory(draft.type, input.category)) {
    return res.status(400).json({ error: 'invalid-category' })
  }
  const transactionId = receiptTransactionDocumentId(draft)
  const transactionRef = db.collection('users').doc(uid).collection('jsave_transactions').doc(transactionId)
  const now = Date.now()
  const usageRef = db.collection('jsave_shortcut_usage').doc(`${uid}_${new Date(now).toISOString().slice(0, 10)}`)
  try {
    const result = await db.runTransaction(async transaction => {
      const [currentKey, existing, usageSnapshot, ...currentAccounts] = await Promise.all([
        transaction.get(keyRef), transaction.get(transactionRef), transaction.get(usageRef),
        ...accountSnapshots.map(snapshot => transaction.get(snapshot.ref)),
      ])
      const currentIds = currentKey.data()?.accountIds || {}
      const currentRouting = firstUseSelection
        ? receiptSelectionToken(expectedHash, draft, currentIds, accountId, targetAccountId)
        : receiptRoutingToken(currentIds, targetAccountId)
      if (currentKey.data()?.keyHash !== expectedHash || currentRouting !== routingToken) return 'revoked'
      if (currentAccounts.some(snapshot => !snapshot.exists)) return 'account-not-found'
      if (currentAccounts[0].data().type !== expectedSourceType ||
          (targetAccountId && currentAccounts[1].data().type !== expectedTargetType)) return 'account-type-changed'
      if (firstUseSelection) {
        try {
          resolveReceiptAccounts(draft, currentAccounts.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })), currentIds, { source: accountId, target: targetAccountId })
        } catch { return 'invalid-account-selection' }
      }
      const rememberAccounts = () => {
        if (firstUseSelection) transaction.set(keyRef, { accountIds: resolved.rememberedIds, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      }
      if (existing.exists) { rememberAccounts(); return 'duplicate' }
      const count = Number(usageSnapshot.data()?.count || 0)
      if (count >= 100) return 'rate-limited'
      transaction.create(transactionRef, {
        id: transactionId, userId: uid, type: draft.type, amount: draft.amount,
        category: draft.type === 'transfer' ? 'txTransfer' : input.category,
        ...(draft.type === 'transfer'
          ? { fromAccountId: accountId, toAccountId: targetAccountId }
          : { accountId }),
        date: draft.date, note: draft.note, source: `${draft.provider}-shortcut`,
        sourceTransactionId: draft.sourceTransactionId,
        ...(draft.time ? { sourceTime: draft.time } : {}),
        createdAt: now, updatedAt: now, deleted: false,
      })
      transaction.set(usageRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() })
      rememberAccounts()
      return 'created'
    })
    if (result === 'revoked') return res.status(409).json({ error: 'account-configuration-changed' })
    if (result === 'rate-limited') return res.status(429).json({ error: 'daily-limit' })
    if (['account-not-found', 'account-type-changed', 'invalid-account-selection'].includes(result)) return res.status(409).json({ error: result })
    return res.json({ status: result, transactionId })
  } catch (error) {
    console.error('[jsave-receipt-shortcut] import failed', error)
    return res.status(500).json({ error: 'server-error' })
  }
})

function cleanHAgencyText(value, maxLength, required = false) {
  if (value == null) value = ''
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Invalid application field.')
  const cleaned = value.trim().replace(/\u0000/g, '')
  if (required && !cleaned) throw new HttpsError('invalid-argument', 'Please complete all required fields.')
  if (cleaned.length > maxLength) throw new HttpsError('invalid-argument', 'An application field is too long.')
  return cleaned
}

/**
 * Callable: submitHAgencyApplication
 * Validates and stores public recruitment applications server-side.
 */
exports.submitHAgencyApplication = onCall(async (req) => {
  const input = req.data || {}

  // Honeypot: normal clients always submit this as an empty string.
  if (input.company) return { accepted: true }

  const name = cleanHAgencyText(input.name, 80, true)
  const phone = cleanHAgencyText(input.phone, 40, true)
  const wechat = cleanHAgencyText(input.wechat, 80)
  const email = cleanHAgencyText(input.email, 160)
  const experience = cleanHAgencyText(input.experience, 30, true)
  const specialization = cleanHAgencyText(input.specialization, 30, true)
  const introduction = cleanHAgencyText(input.introduction, 1200, true)
  const social = cleanHAgencyText(input.social, 400)
  const photoUrl = cleanHAgencyText(input.photoUrl, 600, true)
  const photoPublicId = cleanHAgencyText(input.photoPublicId, 240)
  const locale = input.locale === 'en' ? 'en' : 'zh'
  const age = Number(input.age)

  if (!Number.isInteger(age) || age < 13 || age > 99) {
    throw new HttpsError('invalid-argument', 'Please enter a valid age.')
  }
  if (!/^[+\d][\d\s()-]{6,39}$/.test(phone)) {
    throw new HttpsError('invalid-argument', 'Please enter a valid phone number.')
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Please enter a valid email address.')
  }
  if (!HAGENCY_EXPERIENCE.has(experience) || !HAGENCY_SPECIALIZATION.has(specialization)) {
    throw new HttpsError('invalid-argument', 'Invalid recruitment selection.')
  }
  let parsedPhotoUrl
  try {
    parsedPhotoUrl = new URL(photoUrl)
  } catch {
    throw new HttpsError('invalid-argument', 'Please upload a valid portrait photo.')
  }
  if (parsedPhotoUrl.protocol !== 'https:' || parsedPhotoUrl.hostname !== 'res.cloudinary.com' || !parsedPhotoUrl.pathname.startsWith('/db2ixn8zh/image/upload/')) {
    throw new HttpsError('invalid-argument', 'Please upload a valid portrait photo.')
  }

  const forwarded = req.rawRequest?.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0].trim() || req.rawRequest?.ip || 'unknown'
  const ipHash = crypto.createHash('sha256').update(`hagency:${ip}`).digest('hex')
  const db = getFirestore()
  const rateRef = db.collection('hagency_rate_limits').doc(ipHash)
  const now = Date.now()
  const windowMs = 24 * 60 * 60 * 1000

  await db.runTransaction(async transaction => {
    const snap = await transaction.get(rateRef)
    const record = snap.exists ? snap.data() : null
    const windowStartedAt = record?.windowStartedAt?.toMillis?.() || 0
    const withinWindow = now - windowStartedAt < windowMs
    const count = withinWindow ? Number(record?.count || 0) : 0
    if (count >= 3) throw new HttpsError('resource-exhausted', 'Too many applications. Please try again later.')
    transaction.set(rateRef, {
      count: count + 1,
      windowStartedAt: withinWindow ? record.windowStartedAt : Timestamp.fromMillis(now),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  const month = new Date().toISOString().slice(0, 7).replace('-', '')
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  const applicationNumber = `HA-${month}-${suffix}`
  const ref = await db.collection('hagency_submissions').add({
    applicationNumber,
    name,
    age,
    phone,
    wechat,
    email,
    experience,
    specialization,
    introduction,
    social,
    photoUrl,
    photoPublicId,
    locale,
    status: 'pending',
    source: 'website',
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    notificationStatus: 'client-best-effort',
    userAgent: String(req.rawRequest?.get('user-agent') || '').slice(0, 300),
  })

  return { accepted: true, applicationId: ref.id, applicationNumber }
})

/**
 * Callable: deleteCloudinaryImage
 * data: { publicId: string }
 * Deletes an image from Cloudinary. Admins may delete any image; authenticated
 * JSave users may only delete covers stored below their own UID folder.
 */
exports.deleteCloudinaryImage = onCall(
  {
    secrets: [CLOUDINARY_KEY, CLOUDINARY_SECRET],
    // Cloud Run must accept browser preflight requests. The callable still
    // enforces Firebase Authentication and the admin UID allowlist below.
    invoker: 'public',
  },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const { publicId } = req.data
    if (!publicId || typeof publicId !== 'string' || publicId.length > 240) {
      throw new HttpsError('invalid-argument', 'publicId is required.')
    }
    const isAdmin = ADMIN_UIDS.includes(req.auth.uid)
    const jsavePath = publicId.match(/^jsave\/([^/]+)\/(goals|items)\/([^/]+)\/([^/]+)$/)
    const isOwnJSaveImage = jsavePath?.[1] === req.auth.uid
    if (!isAdmin && !isOwnJSaveImage) {
      throw new HttpsError('permission-denied', 'You may only delete your own JSave images.')
    }

    cloudinary.config({
      cloud_name:  'db2ixn8zh',
      api_key:     CLOUDINARY_KEY.value(),
      api_secret:  CLOUDINARY_SECRET.value(),
    })

    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return { result }
    } catch (err) {
      throw new HttpsError('internal', `Cloudinary delete failed: ${err.message}`)
    }
  }
)

// ── JSave reminder helpers ────────────────────────────────────────────────────

async function sendJSaveReminders(hour) {
  webpush.setVapidDetails(
    'mailto:jeejunhong@gmail.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE.value().trim()
  )

  const db = getFirestore()
  // Malaysia time = UTC+8
  const now = new Date()
  const myt = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const today = myt.toISOString().split('T')[0]

  const subsSnap = await db.collection('jsavePushSubs')
    .where('dailyReminder', '==', true)
    .get()

  // Group devices by uid — check transactions once per user, send to all their devices
  const byUid = {}
  for (const d of subsSnap.docs) {
    const { uid, subscription, language } = d.data()
    if (!uid || !subscription) continue
    if (!byUid[uid]) byUid[uid] = { language, devices: [] }
    byUid[uid].devices.push({ docId: d.id, subscription })
  }

  console.log(`[jsave-reminders] hour=${hour} today=${today} users=${Object.keys(byUid).length} devices=${subsSnap.size}`)

  const sends = Object.entries(byUid).map(async ([uid, { language, devices }]) => {
    // Check if user already recorded transactions today
    const txSnap = await db.collection('users').doc(uid)
      .collection('jsave_transactions')
      .where('date', '==', today)
      .get()

    const hasRecord = txSnap.docs.some(d => {
      const tx = d.data()
      return !tx.deleted && tx.type !== 'transfer'
    })
    if (hasRecord) {
      console.log(`[jsave-reminders] uid=${uid} already has records — skip`)
      return
    }

    const zh = language === 'zh'
    const title = zh ? 'J省' : 'JSave'
    const body = hour === 13
      ? (zh ? '别忘了记录午餐消费！' : "Don't forget to log your lunch!")
      : (zh ? '今日还未记账，记一下今天的消费吧！' : 'End of day — log your transactions!')

    const payload = JSON.stringify({ title, body, tag: `jsave-reminder-${hour}` })

    // Send to every subscribed device for this user
    await Promise.allSettled(devices.map(async ({ docId, subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload)
        console.log(`[jsave-reminders] sent uid=${uid} doc=${docId}`)
      } catch (err) {
        console.error(`[jsave-reminders] push failed uid=${uid} doc=${docId} status=${err.statusCode}`)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection('jsavePushSubs').doc(docId).delete()
          console.log(`[jsave-reminders] cleaned expired sub doc=${docId}`)
        }
      }
    }))
  })

  await Promise.allSettled(sends)
  console.log(`[jsave-reminders] hour=${hour} done`)
}

// ── ToyyibPay bill proxy (sandbox) ────────────────────────────────────────────

const TOYYIBPAY_BASE = 'https://toyyibpay.com'
const TOYYIBPAY_KEY  = '3ogbb8p6-7ehp-xo5j-ie0b-djarxe1qhvio'

exports.createToyyibPayBill = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.')

  const { amountRM, returnUrl } = req.data
  const amount = Number(amountRM)
  if (!amount || amount <= 0 || amount > 10000) {
    throw new HttpsError('invalid-argument', 'Invalid amount.')
  }

  const db = getFirestore()
  const cfgRef = db.collection('jsave_config').doc('toyyibpay_live')
  const cfgSnap = await cfgRef.get()

  let categoryCode = cfgSnap.exists ? cfgSnap.data().categoryCode : null
  if (!categoryCode) {
    const catRes = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createCategory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        userSecretKey: TOYYIBPAY_KEY,
        catname: 'JSave Coffee',
        catdescription: 'Support JSave development',
      }).toString(),
    })
    const catData = await catRes.json()
    categoryCode = catData[0]?.CategoryCode
    if (!categoryCode) throw new HttpsError('internal', 'Failed to create ToyyibPay category')
    await cfgRef.set({ categoryCode }, { merge: true })
  }

  const billRes = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createBill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      userSecretKey: TOYYIBPAY_KEY,
      categoryCode,
      billName: 'Treat Me a Coffee',
      billDescription: 'Support JSave development',
      billPriceSetting: '1',
      billPayorInfo: '0',
      billAmount: String(Math.round(amount * 100)),
      billReturnUrl: returnUrl || 'https://www.jeeprod.com/jsave',
      billCallbackUrl: returnUrl || 'https://www.jeeprod.com/jsave',
      billExpiryDays: '1',
    }).toString(),
  })
  const billData = await billRes.json()
  const billCode = billData[0]?.BillCode
  if (!billCode) throw new HttpsError('internal', 'Failed to create ToyyibPay bill')

  return { url: `${TOYYIBPAY_BASE}/${billCode}`, billCode }
})

// ── JSave admin broadcast ─────────────────────────────────────────────────────

exports.jsaveAdminBroadcast = onCall(
  { secrets: [VAPID_PRIVATE] },
  async (req) => {
    if (!req.auth || !ADMIN_UIDS.includes(req.auth.uid)) {
      throw new HttpsError('permission-denied', 'Admin only.')
    }
    const { title, body, uids } = req.data
    if (!title || !body) throw new HttpsError('invalid-argument', 'title and body required.')

    webpush.setVapidDetails(
      'mailto:jeejunhong@gmail.com',
      VAPID_PUBLIC,
      VAPID_PRIVATE.value().trim()
    )

    const db = getFirestore()
    const subsSnap = await db.collection('jsavePushSubs').get()

    // filter to specific uids if provided, otherwise send to all
    const targetUids = Array.isArray(uids) && uids.length > 0 ? new Set(uids) : null
    const targetDocs = targetUids
      ? subsSnap.docs.filter(d => targetUids.has(d.data().uid))
      : subsSnap.docs

    const results = { sent: 0, failed: 0, cleaned: 0 }

    await Promise.allSettled(targetDocs.map(async subDoc => {
      const { subscription } = subDoc.data()
      const payload = JSON.stringify({ title, body, tag: 'jsave-admin-broadcast' })
      try {
        await webpush.sendNotification(subscription, payload)
        results.sent++
      } catch (err) {
        results.failed++
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection('jsavePushSubs').doc(subDoc.id).delete()
          results.cleaned++
        }
      }
    }))

    return results
  }
)

// ── JSave reminders ───────────────────────────────────────────────────────────

// 1PM MYT = 05:00 UTC
exports.jsaveReminder1PM = onSchedule(
  { schedule: '0 5 * * *', timeZone: 'UTC', secrets: [VAPID_PRIVATE] },
  async () => sendJSaveReminders(13)
)

// 8PM MYT = 12:00 UTC
exports.jsaveReminder8PM = onSchedule(
  { schedule: '0 12 * * *', timeZone: 'UTC', secrets: [VAPID_PRIVATE] },
  async () => sendJSaveReminders(20)
)
