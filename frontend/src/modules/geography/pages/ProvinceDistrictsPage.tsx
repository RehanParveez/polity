import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin, Grid3X3, ChevronRight, Compass,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { geographyService } from '../../../services/geographyService'

export function ProvinceDistrictsPage() {
  const { t } = useTranslation(['geography', 'common'])
  const { provinceId } = useParams<{ provinceId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['districts', provinceId],
    queryFn: () => geographyService.listDistricts(provinceId!),
    enabled: !!provinceId,
  })

  const totalDistricts = data?.length ?? 0

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (error) return <p className="text-red-400">{t('couldNotLoad', { resource: t('districts') })}</p>

  return (
    <div>
      <PageHeader
        title={t('districts')}
        subtitle={`${totalDistricts.toLocaleString()} ${t('administrativeUnits')} · ${t('province')} ${provinceId}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('totalDistricts')}
          value={totalDistricts.toLocaleString()}
        />
        <StatCard
          label={t('provinceCode')}
          value={provinceId ?? '—'}
        />
      </div>

      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <Grid3X3 size={16} className="text-slate-500" />
        {t('administrativeDivisions')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((district) => (
          <Link key={district.id} to={`/geography/districts/${district.id}`}>
            <Card className="group hover:border-cyan-900/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Compass size={20} className="text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate group-hover:text-white transition-colors">
                    {district.name}
                  </p>
                  <p className="text-xs text-slate-500">{t('district')} · {t('province')} {provinceId}</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-500 transition-colors shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}