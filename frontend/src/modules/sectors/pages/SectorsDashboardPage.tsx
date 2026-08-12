import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {GraduationCap, HeartPulse, Wheat, Construction, Briefcase, Shield, ArrowUpRight,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const SECTORS = [
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    path: '/sectors/education',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/50',
    metric: (d: any) => d.education_institutions.toLocaleString(),
    unit: 'institutions',
    sub: (d: any) => `${d.total_enrollment.toLocaleString()} students enrolled`,
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    icon: HeartPulse,
    path: '/sectors/healthcare',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'hover:border-rose-500/50',
    metric: (d: any) => d.healthcare_institutions.toLocaleString(),
    unit: 'facilities',
    sub: (d: any) => `${d.total_beds.toLocaleString()} beds total`,
  },
  {
    key: 'agriculture',
    label: 'Agriculture',
    icon: Wheat,
    path: '/sectors/agriculture',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/50',
    metric: (d: any) => d.farms.toLocaleString(),
    unit: 'farms',
    sub: (d: any) => `${Number(d.total_farm_area).toLocaleString()} ha cultivated`,
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure',
    icon: Construction,
    path: '/sectors/infrastructure',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'hover:border-orange-500/50',
    metric: null,
    unit: null,
    sub: null,
  },
  {
    key: 'labor',
    label: 'Labor',
    icon: Briefcase,
    path: '/sectors/labor',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'hover:border-violet-500/50',
    metric: (d: any) => d.total_workforce.toLocaleString(),
    unit: 'workers',
    sub: (d: any) => `${d.labor_records} districts tracked`,
  },
  {
    key: 'defense',
    label: 'Defense',
    icon: Shield,
    path: '/sectors/defense',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'hover:border-emerald-500/50',
    metric: null,
    unit: null,
    sub: null,
  },
]

export function SectorsDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-summary'],
    queryFn: sectorsService.getSummary,
  })

  if (isLoading) return <p className="text-slate-400">Loading sector summary…</p>
  if (!data) return <p className="text-red-400">Could not load sector summary.</p>

  return (
    <div>
      <PageHeader
        title="Sectors"
        subtitle="National sector overview and performance indicators"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Education institutions"
          value={data.education_institutions.toLocaleString()}
          caption={`${data.total_enrollment.toLocaleString()} students enrolled`}
        />
        <StatCard
          label="Healthcare facilities"
          value={data.healthcare_institutions.toLocaleString()}
          caption={`${data.total_beds.toLocaleString()} beds total`}
        />
        <StatCard
          label="Farms"
          value={data.farms.toLocaleString()}
          caption={`${Number(data.total_farm_area).toLocaleString()} ha total`}
        />
        <StatCard
          label="Workforce"
          value={data.total_workforce.toLocaleString()}
          caption={`${data.labor_records} districts tracked`}
        />
      </div>

      <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-slate-500" />
        Sector overview
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTORS.map(({ key, label, icon: Icon, path, color, bg, border, metric, unit, sub }) => (
          <Link key={key} to={path}>
            <Card className={`group transition-all h-full ${border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={24} className={color} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {label}
                    </p>
                    {metric && data ? (
                      <div className="mt-1">
                        <p className="text-lg font-bold text-slate-200">
                          {metric(data)}
                          <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>
                        </p>
                        {sub && (
                          <p className="text-xs text-slate-500 mt-0.5">{sub(data)}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">View detailed records</p>
                    )}
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1"
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}