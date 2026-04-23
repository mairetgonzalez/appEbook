import { jsPDF } from "jspdf";
import { TEMPLATE_PALETTES } from "@/lib/ebook-defaults";
import {
  cleanInlineMarkers,
  parseInlineSegments,
  parseMarkdownBlocks,
  stripUnsupportedCharacters,
} from "@/lib/rich-text-parser";
import { downloadBlob } from "@/lib/utils";
import type { EditableProject, InlineSegment } from "@/types/ebook";

const MM_TO_PT = 72 / 25.4;
const INDENT_PT = 12.5 * MM_TO_PT;

interface StyledToken extends InlineSegment {
  isSpace?: boolean;
}

interface LayoutContext {
  doc: jsPDF;
  project: EditableProject;
  pageWidth: number;
  pageHeight: number;
  bodyFontSize: number;
  lineHeight: number;
  fontFamily: "times" | "helvetica";
  margins: {
    top: number;
    bottom: number;
    inner: number;
    outer: number;
  };
  cursorY: number;
  currentChapterTitle: string;
  blankPages: Set<number>;
  headerlessPages: Set<number>;
  pageChapterTitles: Map<number, string>;
}

function safeFilename(title: string, extension: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "ebook"}.${extension}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function setFont(doc: jsPDF, family: "times" | "helvetica", segment?: StyledToken) {
  const bold = Boolean(segment?.bold);
  const italic = Boolean(segment?.italic);
  const style = bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
  doc.setFont(family, style);
}

function tokenizeSegments(segments: InlineSegment[]): StyledToken[] {
  return segments.flatMap((segment) => {
    const parts = segment.text.split(/(\s+)/);
    return parts
      .filter((part) => part.length > 0)
      .map(
        (part) =>
          ({
            ...segment,
            text: part,
            isSpace: /^\s+$/.test(part),
          }) satisfies StyledToken,
      );
  });
}

function measureToken(doc: jsPDF, token: StyledToken, family: "times" | "helvetica", fontSize: number) {
  if (!token.text) {
    return 0;
  }
  doc.setFontSize(fontSize);
  setFont(doc, family, token);
  return doc.getTextWidth(token.text);
}

function trimEdgeSpaces(tokens: StyledToken[]) {
  const next = [...tokens];
  while (next[0]?.isSpace) {
    next.shift();
  }
  while (next[next.length - 1]?.isSpace) {
    next.pop();
  }
  return next;
}

function wrapTokens(
  doc: jsPDF,
  tokens: StyledToken[],
  family: "times" | "helvetica",
  fontSize: number,
  firstLineWidth: number,
  otherLineWidth: number,
) {
  const lines: StyledToken[][] = [];
  let currentLine: StyledToken[] = [];
  let currentWidth = 0;
  let lineLimit = firstLineWidth;

  for (const token of tokens) {
    const tokenWidth = measureToken(doc, token, family, fontSize);

    if (
      currentLine.length > 0 &&
      !token.isSpace &&
      currentWidth + tokenWidth > lineLimit
    ) {
      lines.push(trimEdgeSpaces(currentLine));
      currentLine = [];
      currentWidth = 0;
      lineLimit = otherLineWidth;
    }

    if (currentLine.length === 0 && token.isSpace) {
      continue;
    }

    currentLine.push(token);
    currentWidth += tokenWidth;
  }

  if (currentLine.length > 0) {
    lines.push(trimEdgeSpaces(currentLine));
  }

  return lines.filter((line) => line.length > 0);
}

function lineWidth(doc: jsPDF, line: StyledToken[], family: "times" | "helvetica", fontSize: number) {
  return line.reduce((total, token) => total + measureToken(doc, token, family, fontSize), 0);
}

function renderStyledLine(
  doc: jsPDF,
  line: StyledToken[],
  x: number,
  y: number,
  width: number,
  family: "times" | "helvetica",
  fontSize: number,
  justify: boolean,
  isLastLine: boolean,
) {
  const gaps = line.filter((token) => token.isSpace).length;
  const actualWidth = lineWidth(doc, line, family, fontSize);
  const extraSpace = justify && !isLastLine && gaps > 0 ? (width - actualWidth) / gaps : 0;

  let cursorX = x;
  doc.setFontSize(fontSize);

  for (const token of line) {
    const tokenWidth = measureToken(doc, token, family, fontSize);

    if (token.isSpace) {
      cursorX += tokenWidth + extraSpace;
      continue;
    }

    if (token.highlight) {
      doc.setFillColor(255, 244, 163);
      doc.rect(cursorX - 0.8, y - fontSize + 3, tokenWidth + 1.6, fontSize + 4, "F");
    }

    setFont(doc, family, token);
    doc.text(token.text, cursorX, y);

    if (token.underline) {
      doc.setLineWidth(0.6);
      doc.line(cursorX, y + 2, cursorX + tokenWidth, y + 2);
    }

    cursorX += tokenWidth;
  }
}

