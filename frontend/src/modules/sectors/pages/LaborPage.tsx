import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {Briefcase, Users, TrendingDown, Banknote, MapPin, Filter, TrendingUp, AlertTriangle, ShieldCheck, ChevronRight,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const RISK_COLORS = ['#06b6d4', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981']

export function LaborPage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-labor'],
    queryFn: sectorsService.listLabor,
  })

  const [riskFilter, setRiskFilter] = useState<string>('all')

  const totalWorkforce = useMemo(
    () => data?.reduce((s: number, r: any) => s + Number(r.total_workforce), 0) ?? 0,
    [data]
  )
  const totalUnemployed = useMemo(
    () => data?.reduce((s: number, r: any) => s + Number(r.unemployed_count), 0) ?? 0,
    [data]
  )
  const overallUnemploymentRate = totalWorkforce > 0 ? (totalUnemployed / totalWorkforce) * 100 : 0
  const avgMinWage = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.reduce((s: number, r: any) => s + Number(r.minimum_wage_pkr), 0) / data.length
  }, [data])
  const highRiskDistricts = useMemo(
    () => data?.filter((r: any) => Number(r.unemployment_rate_pct) > 20).length ?? 0,
    [data]
  )

  const districtChartData = useMemo(() => {
    if (!data) return []
    return [...data]
      .sort((a: any, b: any) => Number(b.total_workforce) - Number(a.total_workforce))
      .slice(0, 8)
      .map((r: any) => ({
        name: r.district?.name ?? t('sectors:labor.unknownDistrict'),
        workforce: Number(r.total_workforce),
        unemployed: Number(r.unemployed_count),
        rate: Number(r.unemployment_rate_pct),
      }))
  }, [data, t])

  const districtSummary = useMemo(() => {
    if (!data) return []
    return [...data]
      .sort((a: any, b: any) => Number(b.total_workforce) - Number(a.total_workforce))
      .slice(0, 4)
      .map((r: any) => ({
        name: r.district?.name ?? t('sectors:labor.unknownDistrict'),
        workforce: Number(r.total_workforce),
        unemployed: Number(r.unemployed_count),
        rate: Number(r.unemployment_rate_pct),
        wage: Number(r.minimum_wage_pkr),
      }))
  }, [data, t])

  const workforceDistribution = useMemo(() => {
    if (!data) return []
    return [...data]
      .sort((a: any, b: any) => Number(b.total_workforce) - Number(a.total_workforce))
      .slice(0, 5)
      .map((r: any) => ({
        name: r.district?.name ?? t('sectors:labor.unknownDistrict'),
        value: Number(r.total_workforce),
      }))
  }, [data, t])

  const filteredRecords = useMemo(() => {
    if (!data) return []
    if (riskFilter === 'all') return data
    if (riskFilter === 'high') return data.filter((r: any) => Number(r.unemployment_rate_pct) > 20)
    if (riskFilter === 'moderate') return data.filter((r: any) => {
      const rate = Number(r.unemployment_rate_pct)
      return rate >= 10 && rate <= 20
    })
    if (riskFilter === 'low') return data.filter((r: any) => Number(r.unemployment_rate_pct) < 10)
    return data
  }, [data, riskFilter])

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data || data.length === 0) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:labor.title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('sectors:labor.title')}
        subtitle={`${t('sectors:labor.districts', { count: data.length.toLocaleString() })} · ${t('sectors:labor.workforce', { count: totalWorkforce.toLocaleString() })} · ${t('sectors:labor.highRiskDistricts', { count: highRiskDistricts })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sectors:labor.totalWorkforce')}
          value={totalWorkforce.toLocaleString()}
        />
        <StatCard
          label={t('sectors:labor.unemployed')}
          value={totalUnemployed.toLocaleString()}
          trend={{ value: `${overallUnemploymentRate.toFixed(1)}% ${t('sectors:labor.rate')}`, direction: overallUnemploymentRate > 15 ? 'down' : 'up' }}
        />
        <StatCard
          label={t('sectors:labor.avgMinimumWage')}
          value={`PKR ${Math.round(avgMinWage).toLocaleString()}`}
        />
        <StatCard
          label={t('sectors:labor.highRiskDistrictsLabel')}
          value={highRiskDistricts.toString()}
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" />
            {t('sectors:labor.workforceVsUnemployed')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('sectors:labor.workforceLabel')}</span>
            <div className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span className="text-xs text-slate-500 ml-2">{t('sectors:labor.unemployed')}</span>
            <div className="w-3 h-3 rounded-sm bg-sky-500/60" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={districtChartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
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
            <Bar dataKey="workforce" fill="#06b6d4" radius={[4, 4, 0, 0]} name={t('sectors:labor.workforceLabel')} />
            <Bar dataKey="unemployed" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.6} name={t('sectors:labor.unemployed')} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            {t('sectors:labor.districtOverview')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtSummary.map((d) => {
              const isHighRisk = d.rate > 20
              return (
                <Card key={d.name} className={`relative overflow-hidden group hover:border-cyan-900/50 transition-colors ${isHighRisk ? 'border-red-900/30' : ''}`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Briefcase size={48} className="text-cyan-500" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-100">{d.name}</p>
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        isHighRisk
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {d.rate}% {t('sectors:labor.unemployed')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-500">{t('sectors:labor.workforceLabel')}</p>
                        <p className="text-lg font-semibold text-slate-200">
                          {d.workforce.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{t('sectors:labor.unemployed')}</p>
                        <p className={`text-lg font-semibold ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>
                          {d.unemployed.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {t('sectors:labor.minWage')}: PKR {d.wage.toLocaleString()}
                      </span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('sectors:labor.riskFilter')}
          </h3>
          <Card className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRiskFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  riskFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:labor.allDistricts')}
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  riskFilter === 'high'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:labor.highRisk')}
              </button>
              <button
                onClick={() => setRiskFilter('moderate')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  riskFilter === 'moderate'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:labor.moderate')}
              </button>
              <button
                onClick={() => setRiskFilter('low')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  riskFilter === 'low'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:labor.lowRisk')}
              </button>
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{t('sectors:labor.workforceShare')}</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={workforceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {workforceDistribution.map((_: any, i: number) => (
                    <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />
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
                    return [`${num.toLocaleString()} ${t('sectors:labor.workforceLabel')}`, t('sectors:labor.workforceLabel')]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {workforceDistribution.map((d: any, i: number) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[i % RISK_COLORS.length] }} />
                    <span className="text-slate-400">{d.name}</span>
                  </div>
                  <span className="text-slate-300">{(d.value / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          {t('sectors:labor.districtDirectory')}
          {riskFilter !== 'all' && (
            <span className="text-xs text-slate-500">
              {t('sectors:labor.filteredBy', {
                risk: riskFilter === 'high'
                  ? t('sectors:labor.highRisk')
                  : riskFilter === 'moderate'
                  ? t('sectors:labor.moderate')
                  : t('sectors:labor.lowRisk')
              })}
            </span>
          )}
        </h3>
        <span className="text-xs text-slate-500">{filteredRecords.length} {t('sectors:labor.results')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRecords.map((rec: any) => {
          const rate = Number(rec.unemployment_rate_pct)
          const isHighRisk = rate > 20
          const isLowRisk = rate < 10

          return (
            <Card key={rec.id} className={`group hover:border-cyan-900/40 transition-all ${isHighRisk ? 'border-red-900/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-100">{rec.district?.name}</p>
                    {isHighRisk && <AlertTriangle size={14} className="text-red-400" />}
                    {isLowRisk && <ShieldCheck size={14} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.as_of_date}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${
                  isHighRisk
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : isLowRisk
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {rate}% {t('sectors:labor.unemployed')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Users size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:labor.workforceLabel')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(rec.total_workforce).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:labor.unemployed')}</span>
                  </div>
                  <p className={`text-sm font-semibold ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>
                    {Number(rec.unemployed_count).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Banknote size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:labor.minWage')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(rec.minimum_wage_pkr).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  {rec.dominant_sectors && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {rec.dominant_sectors}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">{rec.confidence}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}