import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { lovable } from '@/lib/lovable'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createRoute({ getParentRoute: () => RootRoute, path: '/login', component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <div className='mx-auto max-w-md space-y-3'><h1 className='text-2xl font-semibold'>Entrar</h1><Input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><Input placeholder='Senha' type='password' value={password} onChange={(e) => setPassword(e.target.value)} /><Button onClick={async () => {
    const { error } = await lovable.auth.signInWithPassword({ email, password })
    if (error) return toast.error(error.message)
    navigate({ to: '/' })
  }}>Entrar</Button><Button variant='outline' onClick={() => lovable.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}>Entrar com Google</Button><p>Sem conta? <Link to='/signup' className='underline'>Cadastre-se</Link></p></div>
}
