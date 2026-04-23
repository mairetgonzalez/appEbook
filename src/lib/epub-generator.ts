import JSZip from "jszip";
import { TEMPLATE_PALETTES } from "@/lib/ebook-defaults";
import { markdownToHtml } from "@/lib/rich-text-parser";
import { downloadBlob } from "@/lib/utils";
import type { EditableProject } from "@/types/ebook";

function safeFilename(title: string, extension: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "ebook"}.${extension}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function base64ToBytes(base64: string) {
  const [, data] = base64.split(",");
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function detectImageExtension(base64: string) {
  if (base64.startsWith("data:image/png")) {
    return "png";
  }

  if (base64.startsWith("data:image/webp")) {
    return "webp";
  }

  return "jpg";
}

function chapterDocument(title: string, body: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
  <head>
    <title>${escapeXml(title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles.css" />
  </head>
  <body>
    <section class="chapter">
      <h1>${escapeXml(title)}</h1>
      ${body}
    </section>
  </body>
</html>`;
}

export async function generateEpub(project: EditableProject) {
  const zip = new JSZip();
  const palette = TEMPLATE_PALETTES[project.template];
  const textAlign = project.ebookData.textAlign;
  const lineHeight = { compact: "1.45", normal: "1.62", relaxed: "1.82" }[
    project.ebookData.lineSpacing
  ];
  const fontFamily =
    project.ebookData.bodyFont === "serif"
      ? `"Times New Roman", Georgia, serif`
      : `Helvetica, Arial, sans-serif`;

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.folder("META-INF")?.file(
    "container.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  const oebps = zip.folder("OEBPS");
  const textFolder = oebps?.folder("text");
  const imagesFolder = oebps?.folder("images");

  const manifestItems: string[] = [
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="styles.css" media-type="text/css"/>`,
  ];
  const spineItems: string[] = [];
  const navPoints: string[] = [];

  oebps?.file(
    "styles.css",
    `body {
  margin: 0;
  font-family: ${fontFamily};
  background: ${palette.background};
  color: ${palette.text};
  line-height: ${lineHeight};
  text-align: ${textAlign};
}

.chapter {
  max-width: 42rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

h1 {
  color: ${palette.primary};
  font-size: 2rem;
  margin: 0 0 1.5rem;
}

h3 {
  color: ${palette.primary};
  margin-top: 2rem;
  font-size: 1.25rem;
}

p {
  margin: 0.9rem 0;
  text-indent: ${project.ebookData.paragraphIndent ? "1.25cm" : "0"};
}

blockquote {
  border-left: 4px solid ${palette.accent};
  padding-left: 1rem;
  margin-left: 0;
  color: ${palette.primary};
}

mark {
  background: ${palette.secondary};
}

ul, ol {
  padding-left: 1.25rem;
}`,
  );

  let coverImageHref = "";
  let coverMeta = "";
  if (project.ebookData.coverImage && imagesFolder) {
    const extension = detectImageExtension(project.ebookData.coverImage);
    const coverPath = `images/cover.${extension}`;
    coverImageHref = coverPath;
    imagesFolder.file(`cover.${extension}`, base64ToBytes(project.ebookData.coverImage));
    manifestItems.push(
      `<item id="cover-image" href="${coverPath}" media-type="image/${extension === "jpg" ? "jpeg" : extension}"/>`,
    );
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  const pages = [
    {
      id: "cover",
      href: "text/cover.xhtml",
      title: project.ebookData.title || project.title,
      body: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
  <head>
    <title>${escapeXml(project.ebookData.title || project.title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles.css" />
  </head>
  <body>
    <section class="chapter">
      ${
        coverImageHref
          ? `<img src="../${coverImageHref}" alt="Capa do ebook" style="max-width:100%;border-radius:16px;margin-bottom:2rem;" />`
          : ""
      }
      <h1>${escapeXml(project.ebookData.title || project.title)}</h1>
      <p>${escapeXml(project.ebookData.subtitle)}</p>
      <p>${escapeXml(project.ebookData.authorName)}</p>
    </section>
  </body>
</html>`,
    },
    {
      id: "author",
      href: "text/author.xhtml",
      title: "Sobre o Autor",
      body: chapterDocument(
        "Sobre o Autor",
        `<p><strong>${escapeXml(project.ebookData.authorName || "Autor não informado")}</strong></p><p>${escapeXml(project.ebookData.authorBio)}</p>`,
      ),
    },
    {
      id: "legal",
      href: "text/legal.xhtml",
      title: "Aviso Legal",
      body: chapterDocument(
        "Aviso Legal",
        `<p>${escapeXml(project.ebookData.copyright)}</p><p>${escapeXml(project.ebookData.disclaimer)}</p>`,
      ),
    },
    {
      id: "introduction",
      href: "text/introduction.xhtml",
      title: "Introdução",
      body: chapterDocument("Introdução", markdownToHtml(project.ebookData.introduction)),
    },
    ...project.ebookData.chapters.map((chapter, index) => ({
      id: `chapter-${index + 1}`,
      href: `text/chapter-${index + 1}.xhtml`,
      title: chapter.title || `Capítulo ${index + 1}`,
      body: chapterDocument(chapter.title || `Capítulo ${index + 1}`, markdownToHtml(chapter.content)),
    })),
    {
      id: "conclusion",
      href: "text/conclusion.xhtml",
      title: "Conclusão",
      body: chapterDocument("Conclusão", markdownToHtml(project.ebookData.conclusion)),
    },
  ];

  pages.forEach((page, index) => {
    textFolder?.file(page.href.replace("text/", ""), page.body);
    manifestItems.push(
      `<item id="${page.id}" href="${page.href}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${page.id}"/>`);
    navPoints.push(
      `<navPoint id="nav-${page.id}" playOrder="${index + 1}">
  <navLabel><text>${escapeXml(page.title)}</text></navLabel>
  <content src="${page.href}"/>
</navPoint>`,
    );
  });

  oebps?.file(
    "content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(project.ebookData.title || project.title)}</dc:title>
    <dc:creator>${escapeXml(project.ebookData.authorName || "Autor não informado")}</dc:creator>
    <dc:language>pt-BR</dc:language>
    <dc:identifier id="bookid">urn:uuid:${project.id}</dc:identifier>
    ${coverMeta}
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );

  oebps?.file(
    "toc.ncx",
    `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${project.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(project.ebookData.title || project.title)}</text>
  </docTitle>
  <navMap>
    ${navPoints.join("\n    ")}
  </navMap>
</ncx>`,
  );

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, safeFilename(project.title || project.ebookData.title, "epub"));
}
