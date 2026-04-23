import { createRoute, Link } from '@tanstack/react-router'
import { Route as AuthRoute } from './_authenticated'
import { useEffect, useState } from 'react'
import type { EbookProject } from '@/types/ebook'
import { lovable } from '@/lib/lovable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export const Route = createRoute({ getParentRoute: () => AuthRoute, path: '/', component: ProjectsPage })

function ProjectsPage() {
  const [projects, setProjects] = useState<EbookProject[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    lovable.from('ebook_projects').select('*').order('updated_at', { ascending: false }).then(({ data }) => {
      setProjects((data as EbookProject[]) || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className='flex items-center gap-2'><Loader2 className='animate-spin' /> Carregando projetos...</div>

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-semibold'>Diagramador de Ebook</h1>
        <Button asChild><Link to='/novo'>Novo</Link></Button>
      </div>
      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {projects.map((project) => (
          <Card key={project.id} className='p-4'>
            <h2 className='text-xl font-semibold'>{project.title}</h2>
            <p className='text-sm text-muted-foreground'>Atualizado em {new Date(project.updated_at).toLocaleString('pt-BR')}</p>
            <Button asChild className='mt-3'><Link to='/editor/$projectId' params={{ projectId: project.id }}>Abrir</Link></Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
