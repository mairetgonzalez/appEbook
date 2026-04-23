import type { InlineSegment, RichTextBlock } from "@/types/ebook";

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|==[^=]+==)/g;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function stripUnsupportedCharacters(value: string) {
  return value
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/[\uFE00-\uFE0F]/g, "");
}

export function cleanInlineMarkers(value: string) {
  return value.replace(/(\*\*|__|==|\*)/g, "").trim();
}

export function parseInlineSegments(value: string): InlineSegment[] {
  if (!value) {
    return [];
  }

  const segments: InlineSegment[] = [];
  let lastIndex = 0;

  value.replace(INLINE_PATTERN, (match, _group, offset: number) => {
    if (offset > lastIndex) {
      segments.push({ text: value.slice(lastIndex, offset) });
    }

    if (match.startsWith("**") && match.endsWith("**")) {
      segments.push({ text: match.slice(2, -2), bold: true });
    } else if (match.startsWith("__") && match.endsWith("__")) {
      segments.push({ text: match.slice(2, -2), underline: true });
    } else if (match.startsWith("==") && match.endsWith("==")) {
      segments.push({ text: match.slice(2, -2), highlight: true });
    } else if (match.startsWith("*") && match.endsWith("*")) {
      segments.push({ text: match.slice(1, -1), italic: true });
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex) });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

export function renderInlineHtml(value: string) {
  return parseInlineSegments(value)
    .map((segment) => {
      const text = escapeHtml(segment.text);

      if (segment.bold) {
        return `<strong>${text}</strong>`;
      }

      if (segment.italic) {
        return `<em>${text}</em>`;
      }

      if (segment.underline) {
        return `<u>${text}</u>`;
      }

      if (segment.highlight) {
        return `<mark>${text}</mark>`;
      }

      return text;
    })
    .join("");
}

export function parseMarkdownBlocks(markdown: string): RichTextBlock[] {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: RichTextBlock[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    buffer = [];
  };

  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();

    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (/^##\s+/.test(line)) {
      flushParagraph();
      blocks.push({ type: "h3", text: line.replace(/^##\s+/, "") });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^-\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^-\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    buffer.push(line.trim());
    index += 1;
  }

  flushParagraph();

  return blocks;
}

export function markdownToHtml(markdown: string) {
  return parseMarkdownBlocks(markdown)
    .map((block) => {
      if (block.type === "paragraph") {
        return `<p>${renderInlineHtml(block.text)}</p>`;
      }

      if (block.type === "h3") {
        return `<h3>${renderInlineHtml(cleanInlineMarkers(block.text))}</h3>`;
      }

      if (block.type === "blockquote") {
        return `<blockquote>${renderInlineHtml(block.text)}</blockquote>`;
      }

      if (block.type === "ul") {
        return `<ul>${block.items.map((item) => `<li>${renderInlineHtml(item)}</li>`).join("")}</ul>`;
      }

      return `<ol>${block.items.map((item) => `<li>${renderInlineHtml(item)}</li>`).join("")}</ol>`;
    })
    .join("");
}

function serializeInlineNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  const children = Array.from(node.childNodes).map(serializeInlineNode).join("");

  if (node.tagName === "STRONG" || node.tagName === "B") {
    return `**${children}**`;
  }

  if (node.tagName === "EM" || node.tagName === "I") {
    return `*${children}*`;
  }

  if (node.tagName === "U") {
    return `__${children}__`;
  }

  if (
    node.tagName === "MARK" ||
    (node.tagName === "SPAN" && node.style.backgroundColor)
  ) {
    return `==${children}==`;
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  return children;
}

function serializeBlockNode(node: ChildNode): string {
  if (!(node instanceof HTMLElement)) {
    return serializeInlineNode(node).trim();
  }

  if (node.tagName === "H3") {
    return `## ${Array.from(node.childNodes).map(serializeInlineNode).join("").trim()}`;
  }

  if (node.tagName === "BLOCKQUOTE") {
    const text = Array.from(node.childNodes).map(serializeInlineNode).join("").trim();
    return `> ${text}`;
  }

  if (node.tagName === "UL") {
    return Array.from(node.children)
      .map((item) => `- ${Array.from(item.childNodes).map(serializeInlineNode).join("").trim()}`)
      .join("\n");
  }

  if (node.tagName === "OL") {
    return Array.from(node.children)
      .map(
        (item, index) =>
          `${index + 1}. ${Array.from(item.childNodes).map(serializeInlineNode).join("").trim()}`,
      )
      .join("\n");
  }

  const text = Array.from(node.childNodes).map(serializeInlineNode).join("").trim();
  return text;
}

export function editableHtmlToMarkdown(editable: HTMLElement) {
  return Array.from(editable.childNodes)
    .map(serializeBlockNode)
    .map((block) => block.replace(/\n{3,}/g, "\n\n").trim())
    .filter(Boolean)
    .join("\n\n");
}
