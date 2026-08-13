import { useTranslation } from 'react-i18next'
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
    labelKey: 'sectors:education.title',
    icon: GraduationCap,
    path: '/sectors/education',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/50',
    metric: (d: any) => d.education_institutions.toLocaleString(),
    unitKey: 'sectors:education.institutions',
    subKey: 'sectors:education.studentsEnrolled',
    subData: (d: any) => ({ count: d.total_enrollment }),
  },
  {
    key: 'healthcare',
    labelKey: 'sectors:healthcare.title',
    icon: HeartPulse,
    path: '/sectors/healthcare',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'hover:border-rose-500/50',
    metric: (d: any) => d.healthcare_institutions.toLocaleString(),
    unitKey: 'sectors:healthcare.facilities',
    subKey: 'sectors:healthcare.bedsTotal',
    subData: (d: any) => ({ count: d.total_beds }),
  },
  {
    key: 'agriculture',
    labelKey: 'sectors:agriculture.title',
    icon: Wheat,
    path: '/sectors/agriculture',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/50',
    metric: (d: any) => d.farms.toLocaleString(),
    unitKey: 'sectors:agriculture.farms',
    subKey: 'sectors:agriculture.hectares',
    subData: (d: any) => ({ count: Number(d.total_farm_area) }),
  },
  {
    key: 'infrastructure',
    labelKey: 'sectors:infrastructure.title',
    icon: Construction,
    path: '/sectors/infrastructure',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'hover:border-orange-500/50',
    metric: null,
    unitKey: null,
    subKey: null,
    subData: null,
  },
  {
    key: 'labor',
    labelKey: 'sectors:labor.title',
    icon: Briefcase,
    path: '/sectors/labor',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'hover:border-violet-500/50',
    metric: (d: any) => d.total_workforce.toLocaleString(),
    unitKey: 'sectors:labor.workforceLabel',
    subKey: 'sectors:labor.districts',
    subData: (d: any) => ({ count: d.labor_records }),
  },
  {
    key: 'defense',
    labelKey: 'sectors:defense.title',
    icon: Shield,
    path: '/sectors/defense',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'hover:border-emerald-500/50',
    metric: null,
    unitKey: null,
    subKey: null,
    subData: null,
  },
]

export function SectorsDashboardPage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-summary'],
    queryFn: sectorsService.getSummary,
  })

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('sectors:title')}
        subtitle={t('sectors:subtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('sectors:education.statLabel')}
          value={data.education_institutions.toLocaleString()}
          caption={t('sectors:education.studentsEnrolled', { count: data.total_enrollment })}
        />
        <StatCard
          label={t('sectors:healthcare.statLabel')}
          value={data.healthcare_institutions.toLocaleString()}
          caption={t('sectors:healthcare.bedsTotal', { count: data.total_beds })}
        />
        <StatCard
          label={t('sectors:agriculture.statLabel')}
          value={data.farms.toLocaleString()}
          caption={t('sectors:agriculture.hectares', { count: Number(data.total_farm_area) })}
        />
        <StatCard
          label={t('sectors:labor.workforceLabel')}
          value={data.total_workforce.toLocaleString()}
          caption={t('sectors:labor.districts', { count: data.labor_records })}
        />
      </div>

      <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-slate-500" />
        {t('sectors:sectorOverview')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTORS.map(({ key, labelKey, icon: Icon, path, color, bg, border, metric, unitKey, subKey, subData }) => (
          <Link key={key} to={path}>
            <Card className={`group transition-all h-full ${border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={24} className={color} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {t(labelKey)}
                    </p>
                    {metric && data ? (
                      <div className="mt-1">
                        <p className="text-lg font-bold text-slate-200">
                          {metric(data)}
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            {unitKey ? t(unitKey) : ''}
                          </span>
                        </p>
                        {subKey && subData && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t(subKey, subData(data))}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        {t('sectors:viewDetailed')}
                      </p>
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