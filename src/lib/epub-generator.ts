import JSZip from 'jszip'
import type { EbookData, EbookTemplate } from '@/types/ebook'
import { markdownToHtml } from '@/lib/rich-text-parser'

const templateCss: Record<EbookTemplate, string> = {
  minimalist: ':root{--fg:#111;--bg:#fff;}',
  professional: ':root{--fg:#0f172a;--bg:#f8fafc;}',
  modern: ':root{--fg:#134e4a;--bg:#f0fdfa;}',
  elegant: ':root{--fg:#3b0764;--bg:#faf5ff;}',
  colorful: ':root{--fg:#4a044e;--bg:#fff7ed;}',
}

export async function exportEpub(data: EbookData, template: EbookTemplate) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  const metaInf = zip.folder('META-INF')
  metaInf?.file('container.xml', `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`)

  const oebps = zip.folder('OEBPS')
  oebps?.file('styles.css', `${templateCss[template]} body{color:var(--fg);background:var(--bg);font-family:serif;} h1,h2,h3{page-break-after:avoid;}`)

  const chapters = data.chapters
    .map((chapter, idx) => `chapter-${idx + 1}.xhtml`)
    .map((file, idx) => ({
      file,
      title: data.chapters[idx].title,
      content: `<h2>${data.chapters[idx].title}</h2><p>${markdownToHtml(data.chapters[idx].content)}</p>`,
    }))

  oebps?.file('cover.xhtml', `<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>${data.title}</h1><h2>${data.subtitle}</h2><p>${data.authorName}</p></body></html>`)
  oebps?.file('intro.xhtml', `<html xmlns="http://www.w3.org/1999/xhtml"><body><h2>Introdução</h2><p>${markdownToHtml(data.introduction)}</p></body></html>`)
  oebps?.file('conclusion.xhtml', `<html xmlns="http://www.w3.org/1999/xhtml"><body><h2>Conclusão</h2><p>${markdownToHtml(data.conclusion)}</p></body></html>`)

  chapters.forEach((ch) => oebps?.file(ch.file, `<html xmlns="http://www.w3.org/1999/xhtml"><body>${ch.content}</body></html>`))

  oebps?.file('toc.ncx', `<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><navMap>${chapters
    .map((ch, idx) => `<navPoint id="nav${idx + 1}" playOrder="${idx + 1}"><navLabel><text>${ch.title}</text></navLabel><content src="${ch.file}"/></navPoint>`)
    .join('')}</navMap></ncx>`)

  oebps?.file('content.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${data.title}</dc:title><dc:creator>${data.authorName}</dc:creator><dc:language>pt-BR</dc:language></metadata><manifest><item id="css" href="styles.css" media-type="text/css"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/><item id="intro" href="intro.xhtml" media-type="application/xhtml+xml"/><item id="conclusion" href="conclusion.xhtml" media-type="application/xhtml+xml"/>${chapters.map((ch, idx) => `<item id="c${idx + 1}" href="${ch.file}" media-type="application/xhtml+xml"/>`).join('')}<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx"><itemref idref="cover"/><itemref idref="intro"/>${chapters.map((_, idx) => `<itemref idref="c${idx + 1}"/>`).join('')}<itemref idref="conclusion"/></spine></package>`)

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.title || 'ebook'}.epub`
  a.click()
  URL.revokeObjectURL(url)
}
