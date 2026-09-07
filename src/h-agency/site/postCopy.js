export function resolvePostCopy(post, lang = 'zh') {
  const rawContent = lang === 'zh'
    ? (post.captionZh || post.captionEn || '')
    : (post.captionEn || post.captionZh || '')
  const storedTitle = lang === 'zh'
    ? (post.titleZh || post.titleEn || '')
    : (post.titleEn || post.titleZh || '')
  const body = String(rawContent).trim()
  const heading = String(storedTitle).trim()
  const lines = body.split('\n')
  const firstLineIndex = lines.findIndex(line => line.trim())
  const firstLine = firstLineIndex >= 0 ? lines[firstLineIndex].trim() : ''
  const remaining = firstLineIndex >= 0 ? lines.slice(firstLineIndex + 1).join('\n').trim() : ''

  // Older manual posts stored the entire caption in both title and content.
  // Derive a concise heading without requiring a database migration.
  if (!heading || heading === body) {
    return {
      title: firstLine || (lang === 'zh' ? 'ℋ Agency 动态' : 'ℋ Agency update'),
      content: remaining,
    }
  }

  return {
    title: heading,
    content: firstLine === heading ? remaining : body,
  }
}
