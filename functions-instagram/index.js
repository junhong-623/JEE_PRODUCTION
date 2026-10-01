const { onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { createHash, randomUUID } = require('node:crypto')
const { USER_ID, normalizePosts, publicFeed, cacheState, renewalDue } = require('./feed.cjs')
const bootstrap = require('./bootstrap.json')

initializeApp()
const db = getFirestore()
const initialToken = defineSecret('JSAVE_INSTAGRAM_ACCESS_TOKEN')
// These two documents are inaccessible to web/mobile clients under the project's rules.
const connectionRef = db.collection('jsave_integrations').doc('instagram_connection')
const cacheRef = db.collection('jsave_integrations').doc('instagram_feed')
const options = { region: 'asia-southeast1', secrets: [initialToken], memory: '256MiB', maxInstances: 2, timeoutSeconds: 60 }

async function connection() {
  const token = initialToken.value()
  const sourceHash = createHash('sha256').update(token).digest('hex')
  return db.runTransaction(async transaction => {
    const current = (await transaction.get(connectionRef)).data()
    if (current?.sourceHash === sourceHash && current.accessToken) return current
    const fresh = { sourceHash, accessToken: token, refreshedAt: bootstrap.issuedAt, expiresAt: bootstrap.expiresAt, userId: USER_ID }
    transaction.set(connectionRef, fresh)
    return fresh
  })
}

async function metaGet(path, token, parameters = {}) {
  const url = new URL(`https://graph.instagram.com/${path}`)
  url.search = new URLSearchParams(parameters).toString()
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) })
  const body = await response.json()
  if (!response.ok || body.error) throw new Error(`meta_${body.error?.code || response.status}`)
  return body
}

async function readFeed() {
  const now = Date.now()
  const lease = randomUUID()
  const claim = await db.runTransaction(async transaction => {
    const cache = (await transaction.get(cacheRef)).data()
    const state = cacheState(cache, now)
    if (state.fresh || state.locked) return { cache, refresh: false }
    transaction.set(cacheRef, { lease, leaseUntil: now + 45000 }, { merge: true })
    return { cache, refresh: true }
  })
  if (!claim.refresh) {
    if (cacheState(claim.cache, now).usable) return { cache: claim.cache, stale: !cacheState(claim.cache, now).fresh }
    throw new Error('feed_pending')
  }
  try {
    const auth = await connection()
    const media = await metaGet(`v26.0/${USER_ID}/media`, auth.accessToken, {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}', limit: '6',
    })
    const cache = { posts: normalizePosts(media.data), updatedAt: Date.now() }
    await db.runTransaction(async transaction => {
      if ((await transaction.get(cacheRef)).data()?.lease === lease) transaction.set(cacheRef, cache)
    })
    return { cache, stale: false }
  } catch (error) {
    await db.runTransaction(async transaction => {
      if ((await transaction.get(cacheRef)).data()?.lease === lease) transaction.set(cacheRef, { leaseUntil: 0, retryAfter: Date.now() + 60000 }, { merge: true })
    })
    // Do not log fetch URLs, credentials, Graph responses, or user media.
    console.warn('Instagram feed refresh unavailable')
    if (cacheState(claim.cache, Date.now()).usable) return { cache: claim.cache, stale: true }
    throw new Error('feed_unavailable')
  }
}

exports.jsaveInstagramFeed = onRequest({ ...options, invoker: 'public', cors: [
  'https://jsave.jeeprod.com', 'https://jeeprod.com', 'https://www.jeeprod.com',
  'https://jeeprod-jsave.web.app', 'https://jeeprod-jsave.firebaseapp.com',
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
] }, async (request, response) => {
  response.set('X-Content-Type-Options', 'nosniff')
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.set('Allow', 'GET, HEAD').status(405).json({ error: 'method_not_allowed' })
    return
  }
  try {
    const result = await readFeed()
    response.set('Cache-Control', result.stale ? 'public, max-age=60, s-maxage=60' : 'public, max-age=300, s-maxage=3600')
    response.status(200).json(publicFeed(result.cache))
  } catch {
    response.set('Cache-Control', 'no-store').set('Retry-After', '60').status(503).json({ error: 'feed_unavailable' })
  }
})

exports.jsaveInstagramRenew = onSchedule({ ...options, maxInstances: 1, schedule: 'every day 04:00', timeZone: 'Asia/Kuala_Lumpur', retryCount: 2 }, async () => {
  const auth = await connection()
  if (!renewalDue(auth, Date.now())) return
  if (auth.expiresAt <= Date.now()) throw new Error('Instagram authorization needs reconnecting')
  // Instagram refresh does not need the app secret. This runs after the first 24 hours.
  const url = new URL('https://graph.instagram.com/refresh_access_token')
  url.search = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: auth.accessToken }).toString()
  let refreshed
  try {
    const result = await fetch(url, { signal: AbortSignal.timeout(12000) })
    refreshed = await result.json()
    if (!result.ok || !refreshed.access_token || !Number.isFinite(refreshed.expires_in)) throw new Error('refresh_failed')
  } catch { throw new Error('Instagram authorization refresh failed') }
  const now = Date.now()
  await db.runTransaction(async transaction => {
    const current = (await transaction.get(connectionRef)).data()
    if (current?.sourceHash === auth.sourceHash && current.refreshedAt === auth.refreshedAt) {
      transaction.update(connectionRef, { accessToken: refreshed.access_token, refreshedAt: now, expiresAt: now + refreshed.expires_in * 1000 })
    }
  })
  console.info('Instagram authorization refreshed')
})
