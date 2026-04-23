import { Navigate, Outlet, createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: '_authenticated',
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className='flex items-center gap-2'><Loader2 className='animate-spin' /> Carregando...</div>
  if (!isAuthenticated) return <Navigate to='/login' />
  return <Outlet />
}
