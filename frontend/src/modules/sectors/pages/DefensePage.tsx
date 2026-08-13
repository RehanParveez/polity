import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Shield, Users, Banknote, ShoppingCart, Truck, Activity, ChevronDown, Swords,
} from 'lucide-react'
import { useState } from 'react'
import {Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function DefensePage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-defense'],
    queryFn: sectorsService.getDefense,
  })
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:defense.title') })}</p>

  const budgetPie = data.budgets[0]
    ? [
        { name: t('sectors:defense.budgetPersonnel'), value: Number(data.budgets[0].personnel_allocation_pct) },
        { name: t('sectors:defense.budgetEquipment'), value: Number(data.budgets[0].equipment_allocation_pct) },
        { name: t('sectors:defense.budgetInfrastructure'), value: Number(data.budgets[0].infrastructure_allocation_pct) },
        { name: t('sectors:defense.budgetResearch'), value: Number(data.budgets[0].research_allocation_pct) },
      ]
    : []

  return (
    <div>
      <PageHeader
        title={t('sectors:defense.title')}
        subtitle={`${t('sectors:defense.personnel', { count: data.total_personnel_summary })} · ${t('sectors:defense.civilianOversight', { status: data.civilian_oversight_status })}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('sectors:defense.totalPersonnel')} value={data.total_personnel_summary.toLocaleString()} />
        <StatCard label={t('sectors:defense.annualBudget')} value={`PKR ${(Number(data.annual_budget_summary) / 1e9).toFixed(0)}B`} />
        <StatCard label={t('sectors:defense.trainingCompletion')} value={`${data.training_completion_pct}%`} trend={{ value: t('sectors:defense.target'), direction: 'up' }} />
        <StatCard label={t('sectors:defense.branches')} value={String(data.branches.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Swords size={16} className="text-slate-500" />
            {t('sectors:defense.branchesAndPersonnel')}
          </h3>
          <div className="space-y-3">
            {data.branches.map((branch) => (
              <div key={branch.id} className="border border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedBranch(expandedBranch === branch.id ? null : branch.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">{branch.branch_name}</p>
                    <p className="text-xs text-slate-500">{t('sectors:defense.personnelCount', { count: branch.personnel_count })} · {t('sectors:defense.activeOperations', { count: branch.active_operations_count })}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${expandedBranch === branch.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedBranch === branch.id && (
                  <div className="px-4 pb-3 border-t border-slate-800">
                    <div className="mt-3 space-y-2">
                      {branch.personnel.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-slate-400 capitalize">{p.rank_category.replace('_', ' ')}</span>
                          <span className="text-slate-200">{p.count.toLocaleString()} ({p.women_count.toLocaleString()} {t('sectors:defense.women')})</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {t('sectors:defense.trainingCompletionPct', { pct: branch.training_completion_pct })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {budgetPie.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Banknote size={16} className="text-slate-500" />
              {t('sectors:defense.budgetAllocation', { year: data.budgets[0].fiscal_year })}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={budgetPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {budgetPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {budgetPie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {entry.name} ({entry.value}%)
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Card className="mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <ShoppingCart size={16} className="text-slate-500" />
          {t('sectors:defense.procurementProjects')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-2 pr-4">{t('sectors:defense.project')}</th>
                <th className="pb-2 pr-4">{t('common:status')}</th>
                <th className="pb-2 pr-4">{t('sectors:defense.budget')}</th>
                <th className="pb-2">{t('sectors:defense.vendor')}</th>
              </tr>
            </thead>
            <tbody>
              {data.procurements.map((p) => (
                <tr key={p.id} className="border-b border-slate-900">
                  <td className="py-2 pr-4 text-slate-300">
                    <p className="font-medium">{p.title}</p>
                    {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                      p.status === 'awarded' ? 'bg-teal-500/10 text-teal-400' :
                      p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'tendered' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {t(`common:statuses.${p.status}` as any) || p.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">PKR {(Number(p.budget_estimate) / 1e9).toFixed(1)}B</td>
                  <td className="py-2 text-slate-400">{p.vendor_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Truck size={16} className="text-slate-500" />
            {t('sectors:defense.disasterResponseUnits')}
          </h3>
          <div className="space-y-3">
            {data.disaster_units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between border-b border-slate-900 pb-2 last:border-0">
                <div>
                  <p className="text-sm text-slate-200">{unit.unit_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{unit.unit_type.replace('_', ' ')} · {unit.district?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-200">{t('sectors:defense.ready', { pct: unit.readiness_pct })}</p>
                  <p className="text-xs text-slate-500">{t('sectors:defense.personnelAndEquipment', { personnel: unit.personnel_count, equipment: unit.equipment_count })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            {t('sectors:defense.keyIndicators')}
          </h3>
          <div className="space-y-4">
            {data.indicators.map((ind) => (
              <div key={ind.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{ind.indicator_name}</span>
                  <span className="text-slate-100 font-medium">{ind.value}{ind.unit}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-teal-400"
                    style={{ width: `${Math.min(Number(ind.value), 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{t('sectors:defense.confidence', { confidence: ind.confidence, date: ind.as_of_date })}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}