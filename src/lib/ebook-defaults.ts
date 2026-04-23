import {
  type EbookData,
  type EditableProject,
  type EbookProjectRecord,
  type ProjectCardView,
  type TemplateOption,
  type FontSizeOption,
  type TemplatePalette,
} from "@/types/ebook";
import { uniqueId } from "@/lib/utils";

export const TEMPLATE_PALETTES: Record<TemplateOption, TemplatePalette> = {
  minimalist: {
    label: "Minimalista",
    primary: "#1f2937",
    secondary: "#dbe4ee",
    accent: "#c08457",
    background: "#f8fafc",
    text: "#111827",
    cover: "#f1f5f9",
  },
  professional: {
    label: "Profissional",
    primary: "#16324f",
    secondary: "#dfe9f5",
    accent: "#de9151",
    background: "#f9fafb",
    text: "#172033",
    cover: "#dde8f4",
  },
  modern: {
    label: "Moderno",
    primary: "#0f766e",
    secondary: "#d9f7f3",
    accent: "#14b8a6",
    background: "#f0fdfa",
    text: "#123a37",
    cover: "#ccfbf1",
  },
  elegant: {
    label: "Elegante",
    primary: "#4c1d95",
    secondary: "#efe7ff",
    accent: "#c084fc",
    background: "#faf5ff",
    text: "#2e1065",
    cover: "#ede9fe",
  },
  colorful: {
    label: "Colorido",
    primary: "#9a3412",
    secondary: "#ffedd5",
    accent: "#f97316",
    background: "#fff7ed",
    text: "#7c2d12",
    cover: "#fed7aa",
  },
};

export const FONT_SIZE_LABELS: Record<FontSizeOption, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

export function createDefaultChapter(index: number) {
  return {
    id: uniqueId("chapter"),
    title: `Capítulo ${index}`,
    content: "",
    image: null,
  };
}

export function createDefaultEbookData(chapterCount = 3): EbookData {
  return {
    title: "",
    subtitle: "",
    authorName: "",
    authorBio: "",
    copyright: `Copyright © ${new Date().getFullYear()}. Todos os direitos reservados.`,
    disclaimer:
      "Este ebook tem caráter informativo. Nenhuma parte pode ser reproduzida sem autorização prévia.",
    introduction: "",
    conclusion: "",
    coverImage: null,
    chapters: Array.from({ length: chapterCount }, (_, index) => createDefaultChapter(index + 1)),
    showTitleOnCover: true,
    textAlign: "justify",
    lineSpacing: "normal",
    dropCap: true,
    chapterSeparatorPage: true,
    paragraphIndent: true,
    bodyFont: "serif",
    chapterBlankPage: false,
    chapterOpeningTopMargin: 75,
  };
}

export function createDefaultProjectDraft(): EditableProject {
  return {
    id: crypto.randomUUID(),
    title: "Novo Ebook",
    template: "professional",
    fontSize: "medium",
    ebookData: createDefaultEbookData(),
  };
}

export function mapRecordToEditableProject(record: EbookProjectRecord): EditableProject {
  return {
    id: record.id,
    title: record.title,
    template: record.template,
    fontSize: record.font_size,
    ebookData: record.ebook_data,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapRecordToCard(record: EbookProjectRecord): ProjectCardView {
  return {
    id: record.id,
    title: record.title,
    template: record.template,
    fontSize: record.font_size,
    updatedAt: record.updated_at,
    createdAt: record.created_at,
    subtitle: record.ebook_data.subtitle,
    chapterCount: record.ebook_data.chapters.length,
  };
}
