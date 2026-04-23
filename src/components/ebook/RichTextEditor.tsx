import { useMemo } from 'react'
import { Bold, Heading3, Highlighter, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const commands = [
  { icon: Heading3, token: '## ', label: 'H3' },
  { icon: Bold, token: '**negrito**', label: 'Negrito' },
  { icon: Italic, token: '*itálico*', label: 'Itálico' },
  { icon: Underline, token: '__sublinhado__', label: 'Sublinhado' },
  { icon: Highlighter, token: '==destaque==', label: 'Destaque' },
  { icon: List, token: '- item', label: 'Lista' },
  { icon: ListOrdered, token: '1. item', label: 'Lista numerada' },
  { icon: Quote, token: '> citação', label: 'Citação' },
]

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const html = useMemo(() => value.replace(/\n/g, '<br/>'), [value])

  const insertToken = (token: string) => {
    onChange(`${value}${value.endsWith('\n') ? '' : '\n'}${token}`)
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2 rounded-md border border-border p-2'>
        {commands.map(({ icon: Icon, token, label }) => (
          <Button key={label} variant='outline' type='button' onClick={() => insertToken(token)} title={label}>
            <Icon size={16} />
          </Button>
        ))}
      </div>
      <div
        className={cn('rte-editable min-h-60 rounded-md border border-border bg-background p-3 text-sm')}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? 'Digite o conteúdo aqui...'}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerText)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