function addPage(ctx: LayoutContext, blank = false) {
  ctx.doc.addPage();
  ctx.cursorY = ctx.margins.top;
  const pageNumber = ctx.doc.getNumberOfPages();

  if (blank) {
    ctx.blankPages.add(pageNumber);
    ctx.headerlessPages.add(pageNumber);
  } else {
    ctx.pageChapterTitles.set(pageNumber, ctx.currentChapterTitle);
  }
}

function setCurrentRunningTitle(ctx: LayoutContext, title: string) {
  ctx.currentChapterTitle = title;
  ctx.pageChapterTitles.set(ctx.doc.getNumberOfPages(), title);
}

function ensurePageSpace(ctx: LayoutContext, requiredHeight: number) {
  const remaining = ctx.pageHeight - ctx.margins.bottom - ctx.cursorY;
  if (requiredHeight > remaining) {
    addPage(ctx);
  }
}

function drawSectionTitle(ctx: LayoutContext, title: string, options?: { chapterOpening?: boolean }) {
  if (options?.chapterOpening) {
    addPage(ctx);
    ctx.cursorY = ctx.project.ebookData.chapterOpeningTopMargin * MM_TO_PT;
  } else {
    ensurePageSpace(ctx, 90);
  }

  ctx.doc.setTextColor(28, 35, 52);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(26);
  ctx.doc.text(stripUnsupportedCharacters(title), ctx.margins.inner, ctx.cursorY);
  ctx.cursorY += 18;
  ctx.doc.setDrawColor(210, 216, 228);
  ctx.doc.line(ctx.margins.inner, ctx.cursorY, ctx.pageWidth - ctx.margins.outer, ctx.cursorY);
  ctx.cursorY += 24;
}

function renderImage(
  ctx: LayoutContext,
  imageBase64: string,
  options: { maxWidth: number; maxHeight: number; centered?: boolean },
) {
  const properties = ctx.doc.getImageProperties(imageBase64);
  const ratio = Math.min(
    options.maxWidth / properties.width,
    options.maxHeight / properties.height,
  );
  const width = properties.width * ratio;
  const height = properties.height * ratio;
  const x = options.centered
    ? (ctx.pageWidth - width) / 2
    : ctx.margins.inner;
  ensurePageSpace(ctx, height + 12);
  ctx.doc.addImage(imageBase64, properties.fileType ?? "PNG", x, ctx.cursorY, width, height);
  ctx.cursorY += height + 16;
}

function renderParagraph(
  ctx: LayoutContext,
  text: string,
  options?: { firstParagraphOfChapter?: boolean; indentFirstLine?: boolean },
) {
  const sanitized = stripUnsupportedCharacters(text).trim();
  if (!sanitized) {
    ctx.cursorY += ctx.lineHeight * 0.25;
    return;
  }

  if (options?.firstParagraphOfChapter && ctx.project.ebookData.dropCap) {
    renderDropCapParagraph(ctx, sanitized);
    return;
  }

  const segments = parseInlineSegments(sanitized);
  const tokens = tokenizeSegments(segments);
  const firstLineWidth =
    ctx.pageWidth -
    ctx.margins.inner -
    ctx.margins.outer -
    (options?.indentFirstLine ? INDENT_PT : 0);
  const maxWidth = ctx.pageWidth - ctx.margins.inner - ctx.margins.outer;
  const lines = wrapTokens(ctx.doc, tokens, ctx.fontFamily, ctx.bodyFontSize, firstLineWidth, maxWidth);

  const remainingHeight = ctx.pageHeight - ctx.margins.bottom - ctx.cursorY;
  const linesFit = Math.floor(remainingHeight / ctx.lineHeight);
  if (lines.length > 1 && linesFit === 1) {
    addPage(ctx);
  } else if (lines.length > 2 && linesFit > 1 && lines.length - linesFit === 1) {
    addPage(ctx);
  }

  lines.forEach((line, index) => {
    if (ctx.pageHeight - ctx.margins.bottom - ctx.cursorY < ctx.lineHeight) {
      addPage(ctx);
    }

    const x = ctx.margins.inner + (index === 0 && options?.indentFirstLine ? INDENT_PT : 0);
    const width = maxWidth - (index === 0 && options?.indentFirstLine ? INDENT_PT : 0);
    renderStyledLine(
      ctx.doc,
      line,
      x,
      ctx.cursorY,
      width,
      ctx.fontFamily,
      ctx.bodyFontSize,
      ctx.project.ebookData.textAlign === "justify",
      index === lines.length - 1,
    );
    ctx.cursorY += ctx.lineHeight;
  });

  ctx.cursorY += ctx.lineHeight * 0.35;
}

