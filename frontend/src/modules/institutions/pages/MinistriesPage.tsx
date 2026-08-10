import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Landmark, GraduationCap, HeartPulse, Wheat, Construction, Briefcase, Shield, Building2, type LucideIcon } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
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

export function MinistriesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['ministries'], queryFn: institutionsService.listMinistries })

  return (
    <div>
      <PageHeader title="Institutions" subtitle="Ministries and departments" />
      {isLoading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">Could not load ministries.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((ministry) => {
          const Icon = ICONS[ministry.code] ?? Building2
          return (
            <Link key={ministry.id} to={`/institutions/ministries/${ministry.id}`}>
              <Card className="hover:border-teal-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{ministry.name}</p>
                    <p className="text-xs text-slate-500 uppercase">{ministry.code}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}