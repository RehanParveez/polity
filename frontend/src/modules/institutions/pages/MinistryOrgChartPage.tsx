import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {ChevronDown, Users, Network, UserCircle, Building2, Mail, Shield,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { institutionsService } from '../../../services/institutionsService'

export function MinistryOrgChartPage() {
  const { t } = useTranslation(['institutions', 'common'])
  const { ministryId } = useParams<{ ministryId: string }>()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['ministry', ministryId],
    queryFn: () => institutionsService.getMinistry(ministryId!),
    enabled: !!ministryId,
  })

  const totalDepartments = data?.departments?.length ?? 0
  const totalMembers = data?.departments?.reduce((s: number, d: any) => s + d.memberships.length, 0) ?? 0
  const avgMembersPerDept = totalDepartments > 0 ? totalMembers / totalDepartments : 0

  const chartData = data?.departments?.map((d: any) => ({
    name: d.name,
    members: d.memberships.length,
  })) ?? []

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (error || !data) return <p className="text-red-400">{t('couldNotLoad', { resource: t('ministry') })}</p>

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle={t('ministrySubtitle', { departments: totalDepartments, members: totalMembers, code: data.code })}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('departments')}
          value={totalDepartments.toString()}
        />
        <StatCard
          label={t('totalPersonnel')}
          value={totalMembers.toLocaleString()}
        />
        <StatCard
          label={t('avgPerDepartment')}
          value={avgMembersPerDept.toFixed(1)}
        />
        <StatCard
          label={t('ministryCode')}
          value={data.code}
        />
      </div>

      {chartData.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            {t('staffDistributionByDepartment')}
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                width={160}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: any) => {
                  const num = typeof value === 'number' ? value : Number(value) || 0
                  return [`${num} ${num === 1 ? t('member') : t('members')}`, '']
                }}
              />
              <Bar dataKey="members" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <Network size={16} className="text-slate-500" />
        {t('organizationalStructure')}
      </h3>

      <div className="flex flex-col items-center">
        <Card className="mb-3 px-8 py-4 text-center border-violet-500/30 bg-violet-500/5">
          <div className="flex items-center justify-center gap-2">
            <Shield size={18} className="text-violet-400" />
            <p className="font-semibold text-slate-100">{data.name}</p>
          </div>
          <p className="text-xs text-slate-500 uppercase mt-0.5">{data.code}</p>
          {data.description && (
            <p className="text-xs text-slate-400 mt-2 max-w-md">{data.description}</p>
          )}
        </Card>

        <div className="w-px h-8 bg-slate-700" />

        <div className="flex flex-wrap justify-center gap-6 pt-2 border-t border-slate-800 w-full max-w-5xl">
          {data.departments.map((dept: any) => (
            <div key={dept.id} className="flex flex-col items-center min-w-[240px]">
              <div className="w-px h-6 bg-slate-700 -mt-2" />
              <button
                onClick={() => setExpanded(expanded === dept.id ? null : dept.id)}
                className="text-left w-full"
              >
                <Card className="hover:border-violet-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-violet-400" />
                      <span className="font-medium text-slate-100 text-sm">{dept.name}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform ${expanded === dept.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <Users size={12} />
                    {dept.memberships.length} {dept.memberships.length === 1 ? t('member') : t('members')}
                  </div>
                </Card>
              </button>

              {expanded === dept.id && (
                <div className="mt-2 w-full space-y-1.5">
                  {dept.memberships.length === 0 ? (
                    <p className="text-xs text-slate-600 px-1">{t('noMembers')}</p>
                  ) : (
                    dept.memberships.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5"
                      >
                        <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <UserCircle size={16} className="text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 font-medium">{m.user.full_name}</p>
                          <p className="text-[10px] text-slate-500">{m.title}</p>
                        </div>
                        {m.user.email && (
                          <Mail size={12} className="text-slate-600 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}