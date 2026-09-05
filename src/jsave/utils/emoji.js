const EMOJI_GRAPHEME = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}|[#*0-9]\uFE0F?\u20E3/u

function graphemes(value) {
  const text = String(value ?? '').trim()
  if (!text) return []
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
  }
  return Array.from(text)
}

export function isSingleEmoji(value) {
  const parts = graphemes(value)
  return parts.length === 1 && EMOJI_GRAPHEME.test(parts[0])
}

export function singleEmoji(value) {
  const text = String(value ?? '').trim()
  return isSingleEmoji(text) ? text : null
}
