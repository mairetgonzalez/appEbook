import { createRoute, Link } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { lovable } from '@/lib/lovable'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createRoute({ getParentRoute: () => RootRoute, path: '/signup', component: SignupPage })

function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <div className='mx-auto max-w-md space-y-3'><h1 className='text-2xl font-semibold'>Criar conta</h1><Input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} /><Input placeholder='Senha' type='password' value={password} onChange={(e) => setPassword(e.target.value)} /><Button onClick={async () => {
    const { error } = await lovable.auth.signUp({ email, password })
    if (error) return toast.error(error.message)
    toast.success('Conta criada! Verifique seu email.')
  }}>Criar conta</Button><p>Já tem conta? <Link to='/login' className='underline'>Entrar</Link></p></div>
}
