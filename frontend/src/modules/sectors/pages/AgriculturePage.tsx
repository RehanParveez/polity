import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {Wheat, Droplets, Scale, Sprout, Tractor, Sun, MapPin, TrendingUp, AlertTriangle, Filter, ChevronRight, ArrowUpRight,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const CROP_COLORS = ['#22c55e', '#eab308', '#f97316', '#0ea5e9', '#a855f7', '#ef4444']

export function AgriculturePage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-agriculture'],
    queryFn: sectorsService.listAgriculture,
  })

  const [cropFilter, setCropFilter] = useState<string>('all')

  const totalFarms = data?.length ?? 0
  const totalArea = useMemo(
    () => data?.reduce((s: number, f: any) => s + Number(f.area_hectares), 0) ?? 0,
    [data]
  )
  const totalYield = useMemo(
    () => data?.reduce((s: number, f: any) => s + Number(f.annual_yield_tons), 0) ?? 0,
    [data]
  )
  const avgYieldPerHa = totalArea > 0 ? totalYield / totalArea : 0

  const irrigatedCount = useMemo(
    () => data?.filter((f: any) => f.irrigation_type !== 'rainfed').length ?? 0,
    [data]
  )
  const irrigatedPct = totalFarms > 0 ? (irrigatedCount / totalFarms) * 100 : 0

  const cropSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { area: number; yield: number; farms: number }>()
    data.forEach((f: any) => {
      const existing = map.get(f.primary_crop) ?? { area: 0, yield: 0, farms: 0 }
      map.set(f.primary_crop, {
        area: existing.area + Number(f.area_hectares),
        yield: existing.yield + Number(f.annual_yield_tons),
        farms: existing.farms + 1,
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        area: Math.round(stats.area),
        yield: Math.round(stats.yield),
        farms: stats.farms,
        efficiency: stats.area > 0 ? +(stats.yield / stats.area).toFixed(2) : 0,
      }))
      .sort((a, b) => b.yield - a.yield)
  }, [data])

  const districtSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { farms: number; area: number; yield: number }>()
    data.forEach((f: any) => {
      const d = f.district?.name ?? t('sectors:agriculture.unknownDistrict')
      const existing = map.get(d) ?? { farms: 0, area: 0, yield: 0 }
      map.set(d, {
        farms: existing.farms + 1,
        area: existing.area + Number(f.area_hectares),
        yield: existing.yield + Number(f.annual_yield_tons),
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 4)
  }, [data, t])

  const uniqueCrops = useMemo(
    () => (data ? [...new Set(data.map((f: any) => f.primary_crop))] : []),
    [data]
  )

  const filteredFarms = useMemo(() => {
    if (!data) return []
    return cropFilter === 'all'
      ? data
      : data.filter((f: any) => f.primary_crop === cropFilter)
  }, [data, cropFilter])

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data || data.length === 0) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:agriculture.title') })}</p>

  const yieldColor =
    avgYieldPerHa >= 4 ? 'text-emerald-400' : avgYieldPerHa >= 2.5 ? 'text-amber-400' : 'text-red-400'

  return (
    <div>
      <PageHeader
        title={t('sectors:agriculture.title')}
        subtitle={`${t('sectors:agriculture.registeredFarms', { count: totalFarms })} · ${t('sectors:agriculture.hectares', { count: totalArea })} · ${t('sectors:agriculture.lastUpdated', { date: data[0]?.as_of_date ?? '—' })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sectors:agriculture.totalCultivatedArea')}
          value={`${(totalArea / 1000).toFixed(1)}K ha`}
        />
        <StatCard
          label={t('sectors:agriculture.annualProduction')}
          value={`${(totalYield / 1000).toFixed(1)}K t`}
          trend={{ value: t('sectors:agriculture.vsLastSeason'), direction: 'up' }}
        />
        <StatCard
          label={t('sectors:agriculture.yieldEfficiency')}
          value={`${avgYieldPerHa.toFixed(1)} ${t('sectors:agriculture.efficiencyUnit')}`}
        />
        <StatCard
          label={t('sectors:agriculture.irrigatedFarms')}
          value={`${irrigatedPct.toFixed(0)}%`}
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Sprout size={16} className="text-slate-500" />
            {t('sectors:agriculture.yieldPerformance')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('sectors:agriculture.areaHa')}</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2">{t('sectors:agriculture.yieldTons')}</span>
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cropSummary} barGap={4}>
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
            <Bar dataKey="area" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.6} name={t('sectors:agriculture.areaHa')} />
            <Bar dataKey="yield" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('sectors:agriculture.yieldTons')} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            {t('sectors:agriculture.districtOverview')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtSummary.map((d) => (
              <Card key={d.name} className="relative overflow-hidden group hover:border-emerald-900/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Tractor size={48} className="text-emerald-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      {d.farms} {t('sectors:agriculture.farms')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:agriculture.area')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.area.toLocaleString()} <span className="text-xs font-normal text-slate-500">ha</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:agriculture.yield')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.yield.toLocaleString()} <span className="text-xs font-normal text-slate-500">t</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t('sectors:agriculture.efficiency')}: {(d.yield / d.area).toFixed(1)} {t('sectors:agriculture.efficiencyUnit')}
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('sectors:agriculture.cropFilter')}
          </h3>
          <Card className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCropFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  cropFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:agriculture.allCrops')}
              </button>
              {uniqueCrops.map((crop: string) => (
                <button
                  key={crop}
                  onClick={() => setCropFilter(crop)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    cropFilter === crop
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{t('sectors:agriculture.landUse')}</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={cropSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="area"
                >
                  {cropSummary.map((_, i) => (
                    <Cell key={i} fill={CROP_COLORS[i % CROP_COLORS.length]} />
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
                    return [`${num.toLocaleString()} ha`, t('sectors:agriculture.area')]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {cropSummary.slice(0, 4).map((crop, i) => (
                <div key={crop.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CROP_COLORS[i % CROP_COLORS.length] }} />
                    <span className="text-slate-400">{crop.name}</span>
                  </div>
                  <span className="text-slate-300">{crop.area.toLocaleString()} ha</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Tractor size={16} className="text-slate-500" />
          {t('sectors:agriculture.farmDirectory')}
          {cropFilter !== 'all' && (
            <span className="text-xs text-slate-500">{t('sectors:agriculture.filteredBy', { crop: cropFilter })}</span>
          )}
        </h3>
        <span className="text-xs text-slate-500">{filteredFarms.length} {t('sectors:agriculture.results')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFarms.map((farm: any) => {
          const yieldEff = Number(farm.annual_yield_tons) / Number(farm.area_hectares)
          const isHighYield = yieldEff >= 4
          const isLowIrrigation = farm.irrigation_type === 'rainfed'

          return (
            <Card key={farm.id} className="group hover:border-emerald-900/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-100">{farm.name}</p>
                    {isHighYield && <ArrowUpRight size={14} className="text-emerald-500" />}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {farm.district?.name ?? t('sectors:agriculture.unknownDistrict')}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/20">
                  {farm.primary_crop}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Scale size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:agriculture.area')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(farm.area_hectares).toLocaleString()}
                    <span className="text-[10px] font-normal text-slate-500 ml-0.5">ha</span>
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Wheat size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:agriculture.yield')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(farm.annual_yield_tons).toLocaleString()}
                    <span className="text-[10px] font-normal text-slate-500 ml-0.5">t</span>
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:agriculture.efficiencyShort')}</span>
                  </div>
                  <p className={`text-sm font-semibold ${yieldEff >= 4 ? 'text-emerald-400' : yieldEff >= 2.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {yieldEff.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                    isLowIrrigation ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                  }`}>
                    {isLowIrrigation ? <Sun size={10} /> : <Droplets size={10} />}
                    {farm.irrigation_type.replace('_', ' ')}
                  </div>
                  {isLowIrrigation && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
                      <AlertTriangle size={10} />
                      {t('sectors:agriculture.rainfed')}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">{farm.confidence}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}