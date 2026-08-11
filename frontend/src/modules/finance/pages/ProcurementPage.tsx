import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShoppingCart } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { financeService } from '../../../services/financeService'

const STATUS_STYLES: Record<string, string> = {
  planned: 'bg-slate-800 text-slate-400',
  tendered: 'bg-amber-500/10 text-amber-400',
  awarded: 'bg-teal-500/10 text-teal-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
}

export function ProcurementPage() {
  const { t } = useTranslation('finance')
  const { data, isLoading } = useQuery({ queryKey: ['procurement'], queryFn: financeService.listProcurement })

  return (
    <div>
      <PageHeader title={t('procurement.title')} subtitle={t('procurement.subtitle')} />
      {isLoading && <p className="text-slate-400">{t('loading')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data?.map((proj) => (
          <Card key={proj.id} className="hover:border-teal-500/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <ShoppingCart size={20} className="text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">{proj.title}</p>
                  <p className="text-xs text-slate-500">{proj.ministry_name}</p>
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[proj.status] ?? 'bg-slate-800 text-slate-400'}`}>
                {proj.status}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-sm">
              <span className="text-slate-400">{t('procurement.estimate')}</span>
              <span className="text-slate-200">PKR {(Number(proj.budget_estimate) / 1e9).toFixed(1)}B</span>
            </div>
            {proj.vendor_name && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">{t('procurement.vendor')}</span>
                <span className="text-slate-300 text-xs">{proj.vendor_name}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}