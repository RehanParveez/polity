import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  HeartPulse, Bed, Stethoscope, Activity, MapPin, Filter, TrendingUp, AlertCircle, Building, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const TYPE_COLORS = ['#f43f5e', '#e11d48', '#fb7185', '#0ea5e9', '#f59e0b', '#10b981']

export function HealthcarePage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-healthcare'],
    queryFn: sectorsService.listHealthcare,
  })

  const [typeFilter, setTypeFilter] = useState<string>('all')

  const totalFacilities = data?.length ?? 0
  const totalBeds = useMemo(
    () => data?.reduce((s: number, f: any) => s + Number(f.bed_count), 0) ?? 0,
    [data]
  )
  const totalStaff = useMemo(
    () => data?.reduce((s: number, f: any) => s + Number(f.staff_count), 0) ?? 0,
    [data]
  )
  const totalCapacity = useMemo(
    () => data?.reduce((s: number, f: any) => s + Number(f.daily_patient_capacity), 0) ?? 0,
    [data]
  )
  const activeCount = useMemo(
    () => data?.filter((f: any) => f.status === 'active').length ?? 0,
    [data]
  )
  const activePct = totalFacilities > 0 ? (activeCount / totalFacilities) * 100 : 0

  const typeSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { beds: number; staff: number; capacity: number; count: number }>()
    data.forEach((f: any) => {
      const facType = f.facility_type.replace('_', ' ')
      const existing = map.get(facType) ?? { beds: 0, staff: 0, capacity: 0, count: 0 }
      map.set(facType, {
        beds: existing.beds + Number(f.bed_count),
        staff: existing.staff + Number(f.staff_count),
        capacity: existing.capacity + Number(f.daily_patient_capacity),
        count: existing.count + 1,
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        beds: Math.round(stats.beds),
        staff: Math.round(stats.staff),
        capacity: Math.round(stats.capacity),
        count: stats.count,
      }))
      .sort((a, b) => b.beds - a.beds)
  }, [data])

  const districtSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { count: number; beds: number; staff: number; capacity: number }>()
    data.forEach((f: any) => {
      const d = f.district?.name ?? t('sectors:healthcare.unknownDistrict')
      const existing = map.get(d) ?? { count: 0, beds: 0, staff: 0, capacity: 0 }
      map.set(d, {
        count: existing.count + 1,
        beds: existing.beds + Number(f.bed_count),
        staff: existing.staff + Number(f.staff_count),
        capacity: existing.capacity + Number(f.daily_patient_capacity),
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.beds - a.beds)
      .slice(0, 4)
  }, [data, t])

  const uniqueTypes = useMemo(
    () => (data ? [...new Set(data.map((f: any) => f.facility_type.replace('_', ' ')))] : []),
    [data]
  )

  const filteredFacilities = useMemo(() => {
    if (!data) return []
    return typeFilter === 'all'
      ? data
      : data.filter((f: any) => f.facility_type.replace('_', ' ') === typeFilter)
  }, [data, typeFilter])

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data || data.length === 0) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:healthcare.title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('sectors:healthcare.title')}
        subtitle={`${totalFacilities.toLocaleString()} ${t('sectors:healthcare.facilities')} · ${totalBeds.toLocaleString()} ${t('sectors:healthcare.beds')} · ${activePct.toFixed(0)}% ${t('sectors:healthcare.active')}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sectors:healthcare.totalFacilities')}
          value={totalFacilities.toLocaleString()}
        />
        <StatCard
          label={t('sectors:healthcare.totalBeds')}
          value={totalBeds.toLocaleString()}
          trend={{ value: t('sectors:healthcare.yoy'), direction: 'up' }}
        />
        <StatCard
          label={t('sectors:healthcare.medicalStaff')}
          value={totalStaff.toLocaleString()}
        />
        <StatCard
          label={t('sectors:healthcare.dailyCapacity')}
          value={`${(totalCapacity / 1000).toFixed(1)}K`}
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" />
            {t('sectors:healthcare.capacityByType')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('sectors:healthcare.beds')}</span>
            <div className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-xs text-slate-500 ml-2">{t('sectors:healthcare.staff')}</span>
            <div className="w-3 h-3 rounded-sm bg-pink-500/60" />
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
            <Bar dataKey="beds" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t('sectors:healthcare.beds')} />
            <Bar dataKey="staff" fill="#fb7185" radius={[4, 4, 0, 0]} opacity={0.6} name={t('sectors:healthcare.staff')} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            {t('sectors:healthcare.districtOverview')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtSummary.map((d) => (
              <Card key={d.name} className="relative overflow-hidden group hover:border-rose-900/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building size={48} className="text-rose-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                      {d.count} {t('sectors:healthcare.facilities')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:healthcare.beds')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.beds.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:healthcare.staff')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.staff.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:healthcare.capacity')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.capacity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t('sectors:healthcare.staffBedRatio')}: {d.beds > 0 ? (d.staff / d.beds).toFixed(1) : '—'}
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-rose-500 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('sectors:healthcare.facilityType')}
          </h3>
          <Card className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:healthcare.allTypes')}
              </button>
              {uniqueTypes.map((type: string) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    typeFilter === type
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{t('sectors:healthcare.facilitiesByType')}</h4>
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
                    return [`${num.toLocaleString()} ${t('sectors:healthcare.facilities')}`, t('common:total')]
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
          <HeartPulse size={16} className="text-slate-500" />
          {t('sectors:healthcare.facilityDirectory')}
          {typeFilter !== 'all' && (
            <span className="text-xs text-slate-500">{t('sectors:healthcare.filteredBy', { type: typeFilter })}</span>
          )}
        </h3>
        <span className="text-xs text-slate-500">{filteredFacilities.length} {t('sectors:healthcare.results')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFacilities.map((fac: any) => {
          const staffBedRatio = Number(fac.bed_count) > 0
            ? Number(fac.staff_count) / Number(fac.bed_count)
            : 0
          const isWellStaffed = staffBedRatio >= 0.5

          return (
            <Card key={fac.id} className="group hover:border-rose-900/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-100">{fac.name}</p>
                    {isWellStaffed && <HeartPulse size={14} className="text-rose-400" />}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {fac.district?.name ?? t('sectors:healthcare.unknownDistrict')}
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                  fac.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {t(`common:statuses.${fac.status}` as any) || fac.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Bed size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:healthcare.beds')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(fac.bed_count).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Stethoscope size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:healthcare.staff')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(fac.staff_count).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:healthcare.dailyShort')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(fac.daily_patient_capacity).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                    {fac.facility_type.replace('_', ' ')}
                  </span>
                  {!isWellStaffed && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
                      <AlertCircle size={10} />
                      {t('sectors:healthcare.understaffed')}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">{fac.confidence}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}