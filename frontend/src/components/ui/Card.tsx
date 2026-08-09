import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 ${className}`}>{children}</div>
}