import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {FileText, Plus, Gavel, Clock, CheckCircle2, XCircle, AlertCircle, PenTool, BarChart3, Sparkles, ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { policyService } from '../../../services/policyService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  draft: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: PenTool },
  under_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock },
  revisions_requested: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertCircle },
  approved: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: CheckCircle2 },
  implemented: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: ShieldCheck },
  evaluated: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: BarChart3 },
  closed: { bg: 'bg-slate-800', text: 'text-slate-500', border: 'border-slate-700', icon: XCircle },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle },
}

const FILTERS = [
  { key: 'all', label: 'All policies' },
  { key: 'draft', label: 'Draft' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'revisions_requested', label: 'Revisions' },
  { key: 'approved', label: 'Approved' },
  { key: 'implemented', label: 'Implemented' },
  { key: 'evaluated', label: 'Evaluated' },
  { key: 'closed', label: 'Closed' },
  { key: 'rejected', label: 'Rejected' },
]

export function PoliciesPage() {
  const { t } = useTranslation(['policies', 'common'])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data, isLoading } = useQuery({
    queryKey: ['policies', statusFilter],
    queryFn: () => policyService.listPolicies(statusFilter === 'all' ? undefined : statusFilter),
  })

  const totalPolicies = data?.length ?? 0
  const activeReviews = useMemo(() => data?.filter((p) => p.status === 'under_review').length ?? 0, [data])
  const approvedCount = useMemo(() => data?.filter((p) => p.status === 'approved').length ?? 0, [data])
  const implementedCount = useMemo(() => data?.filter((p) => p.status === 'implemented').length ?? 0, [data])
  const avgApprovalStep = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.reduce((s, p) => s + p.current_approval_step, 0) / data.length
  }, [data])

  const statusBreakdown = useMemo(() => {
    if (!data) return []
    const map = new Map<string, number>()
    data.forEach((p) => map.set(p.status, (map.get(p.status) ?? 0) + 1))
    return Array.from(map.entries()).map(([name, count]) => ({ name: name.replace('_', ' '), count }))
  }, [data])

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <RequirePermission perm="policy.create">
          <Link
            to="/policies/new"
            className="flex items-center gap-2 bg-violet-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-violet-400 transition-colors h-fit"
          >
            <Plus size={16} />
            {t('newPolicy')}
          </Link>
        </RequirePermission>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalPolicies')} value={totalPolicies.toLocaleString()} />
        <StatCard label={t('underReview')} value={activeReviews.toLocaleString()} trend={{ value: t('activePipeline'), direction: 'up' }} />
        <StatCard label={t('approved')} value={approvedCount.toLocaleString()} />
        <StatCard label={t('implemented')} value={implementedCount.toLocaleString()} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Gavel size={16} className="text-slate-500" />
            {t('policyPipeline')}
          </h3>
          <span className="text-xs text-slate-500">{t('avgStep', { step: avgApprovalStep.toFixed(1) })}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? totalPolicies : statusBreakdown.find((s) => s.name === f.key.replace('_', ' '))?.count ?? 0
            const isActive = statusFilter === f.key
            const filterLabel = f.key === 'all' ? t('allPolicies') : f.key === 'revisions_requested' ? t('revisions') : t(`statuses.${f.key}`, { ns: 'common' })
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {filterLabel}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-900 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.map((policy) => {
          const style = STATUS_STYLES[policy.status] ?? STATUS_STYLES.draft
          const StatusIcon = style.icon
          const progressPct = (policy.current_approval_step / 3) * 100

          return (
            <Link key={policy.id} to={`/policies/${policy.id}`}>
              <Card className="group hover:border-violet-500/40 transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100 text-sm line-clamp-1 group-hover:text-violet-300 transition-colors">
                        {policy.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        v{policy.version} · {new Date(policy.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    <StatusIcon size={10} />
                    {t(`statuses.${policy.status}`, { ns: 'common', defaultValue: policy.status.replace('_', ' ') })}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t('approvalProgress')}</span>
                    <span className="text-slate-300">{policy.current_approval_step} / 3</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        policy.status === 'rejected' ? 'bg-red-400' : 'bg-violet-400'
                      }`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {policy.current_approval_step > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {t('stepActive', { step: policy.current_approval_step })}
                      </span>
                    )}
                  </div>
                  <Sparkles size={14} className="text-slate-600 group-hover:text-violet-500 transition-colors" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {data?.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">{t('noPoliciesMatch')}</p>
        </Card>
      )}
    </div>
  )
}