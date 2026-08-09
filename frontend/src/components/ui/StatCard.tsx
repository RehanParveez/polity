import { Card } from './Card'

type StatCardProps = {
  label: string
  value: string
  trend?: { value: string; direction: 'up' | 'down' }
  caption?: string
}

export function StatCard({ label, value, trend, caption }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-slate-100 mt-2">{value}</div>
      {caption && <div className="text-xs text-slate-500 mt-1">{caption}</div>}
    </Card>
  )
}