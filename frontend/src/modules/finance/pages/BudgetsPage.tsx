import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Landmark, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { financeService } from '../../../services/financeService'

export function BudgetsPage() {
  const { t } = useTranslation('finance')
  const { data, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: financeService.listBudgets })

  return (
    <div>
      <PageHeader title={t('budgets.title')} subtitle={t('budgets.subtitle')} />
      {isLoading && <p className="text-slate-400">{t('loading')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((budget) => {
          const allocatedPct = budget.total_amount !== '0'
            ? (Number(budget.total_allocated) / Number(budget.total_amount)) * 100
            : 0
          return (
            <Link key={budget.id} to={`/finance/budgets/${budget.id}`}>
              <Card className="hover:border-teal-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Landmark size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{budget.ministry_name ?? 'Federal'}</p>
                    <p className="text-xs text-slate-500">{t('budgets.fiscalYear')} {budget.fiscal_year}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t('budgets.total')}</span>
                    <span className="text-slate-200">PKR {(Number(budget.total_amount) / 1e9).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t('budgets.allocated')}</span>
                    <span className="text-slate-200">{allocatedPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${allocatedPct > 100 ? 'bg-red-400' : 'bg-teal-400'}`}
                      style={{ width: `${Math.min(allocatedPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <TrendingUp size={12} className={budget.status === 'active' ? 'text-emerald-400' : 'text-slate-500'} />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500">{budget.status}</span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}