function renderDropCapParagraph(ctx: LayoutContext, text: string) {
  const match = text.match(/^([("“‘'\[]*)(\S)([\s\S]*)$/);
  if (!match) {
    renderParagraph(ctx, text);
    return;
  }

  const [, leadingPunctuation, rawCap, remainder] = match;
  const dropCap = rawCap.toUpperCase();
  const flowingText = `${leadingPunctuation}${remainder}`.trim();
  const dropFontPt = (ctx.lineHeight * 3) / 0.7;
  const gap = 8;

  ctx.doc.setFont("times", "bold");
  ctx.doc.setFontSize(dropFontPt);
  const capWidth = ctx.doc.getTextWidth(dropCap);

  const tokens = tokenizeSegments(parseInlineSegments(stripUnsupportedCharacters(flowingText)));
  const reducedWidth = ctx.pageWidth - ctx.margins.inner - ctx.margins.outer - capWidth - gap;
  const fullWidth = ctx.pageWidth - ctx.margins.inner - ctx.margins.outer;
  const wrapped = wrapTokens(ctx.doc, tokens, ctx.fontFamily, ctx.bodyFontSize, reducedWidth, reducedWidth);
  const topLines = wrapped.slice(0, 3);
  const remainingTokens = wrapped.slice(3).flat();
  const remainingLines = remainingTokens.length
    ? wrapTokens(ctx.doc, remainingTokens, ctx.fontFamily, ctx.bodyFontSize, fullWidth, fullWidth)
    : [];

  ensurePageSpace(ctx, ctx.lineHeight * Math.max(4, topLines.length + remainingLines.length));

  ctx.doc.setFont("times", "bold");
  ctx.doc.setFontSize(dropFontPt);
  ctx.doc.text(dropCap, ctx.margins.inner, ctx.cursorY + dropFontPt * 0.78);

  topLines.forEach((line, index) => {
    renderStyledLine(
      ctx.doc,
      line,
      ctx.margins.inner + capWidth + gap,
      ctx.cursorY + index * ctx.lineHeight,
      reducedWidth,
      ctx.fontFamily,
      ctx.bodyFontSize,
      ctx.project.ebookData.textAlign === "justify",
      index === topLines.length - 1 && remainingLines.length === 0,
    );
  });

  ctx.cursorY += ctx.lineHeight * Math.max(3, topLines.length);

  remainingLines.forEach((line, index) => {
    if (ctx.pageHeight - ctx.margins.bottom - ctx.cursorY < ctx.lineHeight) {
      addPage(ctx);
    }
    renderStyledLine(
      ctx.doc,
      line,
      ctx.margins.inner,
      ctx.cursorY,
      fullWidth,
      ctx.fontFamily,
      ctx.bodyFontSize,
      ctx.project.ebookData.textAlign === "justify",
      index === remainingLines.length - 1,
    );
    ctx.cursorY += ctx.lineHeight;
  });

  ctx.cursorY += ctx.lineHeight * 0.35;
}

function renderList(ctx: LayoutContext, items: string[], ordered: boolean) {
  items.forEach((item, index) => {
    const bullet = ordered ? `${index + 1}.` : "•";
    const bulletWidth = 18;
    const tokens = tokenizeSegments(parseInlineSegments(stripUnsupportedCharacters(item)));
    const lineWidthLimit = ctx.pageWidth - ctx.margins.inner - ctx.margins.outer - bulletWidth;
    const lines = wrapTokens(ctx.doc, tokens, ctx.fontFamily, ctx.bodyFontSize, lineWidthLimit, lineWidthLimit);
    ensurePageSpace(ctx, ctx.lineHeight * (lines.length + 1));

    ctx.doc.setFont(ctx.fontFamily, "normal");
    ctx.doc.setFontSize(ctx.bodyFontSize);
    ctx.doc.text(bullet, ctx.margins.inner, ctx.cursorY);

    lines.forEach((line, lineIndex) => {
      renderStyledLine(
        ctx.doc,
        line,
        ctx.margins.inner + bulletWidth,
        ctx.cursorY,
        lineWidthLimit,
        ctx.fontFamily,
        ctx.bodyFontSize,
        ctx.project.ebookData.textAlign === "justify",
        lineIndex === lines.length - 1,
      );
      ctx.cursorY += ctx.lineHeight;
    });

    ctx.cursorY += ctx.lineHeight * 0.1;
  });

  ctx.cursorY += ctx.lineHeight * 0.2;
}

function renderBlocks(
  ctx: LayoutContext,
  markdown: string,
  options?: { chapterMode?: boolean },
) {
  const blocks = parseMarkdownBlocks(markdown);
  let firstParagraphRendered = false;

  for (const block of blocks) {
    if (block.type === "h3") {
      ensurePageSpace(ctx, 52);
      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setFontSize(17);
      ctx.doc.text(
        stripUnsupportedCharacters(cleanInlineMarkers(block.text)),
        ctx.margins.inner,
        ctx.cursorY,
      );
      ctx.cursorY += 24;
      continue;
    }

    if (block.type === "blockquote") {
      ensurePageSpace(ctx, ctx.lineHeight * 3);
      ctx.doc.setDrawColor(184, 196, 214);
      ctx.doc.setLineWidth(2);
      ctx.doc.line(ctx.margins.inner, ctx.cursorY - ctx.bodyFontSize, ctx.margins.inner, ctx.cursorY + ctx.lineHeight * 2);
      const previousLeft = ctx.margins.inner + 16;
      const quoteCtx = {
        ...ctx,
        margins: {
          ...ctx.margins,
          inner: previousLeft,
        },
      };
      renderParagraph(quoteCtx, block.text);
      ctx.cursorY = quoteCtx.cursorY;
      continue;
    }

    if (block.type === "ul") {
      renderList(ctx, block.items, false);
      continue;
    }

    if (block.type === "ol") {
      renderList(ctx, block.items, true);
      continue;
    }

    renderParagraph(ctx, block.text, {
      firstParagraphOfChapter: Boolean(options?.chapterMode && !firstParagraphRendered),
      indentFirstLine:
        ctx.project.ebookData.paragraphIndent &&
        !(options?.chapterMode && !firstParagraphRendered),
    });
    firstParagraphRendered = true;
  }
}

function applyHeaders(ctx: LayoutContext, bookTitle: string) {
  const doc = ctx.doc;
  let displayPageNumber = 0;

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    if (ctx.blankPages.has(page) || ctx.headerlessPages.has(page)) {
      continue;
    }

    displayPageNumber += 1;
    const chapterTitle = ctx.pageChapterTitles.get(page) ?? bookTitle;
    doc.setPage(page);
    doc.setTextColor(109, 122, 145);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const isOdd = displayPageNumber % 2 === 1;
    if (isOdd) {
      doc.text(String(displayPageNumber), ctx.margins.inner, 32);
      doc.text(bookTitle, ctx.pageWidth - ctx.margins.outer, 32, { align: "right" });
    } else {
      doc.text(chapterTitle, ctx.margins.inner, 32);
      doc.text(String(displayPageNumber), ctx.pageWidth - ctx.margins.outer, 32, {
        align: "right",
      });
    }

    doc.setDrawColor(220, 225, 233);
    doc.line(ctx.margins.inner, 40, ctx.pageWidth - ctx.margins.outer, 40);
  }
}

export async function generatePdf(project: EditableProject) {
  const palette = TEMPLATE_PALETTES[project.template];
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bodyFontSize = { small: 11, medium: 12.5, large: 14 }[project.fontSize];
  const lineHeightFactor = { compact: 1.45, normal: 1.62, relaxed: 1.8 }[
    project.ebookData.lineSpacing
  ];
  const fontFamily = project.ebookData.bodyFont === "serif" ? "times" : "helvetica";
  const ctx: LayoutContext = {
    doc,
    project,
    pageWidth,
    pageHeight,
    bodyFontSize,
    lineHeight: bodyFontSize * lineHeightFactor,
    fontFamily,
    margins: {
      top: 78,
      bottom: 72,
      inner: 68,
      outer: 60,
    },
    cursorY: 70,
    currentChapterTitle: project.ebookData.title || project.title,
    blankPages: new Set<number>(),
    headerlessPages: new Set<number>([1]),
    pageChapterTitles: new Map<number, string>(),
  };

  doc.setFillColor(hexToRgb(palette.cover).r, hexToRgb(palette.cover).g, hexToRgb(palette.cover).b);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  if (project.ebookData.coverImage) {
    renderImage(ctx, project.ebookData.coverImage, {
      maxWidth: pageWidth - 160,
      maxHeight: 260,
      centered: true,
    });
    ctx.cursorY += 32;
  } else {
    ctx.cursorY = 160;
  }

  doc.setTextColor(hexToRgb(palette.text).r, hexToRgb(palette.text).g, hexToRgb(palette.text).b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  if (project.ebookData.showTitleOnCover) {
    doc.text(stripUnsupportedCharacters(project.ebookData.title || project.title), pageWidth / 2, ctx.cursorY, {
      align: "center",
      maxWidth: pageWidth - 120,
    });
    ctx.cursorY += 30;
  }

  if (project.ebookData.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(stripUnsupportedCharacters(project.ebookData.subtitle), pageWidth / 2, ctx.cursorY, {
      align: "center",
      maxWidth: pageWidth - 150,
    });
    ctx.cursorY += 26;
  }

  if (project.ebookData.authorName) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text(stripUnsupportedCharacters(project.ebookData.authorName), pageWidth / 2, ctx.cursorY + 32, {
      align: "center",
    });
  }

  setCurrentRunningTitle(ctx, "Sumário");
  addPage(ctx);
  setCurrentRunningTitle(ctx, "Sumário");
  drawSectionTitle(ctx, "Sumário");
  renderList(
    ctx,
    [
      "Sobre o Autor",
      "Aviso Legal",
      "Introdução",
      ...project.ebookData.chapters.map((chapter) => chapter.title || "Capítulo sem título"),
      "Conclusão",
    ],
    false,
  );

  setCurrentRunningTitle(ctx, "Sobre o Autor");
  drawSectionTitle(ctx, "Sobre o Autor");
  renderParagraph(ctx, project.ebookData.authorName || "Autor não informado.");
  renderParagraph(ctx, project.ebookData.authorBio || "Biografia ainda não preenchida.");

  setCurrentRunningTitle(ctx, "Aviso Legal");
  drawSectionTitle(ctx, "Aviso Legal");
  renderParagraph(ctx, project.ebookData.copyright);
  renderParagraph(ctx, project.ebookData.disclaimer);

  setCurrentRunningTitle(ctx, "Introdução");
  drawSectionTitle(ctx, "Introdução");
  renderBlocks(ctx, project.ebookData.introduction);

  project.ebookData.chapters.forEach((chapter, index) => {
    setCurrentRunningTitle(ctx, chapter.title || `Capítulo ${index + 1}`);
    drawSectionTitle(ctx, ctx.currentChapterTitle, { chapterOpening: true });
    setCurrentRunningTitle(ctx, ctx.currentChapterTitle);

    if (chapter.image) {
      renderImage(ctx, chapter.image, {
        maxWidth: pageWidth - 140,
        maxHeight: 220,
      });
    }

    renderBlocks(ctx, chapter.content, { chapterMode: true });

    if (project.ebookData.chapterBlankPage && index < project.ebookData.chapters.length - 1) {
      addPage(ctx, true);
    }
  });

  setCurrentRunningTitle(ctx, "Conclusão");
  drawSectionTitle(ctx, "Conclusão", { chapterOpening: true });
  setCurrentRunningTitle(ctx, "Conclusão");
  renderBlocks(ctx, project.ebookData.conclusion);

  applyHeaders(ctx, stripUnsupportedCharacters(project.ebookData.title || project.title));

  const blob = doc.output("blob");
  downloadBlob(blob, safeFilename(project.title || project.ebookData.title, "pdf"));
}
