const PROFILE = { username: 'j._save', url: 'https://www.instagram.com/j._save/' }
const USER_ID = '17841429280714420'
const HOUR = 60 * 60 * 1000
const MAX_POSTS = 6

function safeImage(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.searchParams.has('access_token')) return null
    return ['cdninstagram.com', 'fbcdn.net'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url.href : null
  } catch { return null }
}

function safePermalink(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname) || !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null
    return `https://www.instagram.com${url.pathname}`
  } catch { return null }
}

function normalizePosts(raw) {
  if (!Array.isArray(raw)) throw new Error('invalid_media')
  return raw.slice(0, MAX_POSTS).flatMap(post => {
    const permalink = safePermalink(post.permalink)
    if (!permalink || !/^\d+$/.test(String(post.id))) return []
    const mediaType = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(post.media_type) ? post.media_type : 'IMAGE'
    const image = safeImage(mediaType === 'VIDEO' ? post.thumbnail_url : post.media_url)
    const slides = mediaType === 'CAROUSEL_ALBUM' ? (post.children?.data || []).slice(0, 10).map(child => safeImage(child.media_type === 'VIDEO' ? child.thumbnail_url : child.media_url)).filter(Boolean) : []
    if (!slides.length && image) slides.push(image)
    return [{
      id: String(post.id), permalink, mediaType, images: slides,
      caption: typeof post.caption === 'string' ? post.caption.slice(0, 2200) : '',
      timestamp: Number.isFinite(Date.parse(post.timestamp)) ? new Date(post.timestamp).toISOString() : null,
    }]
  })
}

function publicFeed(cache) {
  // Explicitly select public fields; never spread Firestore documents into a response.
  return { profile: PROFILE, posts: normalizePublicPosts(cache.posts), updatedAt: new Date(cache.updatedAt).toISOString() }
}

function normalizePublicPosts(posts) {
  return posts.slice(0, MAX_POSTS).map(post => ({
    id: post.id, caption: post.caption, mediaType: post.mediaType,
    images: post.images, permalink: post.permalink, timestamp: post.timestamp,
  }))
}

function cacheState(cache, now) {
  const age = now - (cache?.updatedAt || 0)
  return {
    fresh: Array.isArray(cache?.posts) && age >= 0 && age < HOUR,
    usable: Array.isArray(cache?.posts) && age >= 0 && age < 6 * HOUR,
    locked: (cache?.leaseUntil || 0) > now || (cache?.retryAfter || 0) > now,
  }
}

function renewalDue(connection, now) {
  const age = now - connection.refreshedAt
  return age >= 24 * HOUR && (age >= 7 * 24 * HOUR || connection.expiresAt - now < 14 * 24 * HOUR)
}

module.exports = { PROFILE, USER_ID, HOUR, MAX_POSTS, safeImage, safePermalink, normalizePosts, publicFeed, cacheState, renewalDue }
