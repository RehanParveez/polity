import { useEffect, useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { useAuthStore } from './store'
import { authService } from '../services/authService'

function AuthBootstrap({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refresh_token')
    if (!storedRefreshToken) {
      setReady(true)
      return
    }
    authService
      .refresh(storedRefreshToken)
      .then(async ({ access_token, refresh_token }) => {
        localStorage.setItem('refresh_token', refresh_token)
        const user = await authService.me(access_token)
        setAuth(user, access_token)
      })
      .catch(() => localStorage.removeItem('refresh_token'))
      .finally(() => setReady(true))
  }, [setAuth])

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>
  }
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  )
}