import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {FlaskConical, ArrowLeft, Play, Trash2, AlertCircle, CheckCircle2, Clock, XCircle, Zap, BarChart3, GitCompare, Plus, Lock, Globe,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { Button } from '../../../components/ui/Button'
import { simulationService } from '../../../services/processService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

const RUN_STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
  running: { bg: 'bg-sky-500/10', text: 'text-sky-400', icon: Zap },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
}

const TABS = [
  { key: 'inputs' as const, labelKey: 'tabInputs', icon: Zap },
  { key: 'runs' as const, labelKey: 'tabRuns', icon: BarChart3 },
  { key: 'results' as const, labelKey: 'tabResults', icon: TrendingUp },
]

export function ScenarioDetailPage() {
  const { t } = useTranslation(['process', 'common'])
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'inputs' | 'runs' | 'results'>('inputs')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [comparisonTitle, setComparisonTitle] = useState('')
  const [baselineRunId, setBaselineRunId] = useState('')
  const [compareRunId, setCompareRunId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: () => simulationService.getScenario(scenarioId!),
    enabled: !!scenarioId,
  })

  useEffect(() => {
    const latest = data?.simulation_runs?.find((r: any) => r.status === 'completed')
    if (!selectedRunId && latest) {
      setSelectedRunId(latest.id)
    }
  }, [data, selectedRunId])

  const { data: chartData } = useQuery({
    queryKey: ['run-chart', selectedRunId],
    queryFn: () => simulationService.getRunChart(selectedRunId!),
    enabled: !!selectedRunId,
  })

  const triggerMutation = useMutation({
    mutationFn: () => simulationService.triggerRun(scenarioId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenario', scenarioId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => simulationService.deleteScenario(scenarioId!),
    onSuccess: () => window.location.href = '/process',
  })

  const removeInputMutation = useMutation({
    mutationFn: ({ inputId }: { inputId: string }) => simulationService.removeInput(scenarioId!, inputId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenario', scenarioId] }),
  })

  const createComparisonMutation = useMutation({
    mutationFn: (payload: { title: string; baseline_run_id: string; comparison_run_id: string }) =>
      simulationService.createComparison(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] })
      setComparisonTitle('')
      setBaselineRunId('')
      setCompareRunId('')
    },
  })

  const inputsByRule = useMemo(() => {
    if (!data?.inputs?.length) return []
    const map = new Map<string, typeof data.inputs>()
    data.inputs.forEach((inp: any) => {
      const list = map.get(inp.rule_name) ?? []
      list.push(inp)
      map.set(inp.rule_name, list)
    })
    return Array.from(map.entries())
  }, [data])

  if (isLoading) return <p className="text-slate-400">{t('loadingScenario')}</p>
  if (!data) return <p className="text-red-400">{t('loadError')}</p>

  const scenario = data
  const runs = scenario.simulation_runs ?? []
  const completedRuns = runs.filter((r: any) => r.status === 'completed')
  const latestRun = completedRuns[0] ?? null
  return (
    <div>
      <div className="mb-6">
        <Link to="/process" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-fuchsia-400 transition-colors mb-3">
          <ArrowLeft size={14} />
          {t('backToSimulations')}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{scenario.title}</h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${
                scenario.status === 'ready'
                  ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {t(`statuses.${scenario.status}` as any)}
              </span>
              <span>·</span>
              {scenario.visibility === 'shared' ? <Globe size={12} /> : <Lock size={12} />}
              <span>{t(`visibility.${scenario.visibility}` as any)}</span>
              <span>· {new Date(scenario.updated_at).toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scenario.status !== 'archived' && (
              <RequirePermission perm="simulation.run">
                <button
                  onClick={() => triggerMutation.mutate()}
                  disabled={triggerMutation.isPending || (scenario.inputs ?? []).length === 0}
                  className="flex items-center gap-1.5 bg-fuchsia-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={14} />
                  {triggerMutation.isPending ? t('running') : t('runSimulation')}
                </button>
              </RequirePermission>
            )}
            <RequirePermission perm="simulation.manage">
              <button
                onClick={() => deleteMutation.mutate()}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 transition-colors"
              >
                <Trash2 size={12} />
                {t('common:delete')}
              </button>
            </RequirePermission>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('statInputs')} value={String((scenario.inputs ?? []).length)} />
        <StatCard label={t('statRuns')} value={String(runs.length)} />
        <StatCard
          label={t('latestStatus')}
          value={t(`runStatuses.${runs[0]?.status ?? 'pending'}` as any)}
          trend={
            runs[0]?.status === 'completed'
             ? ({ value: t('done'), direction: 'up' as 'up' | 'down' } as const)
             : undefined
          }
        />
        <StatCard label={t('completed')} value={String(completedRuns.length)} />
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-slate-800">
        {TABS.map((tab) => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
                isActive
                  ? 'text-fuchsia-400 border-fuchsia-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <TabIcon size={14} />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {activeTab === 'inputs' && (
        <div className="space-y-4">
          {inputsByRule.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500 text-center py-8">{t('noInputsConfigured')}</p>
            </Card>
          )}
          {inputsByRule.map(([ruleName, ruleInputs]) => (
            <Card key={ruleName} className="hover:border-fuchsia-900/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                  <Zap size={14} className="text-fuchsia-400" />
                </div>
                <p className="text-sm font-medium text-slate-200 capitalize">{ruleName.replace('_', ' ')}</p>
              </div>
              <div className="space-y-2">
                {ruleInputs.map((inp: any) => (
                  <div key={inp.id} className="flex items-center justify-between bg-slate-950/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{inp.parameter_name}</span>
                      <span className="text-xs text-fuchsia-400 font-semibold">{inp.parameter_value}</span>
                    </div>
                    <RequirePermission perm="simulation.create">
                      <button
                        onClick={() => removeInputMutation.mutate({ inputId: inp.id })}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </RequirePermission>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-4">
          {runs.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500 text-center py-8">{t('noRunsYet')}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runs.map((run: any) => {
              const style = RUN_STATUS_STYLES[run.status] ?? RUN_STATUS_STYLES.pending
              const StatusIcon = style.icon
              return (
                <Card
                  key={run.id}
                  className={`cursor-pointer transition-all ${
                    selectedRunId === run.id ? 'border-fuchsia-500/50 bg-fuchsia-500/5' : 'hover:border-slate-700'
                  }`}
                  onClick={() => {
                    setSelectedRunId(run.id)
                    if (run.status === 'completed') setActiveTab('results')
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.bg}`}>
                        <StatusIcon size={14} className={style.text} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{t('runLabel', { id: run.id.slice(0, 8) })}</p>
                        <p className="text-[10px] text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {t(`runStatuses.${run.status}` as any)}
                    </span>
                  </div>
                  {run.completed_at && run.started_at && (
                    <p className="text-xs text-slate-500">
                      {t('duration', { seconds: Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000) })}
                    </p>
                  )}
                  {run.error_message && (
                    <p className="text-xs text-red-400 mt-2">{run.error_message}</p>
                  )}
                </Card>
              )
            })}
          </div>

          {completedRuns.length >= 2 && (
            <Card className="border-fuchsia-500/10 bg-fuchsia-500/5">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <GitCompare size={14} className="text-fuchsia-400" />
                {t('newComparison')}
              </h4>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder={t('comparisonTitlePlaceholder')}
                  value={comparisonTitle}
                  onChange={(e) => setComparisonTitle(e.target.value)}
                  className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
                />
                <div className="flex gap-2">
                  <select
                    value={baselineRunId}
                    onChange={(e) => setBaselineRunId(e.target.value)}
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 appearance-none cursor-pointer"
                  >
                    <option value="">{t('baselineRun')}</option>
                    {completedRuns.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.id.slice(0, 8)} — {new Date(r.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                  <select
                    value={compareRunId}
                    onChange={(e) => setCompareRunId(e.target.value)}
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 appearance-none cursor-pointer"
                  >
                    <option value="">{t('comparisonRun')}</option>
                    {completedRuns.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.id.slice(0, 8)} — {new Date(r.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => createComparisonMutation.mutate({
                    title: comparisonTitle || `Compare ${baselineRunId.slice(0, 8)} vs ${compareRunId.slice(0, 8)}`,
                    baseline_run_id: baselineRunId,
                    comparison_run_id: compareRunId,
                  })}
                  disabled={!baselineRunId || !compareRunId || createComparisonMutation.isPending}
                  className="self-start bg-fuchsia-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('createComparison')}
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {(!selectedRunId || !chartData) ? (
            <Card>
              <p className="text-sm text-slate-500 text-center py-8">
                {selectedRunId ? t('loadingResults') : t('selectRunMessage')}
              </p>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-slate-500" />
                  {t('baselineVsSimulated')}
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="indicator_name"
                      stroke="#64748b"
                      fontSize={11}
                      width={180}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => {
                        const num = typeof value === 'number' ? value : Number(value ?? 0)
                        return num.toLocaleString()
                      }}
                    />
                    <Bar dataKey="baseline" fill="#475569" radius={[0, 4, 4, 0]} name={t('chartBaseline')} />
                    <Bar dataKey="simulated" fill="#ec4899" radius={[0, 4, 4, 0]} name={t('chartSimulated')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {chartData.map((row: any) => {
                  const change = Number(row.change_pct)
                  const isGood = change > 0
                  return (
                    <Card key={row.indicator_code} className="hover:border-fuchsia-900/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{row.indicator_name}</p>
                          <p className="text-xs text-slate-500">{row.category} · {row.unit}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          isGood ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {change > 0 ? '+' : ''}{change.toFixed(2)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/40 rounded-lg p-2.5">
                          <p className="text-[10px] text-slate-500 uppercase mb-1">{t('chartBaseline')}</p>
                          <p className="text-sm font-semibold text-slate-200">{Number(row.baseline).toLocaleString()}</p>
                        </div>
                        <div className="bg-fuchsia-500/5 rounded-lg p-2.5 border border-fuchsia-500/10">
                          <p className="text-[10px] text-fuchsia-400/70 uppercase mb-1">{t('chartSimulated')}</p>
                          <p className="text-sm font-semibold text-fuchsia-300">{Number(row.simulated).toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}