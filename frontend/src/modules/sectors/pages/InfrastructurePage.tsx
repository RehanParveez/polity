import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {Construction, Ruler, Calendar, AlertTriangle, MapPin, Filter, TrendingUp, HardHat, Zap, Waves, Road, ChevronRight,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const TYPE_COLORS = ['#f59e0b', '#f97316', '#0ea5e9', '#78716c', '#ef4444', '#10b981']

const CONDITION_STYLES: Record<string, string> = {
  excellent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  good: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  fair: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  poor: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const CONDITION_ICONS: Record<string, any> = {
  excellent: Zap,
  good: Zap,
  fair: AlertTriangle,
  poor: AlertTriangle,
}

export function InfrastructurePage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-infrastructure'],
    queryFn: sectorsService.listInfrastructure,
  })

  const [typeFilter, setTypeFilter] = useState<string>('all')

  const totalAssets = data?.length ?? 0
  const totalCapacity = useMemo(
    () => data?.reduce((s: number, a: any) => s + (Number(a.length_km_or_capacity) || 0), 0) ?? 0,
    [data]
  )
  const avgAge = useMemo(() => {
    if (!data) return 0
    const currentYear = new Date().getFullYear()
    const assetsWithYear = data.filter((a: any) => a.year_constructed)
    if (assetsWithYear.length === 0) return 0
    return assetsWithYear.reduce((s: number, a: any) => s + (currentYear - Number(a.year_constructed)), 0) / assetsWithYear.length
  }, [data])
  const poorConditionCount = useMemo(
    () => data?.filter((a: any) => a.condition_rating === 'poor').length ?? 0,
    [data]
  )
  const poorConditionPct = totalAssets > 0 ? (poorConditionCount / totalAssets) * 100 : 0

  const typeSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { capacity: number; count: number }>()
    data.forEach((a: any) => {
      const t = a.asset_type.replace('_', ' ')
      const existing = map.get(t) ?? { capacity: 0, count: 0 }
      map.set(t, {
        capacity: existing.capacity + (Number(a.length_km_or_capacity) || 0),
        count: existing.count + 1,
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        capacity: Math.round(stats.capacity),
        count: stats.count,
      }))
      .sort((a, b) => b.capacity - a.capacity)
  }, [data])

  const districtSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { count: number; capacity: number; poor: number }>()
    data.forEach((a: any) => {
      const d = a.district?.name ?? t('sectors:infrastructure.unknownDistrict')
      const existing = map.get(d) ?? { count: 0, capacity: 0, poor: 0 }
      map.set(d, {
        count: existing.count + 1,
        capacity: existing.capacity + (Number(a.length_km_or_capacity) || 0),
        poor: existing.poor + (a.condition_rating === 'poor' ? 1 : 0),
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 4)
  }, [data, t])

  const uniqueTypes = useMemo(
    () => (data ? [...new Set(data.map((a: any) => a.asset_type.replace('_', ' ')))] : []),
    [data]
  )

  const filteredAssets = useMemo(() => {
    if (!data) return []
    return typeFilter === 'all'
      ? data
      : data.filter((a: any) => a.asset_type.replace('_', ' ') === typeFilter)
  }, [data, typeFilter])

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data || data.length === 0) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:infrastructure.title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('sectors:infrastructure.title')}
        subtitle={`${t('sectors:infrastructure.assets', { count: totalAssets })} · ${t('sectors:infrastructure.capacityUnits', { count: totalCapacity })} · ${t('sectors:infrastructure.needAttention', { count: poorConditionCount })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sectors:infrastructure.totalAssets')}
          value={totalAssets.toLocaleString()}
        />
        <StatCard
          label={t('sectors:infrastructure.totalCapacity')}
          value={totalCapacity.toLocaleString()}
          trend={{ value: t('sectors:infrastructure.yoy'), direction: 'up' }}
        />
        <StatCard
          label={t('sectors:infrastructure.averageAge')}
          value={`${avgAge.toFixed(0)} ${t('sectors:infrastructure.years')}`}
        />
        <StatCard
          label={t('sectors:infrastructure.needsAttention')}
          value={`${poorConditionPct.toFixed(0)}%`}
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" />
            {t('sectors:infrastructure.capacityByType')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('sectors:infrastructure.capacityLength')}</span>
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={typeSummary} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
              }}
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              formatter={(value: any) => {
                const num = typeof value === 'number' ? value : Number(value)
                return [num.toLocaleString(), '']
              }}
            />
            <Bar dataKey="capacity" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('sectors:infrastructure.capacity')} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            {t('sectors:infrastructure.districtOverview')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtSummary.map((d) => (
              <Card key={d.name} className="relative overflow-hidden group hover:border-amber-900/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Construction size={48} className="text-amber-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                      {t('sectors:infrastructure.assets', { count: d.count })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:infrastructure.capacity')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.capacity.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:infrastructure.poorCondition')}</p>
                      <p className={`text-lg font-semibold ${d.poor > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {d.poor}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {d.poor > 0 ? t('sectors:infrastructure.immediateRepair', { count: d.poor }) : t('sectors:infrastructure.acceptableCondition')}
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('sectors:infrastructure.assetType')}
          </h3>
          <Card className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:infrastructure.allTypes')}
              </button>
              {uniqueTypes.map((type: string) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    typeFilter === type
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{t('sectors:infrastructure.assetsByType')}</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={typeSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {typeSummary.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                  }}
                  formatter={(value: any) => {
                    const num = typeof value === 'number' ? value : Number(value)
                    return [t('sectors:infrastructure.assets', { count: num }), t('common:total')]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {typeSummary.slice(0, 4).map((typeItem, i) => (
                <div key={typeItem.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                    <span className="text-slate-400">{typeItem.name}</span>
                  </div>
                  <span className="text-slate-300">{typeItem.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <HardHat size={16} className="text-slate-500" />
          {t('sectors:infrastructure.assetDirectory')}
          {typeFilter !== 'all' && (
            <span className="text-xs text-slate-500">{t('sectors:infrastructure.filteredBy', { type: typeFilter })}</span>
          )}
        </h3>
        <span className="text-xs text-slate-500">{filteredAssets.length} {t('sectors:infrastructure.results')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAssets.map((asset: any) => {
          const condition = asset.condition_rating ?? 'unknown'
          const conditionStyle = CONDITION_STYLES[condition] ?? 'bg-slate-800 text-slate-400 border-slate-700'
          const ConditionIcon = CONDITION_ICONS[condition] ?? AlertTriangle
          const isPoor = condition === 'poor'
          const isOld = asset.year_constructed && (new Date().getFullYear() - Number(asset.year_constructed)) > 30

          return (
            <Card key={asset.id} className={`group hover:border-amber-900/40 transition-all ${isPoor ? 'border-red-900/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-100">{asset.name}</p>
                    {isPoor && <AlertTriangle size={14} className="text-red-400" />}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {asset.district?.name ?? t('sectors:infrastructure.unknownDistrict')}
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${conditionStyle}`}>
                  {t(`sectors:infrastructure.${condition}` as any) || condition}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Ruler size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:infrastructure.capacity')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {asset.length_km_or_capacity ?? '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:infrastructure.built')}</span>
                  </div>
                  <p className={`text-sm font-semibold ${isOld ? 'text-amber-400' : 'text-slate-200'}`}>
                    {asset.year_constructed ?? '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <ConditionIcon size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:infrastructure.age')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {asset.year_constructed
                      ? `${new Date().getFullYear() - Number(asset.year_constructed)} ${t('sectors:infrastructure.years')}`
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    {asset.asset_type.replace('_', ' ')}
                  </span>
                  {isOld && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
                      <Calendar size={10} />
                      {t('sectors:infrastructure.aging')}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">{asset.confidence}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}