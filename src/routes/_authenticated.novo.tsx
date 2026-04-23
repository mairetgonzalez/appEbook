import { createRoute, useNavigate } from '@tanstack/react-router'
import { Route as AuthRoute } from './_authenticated'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { defaultEbookData } from '@/types/ebook'
import { lovable } from '@/lib/lovable'
import { toast } from 'sonner'

export const Route = createRoute({ getParentRoute: () => AuthRoute, path: '/novo', component: NewProjectPage })

function NewProjectPage() {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [author, setAuthor] = useState('')
  const [chapters, setChapters] = useState(3)
  const navigate = useNavigate()

  return <div className='mx-auto max-w-xl space-y-3'><h1 className='text-2xl font-semibold'>Novo projeto</h1><Input placeholder='Título' value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder='Subtítulo' value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /><Input placeholder='Autor' value={author} onChange={(e) => setAuthor(e.target.value)} /><Input type='number' min={1} value={chapters} onChange={(e) => setChapters(Number(e.target.value))} /><Input type='file' accept='image/*' onChange={async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await file.arrayBuffer().then((buffer) => `data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`)
    localStorage.setItem('new-cover', base64)
  }} /><Button onClick={async () => {
    const ebook = {
      ...defaultEbookData,
      title,
      subtitle,
      authorName: author,
      coverImage: localStorage.getItem('new-cover') ?? undefined,
      chapters: Array.from({ length: chapters }).map((_, idx) => ({ id: crypto.randomUUID(), title: `Capítulo ${idx + 1}`, content: '' })),
    }
    const { data, error } = await lovable.from('ebook_projects').insert({ title: title || 'Novo Ebook', ebook_data: ebook, template: 'professional', font_size: 'medium' }).select('id').single()
    if (error) return toast.error(error.message)
    navigate({ to: '/editor/$projectId', params: { projectId: data.id } })
  }}>Criar projeto</Button></div>
}
