import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { financeService } from '../../../services/financeService'

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e']

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

  const budgetTooltipFormatter: TooltipProps['formatter'] = (
  value, name, item, index, payload,
) => {
  if (value == null) return ''
  const num = typeof value === 'number' ? value : Number(value)
  return `PKR ${(num / 1e9).toFixed(2)}B`
}
  const overAllocated = Number(data.total_allocated) > Number(data.total_amount)

  return (
    <div>
      <PageHeader
        title={data.ministry_name ?? 'Federal Budget'}
        subtitle={`${t('budgets.fiscalYear')} ${data.fiscal_year} · ${data.status}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label={t('budgets.total')} value={`PKR ${(Number(data.total_amount) / 1e9).toFixed(1)}B`} />
        <StatCard label={t('budgets.allocated')} value={`PKR ${(Number(data.total_allocated) / 1e9).toFixed(1)}B`} />
        <StatCard
          label={t('budgets.remaining')}
          value={`PKR ${(Number(data.remaining) / 1e9).toFixed(1)}B`}
          trend={overAllocated ? { value: t('budgets.validationOver'), direction: 'down' } : { value: t('budgets.validationOk'), direction: 'up' }}
        />
      </div>

      {pieData.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t('budgets.linesTitle')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  formatter={budgetTooltipFormatter}
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
        <h3 className="text-sm font-medium text-slate-300 mb-3">{t('budgets.linesTitle')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-2 pr-4">{t('budgets.category')}</th>
                <th className="pb-2 pr-4">{t('budgets.allocated')}</th>
                <th className="pb-2 pr-4">{t('budgets.spent')}</th>
                <th className="pb-2">{t('budgets.remaining')}</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => {
                const remaining = Number(line.allocated_amount) - Number(line.spent_amount)
                return (
                  <tr key={line.id} className="border-b border-slate-900">
                    <td className="py-2 pr-4 text-slate-300">{line.category}</td>
                    <td className="py-2 pr-4 text-slate-400">PKR {(Number(line.allocated_amount) / 1e9).toFixed(1)}B</td>
                    <td className="py-2 pr-4 text-slate-400">PKR {(Number(line.spent_amount) / 1e9).toFixed(1)}B</td>
                    <td className={`py-2 ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      PKR {(remaining / 1e9).toFixed(1)}B
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}