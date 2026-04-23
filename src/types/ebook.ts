export type TextAlignOption = "left" | "justify";
export type LineSpacingOption = "compact" | "normal" | "relaxed";
export type BodyFontOption = "sans" | "serif";
export type FontSizeOption = "small" | "medium" | "large";
export type TemplateOption =
  | "minimalist"
  | "professional"
  | "modern"
  | "elegant"
  | "colorful";

export interface EbookChapter {
  id: string;
  title: string;
  content: string;
  image?: string | null;
}

export interface EbookData {
  title: string;
  subtitle: string;
  authorName: string;
  authorBio: string;
  copyright: string;
  disclaimer: string;
  introduction: string;
  conclusion: string;
  coverImage: string | null;
  chapters: EbookChapter[];
  showTitleOnCover: boolean;
  textAlign: TextAlignOption;
  lineSpacing: LineSpacingOption;
  dropCap: boolean;
  chapterSeparatorPage: boolean;
  paragraphIndent: boolean;
  bodyFont: BodyFontOption;
  chapterBlankPage: boolean;
  chapterOpeningTopMargin: number;
}

export interface EbookProjectRecord {
  id: string;
  user_id: string;
  title: string;
  ebook_data: EbookData;
  template: TemplateOption;
  font_size: FontSizeOption;
  created_at: string;
  updated_at: string;
}

export interface EditableProject {
  id: string;
  title: string;
  template: TemplateOption;
  fontSize: FontSizeOption;
  ebookData: EbookData;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectCardView {
  id: string;
  title: string;
  template: TemplateOption;
  fontSize: FontSizeOption;
  updatedAt: string;
  createdAt: string;
  subtitle: string;
  chapterCount: number;
}

export interface DraftSnapshot<T> {
  project: T;
  savedAt: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlight?: boolean;
}

export type RichTextBlock =
  | { type: "paragraph"; text: string }
  | { type: "h3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export interface TemplatePalette {
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  cover: string;
}
