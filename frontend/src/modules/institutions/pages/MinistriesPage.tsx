import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {Landmark, GraduationCap, HeartPulse, Wheat, Construction, Briefcase, Shield, Building2, ArrowUpRight, LayoutGrid, type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { institutionsService } from '../../../services/institutionsService'

const ICONS: Record<string, LucideIcon> = {
  FIN: Landmark,
  EDU: GraduationCap,
  HLTH: HeartPulse,
  AGR: Wheat,
  INFRA: Construction,
  LABOR: Briefcase,
  DEF: Shield,
}

const CODE_COLORS: Record<string, string> = {
  FIN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  EDU: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HLTH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  AGR: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  INFRA: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  LABOR: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  DEF: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function MinistriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ministries'],
    queryFn: institutionsService.listMinistries,
  })

  const totalMinistries = data?.length ?? 0

  const codeBreakdown = useMemo(() => {
    if (!data) return []
    const map = new Map<string, number>()
    data.forEach((m: any) => {
      map.set(m.code, (map.get(m.code) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([code, count]) => ({ code, count }))
  }, [data])

  if (isLoading) return <p className="text-slate-400">Loading institutions…</p>
  if (error) return <p className="text-red-400">Could not load ministries.</p>

  return (
    <div>
      <PageHeader
        title="Institutions"
        subtitle={`${totalMinistries.toLocaleString()} ministries and departments · National government structure`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total ministries"
          value={totalMinistries.toLocaleString()}
        />
        <StatCard
          label="Departments"
          value={totalMinistries.toLocaleString()}
        />
        <StatCard
          label="Active portfolios"
          value={totalMinistries.toString()}
        />
        <StatCard
          label="Sectors covered"
          value={codeBreakdown.length.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <LayoutGrid size={16} className="text-slate-500" />
            Ministry directory
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.map((ministry: any) => {
              const Icon = ICONS[ministry.code] ?? Building2
              const codeStyle = CODE_COLORS[ministry.code] ?? 'bg-slate-800 text-slate-400 border-slate-700'

              return (
                <Link key={ministry.id} to={`/institutions/ministries/${ministry.id}`}>
                  <Card className="group hover:border-violet-900/50 transition-all h-full">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Icon size={24} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                          {ministry.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${codeStyle}`}>
                            {ministry.code}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-600 group-hover:text-violet-500 transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-slate-500" />
            Portfolio breakdown
          </h3>
          <Card>
            <div className="space-y-3">
              {codeBreakdown.map((item) => {
                const Icon = ICONS[item.code] ?? Building2
                const pct = totalMinistries > 0 ? (item.count / totalMinistries) * 100 : 0
                return (
                  <div key={item.code}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-slate-500" />
                        <span className="text-slate-400">{item.code}</span>
                      </div>
                      <span className="text-slate-200 font-medium">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                {totalMinistries} ministries managing national portfolios across {codeBreakdown.length} sectors.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}