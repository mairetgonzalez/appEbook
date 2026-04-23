import { createRoute, Link } from '@tanstack/react-router'
import { Route as AuthRoute } from './_authenticated'
import { useEffect, useState } from 'react'
import type { EbookProject } from '@/types/ebook'
import { lovable } from '@/lib/lovable'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EbookEditor } from '@/components/ebook/EbookEditor'

export const Route = createRoute({
  getParentRoute: () => AuthRoute,
  path: '/editor/$projectId',
  component: ProjectEditorPage,
})

function ProjectEditorPage() {
  const { projectId } = Route.useParams()
  const [project, setProject] = useState<EbookProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lovable.from('ebook_projects').select('*').eq('id', projectId).single().then(({ data }) => {
      setProject(data as EbookProject)
      setLoading(false)
    })
  }, [projectId])

  if (loading) return <div className='flex items-center gap-2'><Loader2 className='animate-spin' /> Carregando...</div>
  if (!project) return <div className='space-y-3'><h1 className='text-2xl font-semibold'>Projeto não encontrado</h1><Button asChild><Link to='/'>Voltar</Link></Button></div>
  return <EbookEditor project={project} />
}
