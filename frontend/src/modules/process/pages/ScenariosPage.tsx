import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {FlaskConical, Plus, BrainCircuit, PlayCircle, CheckCircle2, Clock, Archive, Globe, Lock, BarChart3, GitCompare, AlertCircle,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { simulationService } from '../../../services/processService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  draft: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: Clock },
  ready: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', icon: PlayCircle },
  archived: { bg: 'bg-slate-800', text: 'text-slate-500', border: 'border-slate-700', icon: Archive },
}

const FILTERS = [
  { key: 'all', labelKey: 'filters.all' },
  { key: 'draft', labelKey: 'filters.draft' },
  { key: 'ready', labelKey: 'filters.ready' },
  { key: 'archived', labelKey: 'filters.archived' },
]

export function ScenariosPage() {
  const { t } = useTranslation(['process', 'common'])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data, isLoading } = useQuery({
    queryKey: ['scenarios', statusFilter],
    queryFn: () => simulationService.listScenarios(statusFilter === 'all' ? undefined : statusFilter),
  })

  const { data: comparisons } = useQuery({
    queryKey: ['comparisons'],
    queryFn: simulationService.listComparisons,
  })

  const totalScenarios = data?.length ?? 0
  const readyCount = useMemo(() => data?.filter((s) => s.status === 'ready').length ?? 0, [data])
  const draftCount = useMemo(() => data?.filter((s) => s.status === 'draft').length ?? 0, [data])
  const totalComparisons = comparisons?.length ?? 0

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="flex items-center gap-2">
          <Link
            to="/process/comparisons"
            className="flex items-center gap-2 bg-slate-800 text-slate-200 border border-slate-700 font-medium rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition-colors h-fit"
          >
            <GitCompare size={16} />
            {t('comparisons')}
          </Link>
          <RequirePermission perm="simulation.create">
            <Link
              to="/process/new"
              className="flex items-center gap-2 bg-fuchsia-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-fuchsia-400 transition-colors h-fit"
            >
              <Plus size={16} />
              {t('newScenario')}
            </Link>
          </RequirePermission>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalScenarios')} value={totalScenarios.toLocaleString()} />
        <StatCard label={t('readyToRun')} value={readyCount.toLocaleString()} trend={{ value: t('configured'), direction: 'up' }} />
        <StatCard label={t('drafts')} value={draftCount.toLocaleString()} />
        <StatCard label={t('comparisons')} value={totalComparisons.toLocaleString()} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BrainCircuit size={16} className="text-slate-500" />
            {t('scenarioPipeline')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? totalScenarios : data?.filter((s) => s.status === f.key).length ?? 0
            const isActive = statusFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t(f.labelKey)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-slate-900 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.map((scenario) => {
          const style = STATUS_STYLES[scenario.status] ?? STATUS_STYLES.draft
          const StatusIcon = style.icon
          const isPublic = scenario.visibility === 'shared'

          return (
            <Link key={scenario.id} to={`/process/${scenario.id}`}>
              <Card className="group hover:border-fuchsia-500/40 transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                      <FlaskConical size={20} className="text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100 text-sm line-clamp-1 group-hover:text-fuchsia-300 transition-colors">
                        {scenario.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(scenario.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    <StatusIcon size={10} />
                    {t(`statuses.${scenario.status}` as any)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">
                  {scenario.description ?? t('noDescription')}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      {isPublic ? <Globe size={10} /> : <Lock size={10} />}
                      {t(`visibility.${scenario.visibility}` as any)}
                    </span>
                  </div>
                  <BarChart3 size={14} className="text-slate-600 group-hover:text-fuchsia-500 transition-colors" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {data?.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">{t('noScenariosMatch')}</p>
        </Card>
      )}
    </div>
  )
}