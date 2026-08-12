import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  MapPin, Users, BookOpen, Building2, Trees, Mountain,
  ChevronRight, Layers,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { geographyService } from '../../../services/geographyService'

const DEMO_COLORS = ['#06b6d4', '#0ea5e9', '#14b8a6', '#8b5cf6']

export function DistrictDetailPage() {
  const { districtId } = useParams<{ districtId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['district', districtId],
    queryFn: () => geographyService.getDistrict(districtId!),
    enabled: !!districtId,
  })

  const ruralPct = useMemo(() => {
    if (!data?.demographic_profile) return 0
    return 100 - Number(data.demographic_profile.urban_pct)
  }, [data])

  const urbanRuralData = useMemo(() => {
    if (!data?.demographic_profile) return []
    const urban = Number(data.demographic_profile.urban_pct)
    return [
      { name: 'Urban', value: urban },
      { name: 'Rural', value: 100 - urban },
    ]
  }, [data])

  const literacyData = useMemo(() => {
    if (!data?.demographic_profile) return []
    const lit = Number(data.demographic_profile.literacy_rate_pct)
    return [
      { name: 'Literate', value: lit },
      { name: 'Non-literate', value: 100 - lit },
    ]
  }, [data])

  const populationBreakdown = useMemo(() => {
    if (!data?.demographic_profile) return []
    const pop = Number(data.demographic_profile.population)
    const urban = Math.round(pop * (Number(data.demographic_profile.urban_pct) / 100))
    return [
      { name: 'Urban residents', value: urban },
      { name: 'Rural residents', value: pop - urban },
    ]
  }, [data])

  if (isLoading) return <p className="text-slate-400">Loading district profile…</p>
  if (error || !data) return <p className="text-red-400">Could not load district.</p>

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle={`${data.tehsils.length} tehsils · Regional demographic profile`}
      />

      {data.demographic_profile ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total population"
              value={data.demographic_profile.population.toLocaleString()}
            />
            <StatCard
              label="Literacy rate"
              value={`${data.demographic_profile.literacy_rate_pct}%`}
            />
            <StatCard
              label="Urban share"
              value={`${data.demographic_profile.urban_pct}%`}
            />
            <StatCard
              label="Rural share"
              value={`${ruralPct.toFixed(1)}%`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Users size={16} className="text-slate-500" />
                Population composition
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={populationBreakdown} barGap={8}>
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
                    formatter={(value: any) => {
                      const num = typeof value === 'number' ? value : Number(value)
                      return [num.toLocaleString(), 'Residents']
                    }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-slate-500" />
                  Urban / Rural split
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={urbanRuralData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {urbanRuralData.map((_, i) => (
                        <Cell key={i} fill={DEMO_COLORS[i % DEMO_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                      }}
                      formatter={(value: any) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-1">
                  {urbanRuralData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEMO_COLORS[i % DEMO_COLORS.length] }} />
                      {entry.name} ({entry.value}%)
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-slate-500" />
                  Literacy breakdown
                </h3>
                <div className="space-y-3">
                  {literacyData.map((item, i) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-slate-200 font-medium">{item.value}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(item.value, 100)}%`,
                            backgroundColor: DEMO_COLORS[i % DEMO_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-6">
            Source: {data.demographic_profile.source} · as of {data.demographic_profile.as_of_date} · confidence:{' '}
            {data.demographic_profile.confidence}
          </p>
        </>
      ) : (
        <Card className="mb-6 border-dashed border-slate-700">
          <div className="flex items-center gap-3 py-4">
            <MapPin size={20} className="text-slate-600" />
            <p className="text-sm text-slate-500">No demographic profile on record for this district yet.</p>
          </div>
        </Card>
      )}

      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <Layers size={16} className="text-slate-500" />
        Administrative subdivisions
        <span className="text-xs text-slate-500">({data.tehsils.length} tehsils)</span>
      </h3>

      {data.tehsils.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 py-2">No tehsils on record yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.tehsils.map((t) => (
            <Card key={t.id} className="group hover:border-cyan-900/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Mountain size={20} className="text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">Tehsil · {data.name}</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-500 transition-colors shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}