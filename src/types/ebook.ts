export type TextAlign = 'left' | 'justify'
export type LineSpacing = 'compact' | 'normal' | 'relaxed'
export type BodyFont = 'sans' | 'serif'
export type FontSize = 'small' | 'medium' | 'large'
export type EbookTemplate = 'minimalist' | 'professional' | 'modern' | 'elegant' | 'colorful'

export interface EbookChapter {
  id: string
  title: string
  content: string
  image?: string
}

export interface EbookData {
  title: string
  subtitle: string
  authorName: string
  authorBio: string
  copyright: string
  disclaimer: string
  introduction: string
  conclusion: string
  coverImage?: string
  chapters: EbookChapter[]
  showTitleOnCover: boolean
  textAlign: TextAlign
  lineSpacing: LineSpacing
  dropCap: boolean
  chapterSeparatorPage: boolean
  paragraphIndent: boolean
  bodyFont: BodyFont
  chapterBlankPage: boolean
  chapterOpeningTopMargin: number
}

export interface EbookProject {
  id: string
  title: string
  ebook_data: EbookData
  template: EbookTemplate
  font_size: FontSize
  created_at: string
  updated_at: string
}

export const defaultEbookData: EbookData = {
  title: 'Novo Ebook',
  subtitle: '',
  authorName: '',
  authorBio: '',
  copyright: '',
  disclaimer: '',
  introduction: '',
  conclusion: '',
  coverImage: undefined,
  chapters: [{ id: crypto.randomUUID(), title: 'Capítulo 1', content: '' }],
  showTitleOnCover: true,
  textAlign: 'justify',
  lineSpacing: 'normal',
  dropCap: true,
  chapterSeparatorPage: false,
  paragraphIndent: true,
  bodyFont: 'serif',
  chapterBlankPage: false,
  chapterOpeningTopMargin: 75,
}
