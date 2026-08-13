import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}