export interface InlineSegment {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  highlight?: boolean
}

const INLINE_REGEX = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|==[^=]+==)/g

export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(INLINE_REGEX)) {
    const token = match[0]
    const start = match.index ?? 0
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start) })
    }
    if (token.startsWith('**')) segments.push({ text: token.slice(2, -2), bold: true })
    else if (token.startsWith('__')) segments.push({ text: token.slice(2, -2), underline: true })
    else if (token.startsWith('==')) segments.push({ text: token.slice(2, -2), highlight: true })
    else segments.push({ text: token.slice(1, -1), italic: true })
    lastIndex = start + token.length
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) })
  return segments
}

export function cleanInlineMarkers(text: string) {
  return text.replace(/\*\*|__|==/g, '')
}

export function stripOnlyEmoji(text: string) {
  return text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
}

export function markdownToHtml(markdown: string) {
  return markdown
    .replace(/^##\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^-\s(.+)$/gm, '<li>$1</li>')
    .replace(/<li>(.*?)<\/li>(\n<li>.*<\/li>)*/gs, (m) => `<ul>${m}</ul>`)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/==(.*?)==/g, '<mark>$1</mark>')
    .replace(/\n\n/g, '</p><p>')
}
