import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe, MapPin, Landmark, Building2, ChevronRight,
  BarChart3,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { geographyService } from '../../../services/geographyService'

const TYPE_ICONS: Record<string, any> = {
  province: Landmark,
  territory: Building2,
}

const TYPE_COLORS: Record<string, string> = {
  province: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  territory: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}

export function ProvincesPage() {
  const { t } = useTranslation(['geography', 'common'])
  const { data, isLoading, error } = useQuery({
    queryKey: ['provinces'],
    queryFn: geographyService.listProvinces,
  })

  const totalUnits = data?.length ?? 0
  const provinceCount = useMemo(
    () => data?.filter((p: any) => p.unit_type === 'province').length ?? 0,
    [data]
  )
  const territoryCount = useMemo(
    () => data?.filter((p: any) => p.unit_type === 'territory').length ?? 0,
    [data]
  )

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (error) return <p className="text-red-400">{t('couldNotLoad', { resource: t('title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={`${totalUnits.toLocaleString()} ${t('administrativeUnits')} · ${t('nationalTerritorialOverview')}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('totalUnits')}
          value={totalUnits.toLocaleString()}
        />
        <StatCard
          label={t('provinces')}
          value={provinceCount.toString()}
        />
        <StatCard
          label={t('territories')}
          value={territoryCount.toString()}
        />
        <StatCard
          label={t('regions')}
          value={totalUnits.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Globe size={16} className="text-slate-500" />
            {t('administrativeUnits')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.map((province: any) => {
              const TypeIcon = TYPE_ICONS[province.unit_type] ?? MapPin
              const typeStyle = TYPE_COLORS[province.unit_type] ?? 'bg-slate-800 text-slate-400 border-slate-700'

              return (
                <Link key={province.id} to={`/geography/provinces/${province.id}`}>
                  <Card className="group hover:border-cyan-900/50 transition-all h-full">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <TypeIcon size={24} className="text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                          {province.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${typeStyle}`}>
                            {t(province.unit_type, { defaultValue: province.unit_type })}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{province.code}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-cyan-500 transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-slate-500" />
            {t('unitComposition')}
          </h3>
          <Card>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Landmark size={14} className="text-cyan-500" />
                    {t('provinces')}
                  </span>
                  <span className="text-slate-200 font-medium">{provinceCount}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-cyan-500"
                    style={{ width: `${totalUnits > 0 ? (provinceCount / totalUnits) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Building2 size={14} className="text-sky-500" />
                    {t('territories')}
                  </span>
                  <span className="text-slate-200 font-medium">{territoryCount}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${totalUnits > 0 ? (territoryCount / totalUnits) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                {t('unitCompositionDescription', { provinceCount, territoryCount })}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}