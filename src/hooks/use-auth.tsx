import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { lovable } from '@/lib/lovable'

interface AuthContextValue {
  userId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ userId: null, isAuthenticated: false, isLoading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    lovable.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setIsLoading(false)
    })

    const { data } = lovable.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setIsLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({ userId, isLoading, isAuthenticated: !!userId }),
    [isLoading, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
