import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GitCompare, ArrowLeft, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { simulationService } from '../../../services/processService'

export function ComparisonsPage() {
  const { t } = useTranslation(['process', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['comparisons'],
    queryFn: simulationService.listComparisons,
  })

  if (isLoading) return <p className="text-slate-400">{t('loadingComparisons')}</p>

  return (
    <div>
      <div className="mb-6">
        <Link to="/process" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-fuchsia-400 transition-colors mb-3">
          <ArrowLeft size={14} />
          {t('backToSimulations')}
        </Link>
        <PageHeader title={t('comparisonsTitle')} subtitle={t('comparisonsSubtitle')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.map((comp) => (
          <Link key={comp.id} to={`/process/comparisons/${comp.id}`}>
            <Card className="group hover:border-fuchsia-500/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                  <GitCompare size={20} className="text-fuchsia-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm group-hover:text-fuchsia-300 transition-colors">
                    {comp.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(comp.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-800 px-2 py-1 rounded">{comp.baseline_run_id.slice(0, 8)}</span>
                <span>{t('vs')}</span>
                <span className="bg-slate-800 px-2 py-1 rounded">{comp.comparison_run_id.slice(0, 8)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {data?.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">{t('noComparisons')}</p>
        </Card>
      )}
    </div>
  )
}