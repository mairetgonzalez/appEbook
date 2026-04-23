import { jsPDF } from 'jspdf'
import type { EbookData, EbookTemplate, FontSize } from '@/types/ebook'
import { cleanInlineMarkers, parseInlineSegments, stripOnlyEmoji } from '@/lib/rich-text-parser'

const templates: Record<EbookTemplate, Record<string, string>> = {
  minimalist: { primary: '#111827', accent: '#374151', background: '#ffffff', cover: '#e5e7eb', text: '#111827' },
  professional: { primary: '#0f172a', accent: '#1d4ed8', background: '#f8fafc', cover: '#dbeafe', text: '#0f172a' },
  modern: { primary: '#0f766e', accent: '#06b6d4', background: '#f0fdfa', cover: '#ccfbf1', text: '#134e4a' },
  elegant: { primary: '#5b21b6', accent: '#a855f7', background: '#faf5ff', cover: '#ede9fe', text: '#3b0764' },
  colorful: { primary: '#be123c', accent: '#f97316', background: '#fff7ed', cover: '#ffe4e6', text: '#4a044e' },
}

const sizeMap: Record<FontSize, number> = { small: 10, medium: 12, large: 14 }

export function exportPdf(data: EbookData, template: EbookTemplate, fontSize: FontSize) {
  const palette = templates[template]
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const lineHeight = sizeMap[fontSize] * 0.48
  let y = 30
  let pageNumber = 1
  let currentChapterTitle = data.title

  const setBodyFont = (style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFont(data.bodyFont === 'serif' ? 'times' : 'helvetica', style)
    doc.setFontSize(sizeMap[fontSize])
  }

  const addHeader = () => {
    const odd = pageNumber % 2 !== 0
    doc.setFontSize(9)
    doc.setTextColor(palette.accent)
    if (odd) {
      doc.text(data.title, 185, 10, { align: 'right' })
      doc.text(String(pageNumber), 15, 10)
    } else {
      doc.text(currentChapterTitle, 15, 10)
      doc.text(String(pageNumber), 195, 10, { align: 'right' })
    }
    doc.setTextColor(palette.text)
  }

  const addPage = (blank = false) => {
    doc.addPage()
    pageNumber += 1
    y = 20
    if (!blank) addHeader()
  }

  const writeInline = (line: string, x: number, yy: number, justifyWidth?: number) => {
    const segments = parseInlineSegments(line)
    const words = segments.flatMap((segment) => {
      const split = segment.text.split(/(\s+)/).filter(Boolean)
      return split.map((text) => ({ ...segment, text }))
    })
    const plainWidth = doc.getTextWidth(words.map((w) => w.text).join(''))
    const spaces = words.filter((w) => /^\s+$/.test(w.text)).length
    const extra = justifyWidth && spaces > 0 ? (justifyWidth - plainWidth) / spaces : 0
    let cursor = x
    for (const w of words) {
      if (w.bold) setBodyFont('bold')
      else if (w.italic) setBodyFont('italic')
      else setBodyFont('normal')
      if (w.highlight) {
        doc.setFillColor(255, 244, 158)
        doc.rect(cursor - 0.5, yy - 4.5, doc.getTextWidth(w.text) + 1, 5.5, 'F')
      }
      doc.text(w.text, cursor, yy)
      cursor += doc.getTextWidth(w.text) + (/^\s+$/.test(w.text) ? extra : 0)
    }
  }

  const writeDropCapParagraph = (text: string) => {
    const firstChar = text.match(/[\p{L}\p{N}]/u)?.[0] ?? text[0]
    const rest = text.slice(text.indexOf(firstChar) + 1).trimStart()
    const dropFontPt = sizeMap[fontSize] * 3.5 * 0.7
    doc.setFontSize(dropFontPt)
    setBodyFont('bold')
    doc.text(firstChar, 20, y + lineHeight * 2)
    doc.setFontSize(sizeMap[fontSize])
    setBodyFont('normal')
    writeWrappedText(rest, 28, 172)
  }

  const writeWrappedText = (text: string, x = 20, width = 170) => {
    const paragraphs = stripOnlyEmoji(text).split(/\n\n+/)
    for (const paragraph of paragraphs) {
      const lines = doc.splitTextToSize(paragraph, width) as string[]
      if (y > 270 || (y > 260 && lines.length === 1)) addPage()
      if (y > 262 && lines.length === 2) addPage() // órfã
      lines.forEach((line, index) => {
        const isLast = index === lines.length - 1
        const wouldWidow = isLast && y > 280
        if (wouldWidow) addPage()
        writeInline(line, x + (data.paragraphIndent && index === 0 ? 12.5 : 0), y, data.textAlign === 'justify' && !isLast ? width : undefined)
        y += lineHeight
      })
      y += lineHeight * 0.6
    }
  }

  doc.setFillColor(palette.cover)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setTextColor(palette.primary)
  doc.setFont(data.bodyFont === 'serif' ? 'times' : 'helvetica', 'bold')
  doc.setFontSize(32)
  if (data.showTitleOnCover) doc.text(data.title, 105, 120, { align: 'center' })
  doc.setFontSize(16)
  doc.text(data.subtitle || ' ', 105, 135, { align: 'center' })
  doc.text(data.authorName || ' ', 105, 155, { align: 'center' })
  if (data.coverImage) doc.addImage(data.coverImage, 'JPEG', 45, 30, 120, 80)

  addPage()
  doc.setFontSize(20)
  doc.text('Sumário', 20, y)
  y += 12
  setBodyFont()
  data.chapters.forEach((chapter, i) => {
    doc.text(`${i + 1}. ${cleanInlineMarkers(chapter.title)}`, 20, y)
    y += lineHeight
  })

  addPage()
  doc.setFontSize(18)
  doc.text('Sobre o Autor', 20, y)
  y += 10
  writeWrappedText(data.authorBio)

  addPage()
  doc.setFontSize(18)
  doc.text('Aviso Legal', 20, y)
  y += 10
  writeWrappedText(`${data.copyright}\n\n${data.disclaimer}`)

  addPage()
  doc.setFontSize(18)
  doc.text('Introdução', 20, y)
  y += 10
  writeWrappedText(data.introduction)

  for (const chapter of data.chapters) {
    if (data.chapterBlankPage) addPage(true)
    addPage()
    currentChapterTitle = cleanInlineMarkers(chapter.title)
    y = data.chapterOpeningTopMargin
    doc.setFontSize(24)
    doc.text(currentChapterTitle, 20, y)
    y += 14
    if (data.dropCap) writeDropCapParagraph(chapter.content)
    else writeWrappedText(chapter.content)
  }

  addPage()
  doc.setFontSize(18)
  doc.text('Conclusão', 20, y)
  y += 10
  writeWrappedText(data.conclusion)
  doc.save(`${data.title || 'ebook'}.pdf`)
}
