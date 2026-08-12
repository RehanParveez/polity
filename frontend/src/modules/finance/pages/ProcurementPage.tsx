import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {ShoppingCart, Package, CheckCircle2, Clock, DollarSign, ArrowRight, AlertCircle, Building2, Calendar, User, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { financeService } from '../../../services/financeService'

const STATUS_STYLES: Record<string, string> = {
  planned: 'bg-slate-800 text-slate-400',
  tendered: 'bg-amber-500/10 text-amber-400',
  awarded: 'bg-emerald-500/10 text-emerald-400',
  completed: 'bg-teal-500/10 text-teal-400',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  planned: <Clock size={10} />,
  tendered: <TrendingUp size={10} />,
  awarded: <Package size={10} />,
  completed: <CheckCircle2 size={10} />,
}

export function ProcurementPage() {
  const { t } = useTranslation('finance')
  const { data, isLoading } = useQuery({ queryKey: ['procurement'], queryFn: financeService.listProcurement })

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>

  const totalProjects = data?.length ?? 0
  const activeProjects = data?.filter((p) => p.status === 'awarded' || p.status === 'tendered').length ?? 0
  const completedProjects = data?.filter((p) => p.status === 'completed').length ?? 0
  const totalEstimate = data?.reduce((acc, p) => acc + Number(p.budget_estimate), 0) ?? 0
  const projectsWithVendor = data?.filter((p) => p.vendor_name).length ?? 0

  return (
    <div>
      <PageHeader title={t('procurement.title')} subtitle={t('procurement.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total projects" value={String(totalProjects)} />
        <StatCard
          label="Active projects"
          value={String(activeProjects)}
          trend={{ value: `${completedProjects} completed`, direction: 'up' }}
        />
        <StatCard
          label="Total estimate"
          value={`PKR ${(totalEstimate / 1e9).toFixed(1)}B`}
        />
        <StatCard
          label="Vendors engaged"
          value={String(projectsWithVendor)}
          trend={{ value: `${totalProjects - projectsWithVendor} pending`, direction: 'up' }}
        />
      </div>

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <ShoppingCart size={16} className="text-emerald-400" />
          Procurement projects
        </h3>

        {data?.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
            <Package size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No procurement projects on record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.map((proj) => {
              const estimate = Number(proj.budget_estimate)

              return (
                <div
                  key={proj.id}
                  className="group bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-900/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        <ShoppingCart size={18} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100 text-sm truncate">{proj.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={10} />
                          {proj.ministry_name}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[proj.status] ?? 'bg-slate-800 text-slate-400'}`}>
                      {STATUS_ICONS[proj.status]}
                      {proj.status}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{proj.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign size={12} />
                        {t('procurement.estimate')}
                      </span>
                      <span className="text-slate-200 font-medium">PKR {(estimate / 1e9).toFixed(1)}B</span>
                    </div>

                    {proj.vendor_name ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <User size={12} />
                          {t('procurement.vendor')}
                        </span>
                        <span className="text-slate-300 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {proj.vendor_name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <User size={12} />
                          {t('procurement.vendor')}
                        </span>
                        <span className="text-slate-600 text-xs italic">Not assigned</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                   <span className="text-[10px] text-slate-600">
                   Status: {proj.status}
                  </span>
                  {proj.status === 'completed' && (
                   <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Delivered
                   </span>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}