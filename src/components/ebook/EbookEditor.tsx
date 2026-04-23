import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { EbookData, EbookProject, EbookTemplate, FontSize } from '@/types/ebook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ebook/RichTextEditor'
import { ThemeForm } from '@/components/ebook/ThemeForm'
import { exportPdf } from '@/lib/pdf-generator'
import { exportEpub } from '@/lib/epub-generator'
import { lovable } from '@/lib/lovable'

type Section = 'cover' | 'author' | 'legal' | 'intro' | 'conclusion' | `chapter:${string}`

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const retries = [5000, 15000, 30000, 30000]

export function EbookEditor({ project }: { project: EbookProject }) {
  const navigate = useNavigate()
  const [ebookData, setEbookData] = useState<EbookData>(project.ebook_data)
  const [template, setTemplate] = useState<EbookTemplate>(project.template)
  const [fontSize, setFontSize] = useState<FontSize>(project.font_size)
  const [section, setSection] = useState<Section>('cover')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [pending, setPending] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)
  const localKey = `ebook-project:${project.id}`

  const activeChapter = useMemo(() => {
    if (!section.startsWith('chapter:')) return null
    return ebookData.chapters.find((c) => c.id === section.split(':')[1])
  }, [ebookData.chapters, section])

  const writeLocal = (next: EbookData, nextTemplate = template, nextSize = fontSize) => {
    localStorage.setItem(localKey, JSON.stringify({ ebook_data: next, template: nextTemplate, font_size: nextSize, updated_at: new Date().toISOString() }))
  }

  const saveRemote = async (attempt = 0) => {
    try {
      setSaveState('saving')
      await lovable.from('ebook_projects').update({ ebook_data: ebookData, template, font_size: fontSize }).eq('id', project.id)
      setSaveState('saved')
      setPending(false)
    } catch {
      setSaveState('error')
      if (attempt < retries.length) window.setTimeout(() => saveRemote(attempt + 1), retries[attempt])
    }
  }

  const scheduleSave = (next: EbookData) => {
    setPending(true)
    writeLocal(next)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => saveRemote(), 800)
  }

  useEffect(() => {
    const cached = localStorage.getItem(localKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (window.confirm('Encontramos uma cópia local não sincronizada. Deseja restaurar?')) {
        setEbookData(parsed.ebook_data)
        setTemplate(parsed.template)
        setFontSize(parsed.font_size)
      }
    }
  }, [localKey])

  useEffect(() => {
    const flush = () => pending && saveRemote()
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!pending) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('blur', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('blur', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [pending])

  const update = (next: EbookData) => {
    setEbookData(next)
    scheduleSave(next)
  }

  const goBack = async () => {
    await saveRemote()
    toast.success('Projeto salvo')
    navigate({ to: '/' })
  }

  return (
    <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
      <aside className='space-y-2 rounded-xl border border-border p-3'>
        {[
          ['cover', 'Capa'],
          ['author', 'Sobre o Autor'],
          ['legal', 'Aviso Legal'],
          ['intro', 'Introdução'],
          ['conclusion', 'Conclusão'],
        ].map(([value, label]) => (
          <Button key={value} variant={section === value ? 'default' : 'ghost'} className='w-full justify-start' onClick={() => setSection(value as Section)}>{label}</Button>
        ))}
        <div className='pt-2'>
          <p className='mb-2 text-xs font-semibold uppercase text-muted-foreground'>Capítulos</p>
          {ebookData.chapters.map((chapter) => (
            <div key={chapter.id} className='mb-2 flex gap-1'>
              <Button className='flex-1 justify-start' variant={section === `chapter:${chapter.id}` ? 'default' : 'outline'} onClick={() => setSection(`chapter:${chapter.id}`)}>{chapter.title || 'Sem título'}</Button>
              <Button variant='destructive' onClick={() => {
                if (window.confirm('Deseja excluir este capítulo?')) {
                  update({ ...ebookData, chapters: ebookData.chapters.filter((c) => c.id !== chapter.id) })
                }
              }}>x</Button>
            </div>
          ))}
          <Button onClick={() => update({ ...ebookData, chapters: [...ebookData.chapters, { id: crypto.randomUUID(), title: `Capítulo ${ebookData.chapters.length + 1}`, content: '' }] })}>Adicionar capítulo</Button>
        </div>
      </aside>

      <section className='space-y-4'>
        <div className='flex flex-wrap gap-2 rounded-xl border border-border p-3'>
          <ThemeForm template={template} onTemplate={setTemplate} fontSize={fontSize} onFontSize={setFontSize} />
          <Button variant='outline' onClick={() => update({ ...ebookData, bodyFont: ebookData.bodyFont === 'serif' ? 'sans' : 'serif' })}>{ebookData.bodyFont === 'serif' ? 'Garamond/Times' : 'Helvetica'}</Button>
          <Button variant='outline' onClick={() => update({ ...ebookData, chapterBlankPage: !ebookData.chapterBlankPage })}>Página em branco</Button>
          <Button variant='outline' onClick={() => update({ ...ebookData, dropCap: !ebookData.dropCap })}>Drop cap</Button>
          <Button variant='outline' onClick={() => update({ ...ebookData, paragraphIndent: !ebookData.paragraphIndent })}>Indent</Button>
          <Button variant='outline' onClick={() => update({ ...ebookData, textAlign: ebookData.textAlign === 'left' ? 'justify' : 'left' })}>Justificado</Button>
          <Button variant='outline' onClick={() => update({ ...ebookData, lineSpacing: ebookData.lineSpacing === 'compact' ? 'normal' : ebookData.lineSpacing === 'normal' ? 'relaxed' : 'compact' })}>Espaçamento</Button>
          <Button onClick={() => exportPdf(ebookData, template, fontSize)}>Exportar PDF</Button>
          <Button onClick={() => exportEpub(ebookData, template)}>Exportar ePub</Button>
          <Button variant='ghost' onClick={goBack}>Voltar</Button>
        </div>

        <div className='rounded-xl border border-border p-4'>
          {section === 'cover' && (
            <div className='space-y-3'>
              <Input value={ebookData.title} onChange={(e) => update({ ...ebookData, title: e.target.value })} placeholder='Título' />
              <Input value={ebookData.subtitle} onChange={(e) => update({ ...ebookData, subtitle: e.target.value })} placeholder='Subtítulo' />
              <Input type='file' accept='image/*' onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const base64 = await file.arrayBuffer().then((buffer) => `data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`)
                update({ ...ebookData, coverImage: base64 })
              }} />
              <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={ebookData.showTitleOnCover} onChange={(e) => update({ ...ebookData, showTitleOnCover: e.target.checked })} /> Mostrar título na capa</label>
            </div>
          )}
          {section === 'author' && <div className='space-y-3'><Input value={ebookData.authorName} onChange={(e) => update({ ...ebookData, authorName: e.target.value })} placeholder='Nome do autor' /><Textarea value={ebookData.authorBio} onChange={(e) => update({ ...ebookData, authorBio: e.target.value })} placeholder='Bio' /></div>}
          {section === 'legal' && <div className='space-y-3'><Textarea value={ebookData.copyright} onChange={(e) => update({ ...ebookData, copyright: e.target.value })} placeholder='Copyright' /><Textarea value={ebookData.disclaimer} onChange={(e) => update({ ...ebookData, disclaimer: e.target.value })} placeholder='Disclaimer' /></div>}
          {section === 'intro' && <RichTextEditor value={ebookData.introduction} onChange={(introduction) => update({ ...ebookData, introduction })} />}
          {section === 'conclusion' && <RichTextEditor value={ebookData.conclusion} onChange={(conclusion) => update({ ...ebookData, conclusion })} />}
          {activeChapter && (
            <div className='space-y-3'>
              <Input value={activeChapter.title} onChange={(e) => update({ ...ebookData, chapters: ebookData.chapters.map((c) => c.id === activeChapter.id ? { ...c, title: e.target.value } : c) })} />
              <RichTextEditor value={activeChapter.content} onChange={(content) => update({ ...ebookData, chapters: ebookData.chapters.map((c) => c.id === activeChapter.id ? { ...c, content } : c) })} />
            </div>
          )}
        </div>
      </section>

      <div className='fixed bottom-4 right-4 rounded-full border border-border bg-background px-4 py-2 text-sm shadow'>
        {saveState === 'saving' && <span className='inline-flex items-center gap-2'><Loader2 className='animate-spin' size={16} /> Salvando...</span>}
        {saveState === 'saved' && <span className='inline-flex items-center gap-2'><Save size={16} /> ✓ Salvo</span>}
        {saveState === 'error' && <span>Erro ao salvar</span>}
      </div>
    </div>
  )
}
