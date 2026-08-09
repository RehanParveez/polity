import type { ReactNode } from 'react'
import { useAuthStore } from '../../app/store'

type Props = {
  perm: string
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ perm, children, fallback = null }: Props) {
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])
  if (!permissions.includes(perm)) return <>{fallback}</>
  return <>{children}</>
}