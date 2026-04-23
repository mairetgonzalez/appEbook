import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => (
    <main className='min-h-screen bg-background text-foreground'>
      <div className='mx-auto max-w-7xl p-4'>
        <Outlet />
      </div>
      <Toaster richColors position='top-right' />
    </main>
  ),
})
