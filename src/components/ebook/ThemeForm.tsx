import type { EbookTemplate, FontSize } from '@/types/ebook'
import { Button } from '@/components/ui/button'

const templates: EbookTemplate[] = ['minimalist', 'professional', 'modern', 'elegant', 'colorful']

interface Props {
  template: EbookTemplate
  onTemplate: (v: EbookTemplate) => void
  fontSize: FontSize
  onFontSize: (v: FontSize) => void
}

export function ThemeForm({ template, onTemplate, fontSize, onFontSize }: Props) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {templates.map((item) => (
        <Button key={item} variant={template === item ? 'default' : 'outline'} onClick={() => onTemplate(item)}>{item}</Button>
      ))}
      <select className='rounded-md border border-border px-3 py-2 text-sm' value={fontSize} onChange={(e) => onFontSize(e.target.value as FontSize)}>
        <option value='small'>Pequeno</option>
        <option value='medium'>Médio</option>
        <option value='large'>Grande</option>
      </select>
    </div>
  )
}
