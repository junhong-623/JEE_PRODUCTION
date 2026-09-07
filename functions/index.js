const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { v2: cloudinary } = require('cloudinary')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore')
const webpush = require('web-push')
const crypto = require('crypto')

initializeApp()

const VAPID_PRIVATE = defineSecret('VAPID_PRIVATE_KEY')
const VAPID_PUBLIC = 'BMGKdp8QNMH0CXUHEcJc3PVSw6MXe45_ZafygoAZZF_fiFsG5Ufq3oCQrzVknLw7oG_VtQJYPxj8f9lddT_ce0A'

const CLOUDINARY_KEY    = defineSecret('CLOUDINARY_API_KEY')
const CLOUDINARY_SECRET = defineSecret('CLOUDINARY_API_SECRET')
const INSTAGRAM_ACCESS_TOKEN = defineSecret('INSTAGRAM_ACCESS_TOKEN')

const ADMIN_UIDS = [
  'QVLyCaNT5FgDDxXA95ZpHAiSCvy2',
  'IhcEvknXK1OQ24PdA3UmwnyxzSq1',
]

const HAGENCY_EXPERIENCE = new Set(['无经验', '1-3个月', '3-12个月', '1年以上'])
const HAGENCY_SPECIALIZATION = new Set(['唱歌', '跳舞', '聊天互动', '才艺表演', '其他'])

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

function instagramPostTitle(caption = '') {
  const firstLine = String(caption).split('\n').map(line => line.trim()).find(Boolean) || 'Instagram 动态'
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine
}

function instagramPostContent(caption = '') {
  const lines = String(caption).split('\n')
  const firstContentLine = lines.findIndex(line => line.trim())
  if (firstContentLine < 0) return ''
  return lines.slice(firstContentLine + 1).join('\n').trim()
}

/**
 * Callable: syncHAgencyInstagram
 * Imports the latest media owned by @h_agency21 through Meta's official API.
 * The website displays a stable Cloudinary copy of the cover and links back to
 * Instagram for the original post/Reel. Admin-only and safe to call repeatedly.
 */
exports.syncHAgencyInstagram = onCall(
  {
    secrets: [INSTAGRAM_ACCESS_TOKEN, CLOUDINARY_KEY, CLOUDINARY_SECRET],
    invoker: 'public',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
    if (!ADMIN_UIDS.includes(req.auth.uid)) throw new HttpsError('permission-denied', 'Admin only.')

    const token = INSTAGRAM_ACCESS_TOKEN.value().trim()
    if (!token || token === 'not-configured') {
      throw new HttpsError('failed-precondition', 'Instagram 尚未连接，请先配置官方 Access Token。')
    }

    const fields = [
      'id', 'caption', 'media_type', 'media_url', 'thumbnail_url', 'permalink',
      'timestamp', 'username', 'children{id,media_type,media_url,thumbnail_url}',
    ].join(',')
    const endpoint = new URL('https://graph.instagram.com/v23.0/me/media')
    endpoint.searchParams.set('fields', fields)
    endpoint.searchParams.set('limit', '24')
    endpoint.searchParams.set('access_token', token)

    const response = await fetch(endpoint)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('[hagency-instagram] Meta API failed', response.status, body?.error?.type, body?.error?.code)
      const expired = body?.error?.code === 190
      throw new HttpsError(
        expired ? 'failed-precondition' : 'unavailable',
        expired ? 'Instagram 授权已失效，请重新连接。' : 'Instagram 暂时无法同步，请稍后再试。',
      )
    }

    cloudinary.config({
      cloud_name: 'db2ixn8zh',
      api_key: CLOUDINARY_KEY.value(),
      api_secret: CLOUDINARY_SECRET.value(),
    })

    const db = getFirestore()
    let added = 0
    let updated = 0
    const failures = []

    for (const item of Array.isArray(body.data) ? body.data : []) {
      try {
        if (!item?.id || !item?.permalink) continue
        const permalink = String(item.permalink)
        const shortcode = new URL(permalink).pathname.split('/').filter(Boolean).at(-1) || String(item.id)
        const documentId = `ig_${shortcode}`
        const ref = db.collection('hagency_posts').doc(documentId)
        const existing = await ref.get()
        const existingData = existing.data() || {}
        const coverUrl = item.thumbnail_url || item.media_url || item.children?.data?.[0]?.thumbnail_url || item.children?.data?.[0]?.media_url || ''
        let mediaUrl = existingData.mediaUrl || ''
        let mediaPublicId = existingData.mediaPublicId || ''

        // An Instagram CDN URL can rotate even when the post cover has not
        // changed. Keep the stable Cloudinary copy once it exists so each
        // manual refresh does not create unnecessary transformations/storage.
        if (coverUrl && (!existing.exists || !mediaUrl)) {
          const uploaded = await cloudinary.uploader.upload(coverUrl, {
            folder: 'hagency/instagram',
            public_id: shortcode,
            overwrite: true,
            resource_type: 'image',
          })
          mediaUrl = uploaded.secure_url
          mediaPublicId = uploaded.public_id
        }

        const publishedAt = item.timestamp ? new Date(item.timestamp) : new Date()
        const caption = String(item.caption || '').trim()
        const data = {
          source: 'instagram',
          instagramMediaId: String(item.id),
          instagramMediaType: String(item.media_type || 'IMAGE'),
          instagramUsername: String(item.username || 'h_agency21'),
          instagramSourceUrl: coverUrl,
          instagramCaption: caption,
          mediaUrl,
          mediaPublicId,
          // Reels use their stable cover on the site and open Instagram to play.
          mediaType: 'image',
          permalink,
          createdAt: Number.isNaN(publishedAt.getTime()) ? FieldValue.serverTimestamp() : Timestamp.fromDate(publishedAt),
          instagramPublishedAt: Number.isNaN(publishedAt.getTime()) ? FieldValue.serverTimestamp() : Timestamp.fromDate(publishedAt),
          syncedAt: FieldValue.serverTimestamp(),
        }
        // Keep editorial copy written in Admin. Otherwise split the first
        // Instagram line into a short title and save the remaining copy as the
        // body so mobile cards and detail pages do not repeat themselves.
        if (!existing.exists || !existingData.copyEdited) {
          data.titleZh = instagramPostTitle(caption)
          data.captionZh = instagramPostContent(caption)
        }
        if (!existing.exists) {
          data.visible = true
          data.importedAt = FieldValue.serverTimestamp()
          added += 1
        } else {
          updated += 1
        }
        await ref.set(data, { merge: true })
      } catch (error) {
        console.error('[hagency-instagram] item failed', item?.id, error.message)
        failures.push(String(item?.id || 'unknown'))
      }
    }

    const syncRecord = {
      username: 'h_agency21',
      lastSyncAt: FieldValue.serverTimestamp(),
      lastSyncBy: req.auth.uid,
      lastResult: { added, updated, failed: failures.length },
      connected: true,
    }
    await db.collection('hagency_integrations').doc('instagram').set(syncRecord, { merge: true })
    return { added, updated, failed: failures.length, total: added + updated }
  },
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
