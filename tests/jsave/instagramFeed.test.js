import { describe, expect, it } from 'vitest'
import feed from '../../functions-instagram/feed.cjs'

const now = Date.parse('2026-10-01T04:00:00Z')
const sample = {
  id: '123', caption: 'A useful money habit', media_type: 'IMAGE',
  media_url: 'https://scontent.cdninstagram.com/photo.jpg?signature=public-image',
  permalink: 'https://www.instagram.com/p/example123/?tracking=removed', timestamp: '2026-09-30T06:00:00Z',
  access_token: 'must-never-escape', private_field: 'must-never-escape',
}

describe('JSave Instagram public feed boundary', () => {
  it('returns only six recent posts and excludes private Graph fields and tracking', () => {
    const posts = feed.normalizePosts(Array.from({ length: 10 }, (_, index) => ({ ...sample, id: String(index) })))
    const result = feed.publicFeed({ posts, updatedAt: now, accessToken: 'must-never-escape', sourceHash: 'private' })
    expect(result.posts).toHaveLength(6)
    expect(JSON.stringify(result)).not.toContain('must-never-escape')
    expect(JSON.stringify(result)).not.toContain('sourceHash')
    expect(result.posts[0].permalink).toBe('https://www.instagram.com/p/example123/')
  })
  it('uses video thumbnails and never exposes a video download URL', () => {
    const [post] = feed.normalizePosts([{ ...sample, media_type: 'VIDEO', thumbnail_url: 'https://scontent.fbcdn.net/reel.jpg', media_url: 'https://scontent.fbcdn.net/video.mp4' }])
    expect(post.images).toEqual(['https://scontent.fbcdn.net/reel.jpg'])
    expect(JSON.stringify(post)).not.toContain('.mp4')
  })
  it('handles missing licensed video media without breaking the post link', () => {
    const [post] = feed.normalizePosts([{ ...sample, media_type: 'VIDEO', media_url: undefined }])
    expect(post.images).toEqual([])
    expect(post.permalink).toContain('/p/')
  })
  it('keeps carousel image order, bounds slide count, and removes unsafe images', () => {
    const children = [{ media_url: 'javascript:alert(1)' }, ...Array.from({ length: 20 }, (_, index) => ({ media_url: `https://scontent.cdninstagram.com/${index}.jpg` }))]
    const [post] = feed.normalizePosts([{ ...sample, media_type: 'CAROUSEL_ALBUM', children: { data: children } }])
    expect(post.images).toHaveLength(9)
    expect(post.images[0]).toBe('https://scontent.cdninstagram.com/0.jpg')
  })
  it.each(['http://scontent.fbcdn.net/image.jpg', 'https://fbcdn.net.evil.example/image.jpg', 'https://user:password@scontent.fbcdn.net/a', 'https://scontent.fbcdn.net/a?access_token=secret', 'data:image/png;base64,AA'])('rejects untrusted image URL %s', url => {
    expect(feed.safeImage(url)).toBeNull()
  })
  it('rejects untrusted destinations and invalid timestamps', () => {
    expect(feed.normalizePosts([{ ...sample, permalink: 'https://evil.example/p/example123/' }])).toEqual([])
    expect(feed.normalizePosts([{ ...sample, timestamp: 'invalid' }])[0].timestamp).toBeNull()
  })
})

describe('Small Instagram cache and authorization lifetime', () => {
  it('refreshes after an hour, serves limited stale data, and respects refresh leases/backoff', () => {
    expect(feed.cacheState({ posts: [], updatedAt: now - 30 * 60000 }, now).fresh).toBe(true)
    expect(feed.cacheState({ posts: [], updatedAt: now - 2 * feed.HOUR }, now)).toMatchObject({ fresh: false, usable: true })
    expect(feed.cacheState({ posts: [], updatedAt: now - 7 * feed.HOUR }, now).usable).toBe(false)
    expect(feed.cacheState({ leaseUntil: now + 45000 }, now).locked).toBe(true)
    expect(feed.cacheState({ retryAfter: now + 60000 }, now).locked).toBe(true)
  })
  it('does not refresh a token before Instagram permits it and renews weekly', () => {
    const day = 24 * feed.HOUR
    expect(feed.renewalDue({ refreshedAt: now - 12 * feed.HOUR, expiresAt: now + day }, now)).toBe(false)
    expect(feed.renewalDue({ refreshedAt: now - 6 * day, expiresAt: now + 54 * day }, now)).toBe(false)
    expect(feed.renewalDue({ refreshedAt: now - 7 * day, expiresAt: now + 53 * day }, now)).toBe(true)
    expect(feed.renewalDue({ refreshedAt: now - 2 * day, expiresAt: now + 10 * day }, now)).toBe(true)
  })
})
