import { createRoute, useNavigate } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { useEffect } from 'react'
import { lovable } from '@/lib/lovable'

export const Route = createRoute({ getParentRoute: () => RootRoute, path: '/auth/callback', component: CallbackPage })

function CallbackPage() {
  const navigate = useNavigate()
  useEffect(() => {
    lovable.auth.getSession().finally(() => navigate({ to: '/' }))
  }, [navigate])
  return <p>Autenticando...</p>
}
