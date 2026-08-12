import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Landmark,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  PieChart,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { financeService } from '../../../services/financeService'

export function BudgetsPage() {
  const { t } = useTranslation('finance')
  const { data, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: financeService.listBudgets })

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>

  const totalBudgets = data?.length ?? 0
  const activeBudgets = data?.filter((b) => b.status === 'active').length ?? 0
  const totalApproved = data?.reduce((acc, b) => acc + Number(b.total_amount), 0) ?? 0
  const totalAllocated = data?.reduce((acc, b) => acc + Number(b.total_allocated), 0) ?? 0
  const overAllocatedCount = data?.filter((b) => Number(b.total_allocated) > Number(b.total_amount)).length ?? 0

  return (
    <div>
      <PageHeader title={t('budgets.title')} subtitle={t('budgets.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total budgets" value={String(totalBudgets)} />
        <StatCard
          label="Active budgets"
          value={String(activeBudgets)}
          trend={{ value: `${totalBudgets - activeBudgets} inactive`, direction: 'up' }}
        />
        <StatCard
          label="Total approved"
          value={`PKR ${(totalApproved / 1e9).toFixed(1)}B`}
        />
        <StatCard
          label="Total allocated"
          value={`PKR ${(totalAllocated / 1e9).toFixed(1)}B`}
          trend={{
            value: overAllocatedCount > 0 ? `${overAllocatedCount} over-allocated` : 'All within limits',
            direction: overAllocatedCount > 0 ? 'down' : 'up',
          }}
        />
      </div>

      {data && data.length > 0 && overAllocatedCount > 0 && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">{overAllocatedCount} budget{overAllocatedCount > 1 ? 's' : ''} over-allocated</p>
            <p className="text-xs text-slate-500">Review allocations that exceed approved totals</p>
          </div>
        </div>
      )}

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Wallet size={16} className="text-emerald-400" />
          {t('budgets.title')}
        </h3>

        {data?.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
            <DollarSign size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No budgets on record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.map((budget) => {
              const allocated = Number(budget.total_allocated)
              const total = Number(budget.total_amount)
              const allocatedPct = total > 0 ? (allocated / total) * 100 : 0
              const isOver = allocated > total
              const remaining = total - allocated

              return (
                <Link key={budget.id} to={`/finance/budgets/${budget.id}`} className="block">
                  <div className="group bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-900/40 transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isOver ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                          <Landmark size={20} className={isOver ? 'text-red-400' : 'text-emerald-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-100 text-sm truncate">{budget.ministry_name ?? 'Federal'}</p>
                          <p className="text-xs text-slate-500">{t('budgets.fiscalYear')} {budget.fiscal_year}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
                    </div>

                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Approved</span>
                        <span className="text-slate-200 font-medium">PKR {(total / 1e9).toFixed(1)}B</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Allocated</span>
                        <span className={isOver ? 'text-red-400 font-medium' : 'text-slate-200 font-medium'}>
                          PKR {(allocated / 1e9).toFixed(1)}B
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Remaining</span>
                        <span className={isOver ? 'text-red-400' : 'text-emerald-400'}>
                          PKR {(Math.abs(remaining) / 1e9).toFixed(1)}B
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                          <span>Allocation usage</span>
                          <span>{allocatedPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${isOver ? 'bg-red-500' : allocatedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(allocatedPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        budget.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : budget.status === 'closed'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {budget.status}
                      </span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                       <PieChart size={10} />
                       {(budget.lines?.length ?? 0)} categories
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}