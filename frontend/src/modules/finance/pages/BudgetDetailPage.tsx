import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {PieChart as PieChartIcon, Wallet, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { financeService } from '../../../services/financeService'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function BudgetDetailPage() {
  const { budgetId } = useParams<{ budgetId: string }>()
  const { t } = useTranslation('finance')
  const { data, isLoading } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => financeService.getBudget(budgetId!),
    enabled: !!budgetId,
  })

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (!data) return <p className="text-red-400">Could not load budget.</p>

  const pieData = data.lines.map((line) => ({
    name: line.category,
    value: Number(line.allocated_amount),
  }))

  const totalAmount = Number(data.total_amount)
  const totalAllocated = Number(data.total_allocated)
  const remaining = Number(data.remaining)
  const overAllocated = totalAllocated > totalAmount
  const utilizationPct = totalAmount > 0 ? (totalAllocated / totalAmount) * 100 : 0
  const totalSpent = data.lines.reduce((acc, line) => acc + Number(line.spent_amount), 0)

  return (
    <div>
      <PageHeader
        title={data.ministry_name ?? 'Federal Budget'}
        subtitle={`${t('budgets.fiscalYear')} ${data.fiscal_year} · ${data.status}`}
      />

      {overAllocated && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Budget over-allocated</p>
            <p className="text-xs text-slate-500">
              Allocations exceed approved budget by PKR {((totalAllocated - totalAmount) / 1e9).toFixed(1)}B
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('budgets.total')}
          value={`PKR ${(totalAmount / 1e9).toFixed(1)}B`}
        />
        <StatCard
          label={t('budgets.allocated')}
          value={`PKR ${(totalAllocated / 1e9).toFixed(1)}B`}
          trend={{
            value: `${((totalAllocated / totalAmount) * 100).toFixed(0)}% of total`,
            direction: overAllocated ? 'down' : 'up',
          }}
        />
        <StatCard
          label={t('budgets.remaining')}
          value={`PKR ${(remaining / 1e9).toFixed(1)}B`}
          trend={{
            value: overAllocated ? t('budgets.validationOver') : t('budgets.validationOk'),
            direction: overAllocated ? 'down' : 'up',
          }}
        />
        <StatCard
          label="Utilization rate"
          value={`${utilizationPct.toFixed(1)}%`}
          trend={{
            value: overAllocated ? 'Over budget' : `${(100 - utilizationPct).toFixed(1)}% unused`,
            direction: overAllocated ? 'down' : 'up',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {pieData.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-400" />
              {t('budgets.linesTitle')}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 8 }}
                 formatter={(value: any) => {
                   const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) || 0 : 0
                return [`PKR ${(num / 1e9).toFixed(2)}B`, '']
                 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Budget overview
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Allocation usage</span>
                <span className="text-slate-100 font-medium">{utilizationPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${overAllocated ? 'bg-red-500' : utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Budget health</p>
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${overAllocated ? 'bg-red-500/10 text-red-400' : utilizationPct > 80 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {overAllocated ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                {overAllocated ? 'Over-allocated' : utilizationPct > 80 ? 'Nearing limit' : 'Healthy'}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Categories</span>
                <span className="text-slate-200 font-medium">{data.lines.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total approved</span>
                <span className="text-slate-200">PKR {(totalAmount / 1e9).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total allocated</span>
                <span className={overAllocated ? 'text-red-400 font-medium' : 'text-slate-200 font-medium'}>
                  PKR {(totalAllocated / 1e9).toFixed(1)}B
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total spent</span>
                <span className="text-slate-200">PKR {(totalSpent / 1e9).toFixed(1)}B</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Wallet size={16} className="text-emerald-400" />
          {t('budgets.linesTitle')}
        </h3>

        {data.lines.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
            <DollarSign size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No budget lines configured.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4">{t('budgets.category')}</th>
                  <th className="pb-2 pr-4">{t('budgets.allocated')}</th>
                  <th className="pb-2 pr-4">{t('budgets.spent')}</th>
                  <th className="pb-2 pr-4">{t('budgets.remaining')}</th>
                  <th className="pb-2">Usage</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => {
                  const allocated = Number(line.allocated_amount)
                  const spent = Number(line.spent_amount)
                  const lineRemaining = allocated - spent
                  const usagePct = allocated > 0 ? (spent / allocated) * 100 : 0
                  const isOver = lineRemaining < 0

                  return (
                    <tr key={line.id} className="border-b border-slate-900">
                      <td className="py-3 pr-4">
                        <p className="text-slate-200 font-medium">{line.category}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">PKR {(allocated / 1e9).toFixed(1)}B</td>
                      <td className="py-3 pr-4 text-slate-400">PKR {(spent / 1e9).toFixed(1)}B</td>
                      <td className={`py-3 pr-4 font-medium ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                        PKR {(Math.abs(lineRemaining) / 1e9).toFixed(1)}B
                      </td>
                      <td className="py-3 w-36">
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${isOver ? 'bg-red-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">{usagePct.toFixed(0)}%</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}