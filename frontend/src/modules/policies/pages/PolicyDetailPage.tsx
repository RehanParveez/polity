import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {FileText, Gavel, Clock, CheckCircle2, XCircle, AlertCircle, PenTool, ShieldCheck, BarChart3, Target, Milestone, MessageSquare, UserCheck, ChevronRight,
  ArrowLeft, Trash2, Send, RotateCcw, Ban, Play, TrendingUp, AlertTriangle, Award, Zap,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { Button } from '../../../components/ui/Button'
import { policyService, type PolicyDetail, type PolicyApproval, type PolicyStatusTransitionPayload } from '../../../services/policyService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'
import { useAuthStore } from '../../../app/store'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  draft: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: PenTool },
  under_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock },
  revisions_requested: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertCircle },
  approved: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: CheckCircle2 },
  implemented: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: ShieldCheck },
  evaluated: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: BarChart3 },
  closed: { bg: 'bg-slate-800', text: 'text-slate-500', border: 'border-slate-700', icon: XCircle },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: Ban },
}

const STEP_COLORS = ['text-violet-400', 'text-sky-400', 'text-emerald-400']
const STEP_BG = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500']

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['under_review'],
  under_review: ['revisions_requested', 'approved', 'rejected'],
  revisions_requested: ['under_review', 'rejected'],
  approved: ['implemented', 'rejected'],
  implemented: ['evaluated'],
  evaluated: ['closed'],
}

export function PolicyDetailPage() {
  const { t } = useTranslation(['policies', 'common'])
  const { policyId } = useParams<{ policyId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [transitionComment, setTransitionComment] = useState('')
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [approvalComment, setApprovalComment] = useState('')
  const [activeTab, setActiveTab] = useState<'indicators' | 'implementations' | 'reviews' | 'evaluations'>('indicators')

  const { data, isLoading } = useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => policyService.getPolicy(policyId!),
    enabled: !!policyId,
  })

  const transitionMutation = useMutation({
    mutationFn: (payload: PolicyStatusTransitionPayload) => policyService.transitionStatus(policyId!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy', policyId] }),
  })

  const reviewMutation = useMutation({
    mutationFn: (comments: string) => policyService.submitReview(policyId!, { comments, status: 'submitted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', policyId] })
      setReviewComment('')
    },
  })

  const decideMutation = useMutation({
    mutationFn: ({ stepId, status, comments }: { stepId: string; status: string; comments: string }) =>
      policyService.decideApproval(policyId!, stepId, { status, comments }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy', policyId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => policyService.deletePolicy(policyId!),
    onSuccess: () => navigate('/policies'),
  })

  const indicatorProgress = useMemo(() => {
    if (!data?.indicators?.length) return []
    return data.indicators.map((ind) => {
      const target = Number(ind.target_value)
      const current = Number(ind.current_value)
      const pct = target > 0 ? (current / target) * 100 : 0
      return { ...ind, pct: Math.min(pct, 100), gap: target - current }
    })
  }, [data])

  const avgEffectiveness = useMemo(() => {
    if (!data?.evaluations?.length) return 0
    const scores = data.evaluations.filter((e) => e.effectiveness_score != null)
    if (!scores.length) return 0
    return scores.reduce((s, e) => s + (e.effectiveness_score ?? 0), 0) / scores.length
  }, [data])

  const implementationProgress = useMemo(() => {
    if (!data?.implementations?.length) return { completed: 0, total: 0, pct: 0 }
    const completed = data.implementations.filter((i) => i.status === 'completed').length
    return { completed, total: data.implementations.length, pct: (completed / data.implementations.length) * 100 }
  }, [data])

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (!data) return <p className="text-red-400">{t('couldNotLoad', { resource: t('title') })}</p>

  const policy = data
  const style = STATUS_STYLES[policy.status] ?? STATUS_STYLES.draft
  const StatusIcon = style.icon
  const availableTransitions = ALLOWED_TRANSITIONS[policy.status] ?? []
  const pendingStep = policy.approvals.find((a) => a.status === 'pending')
  const canDecide = pendingStep && user?.permissions.includes('policy.approve')
  const isDraft = policy.status === 'draft' || policy.status === 'revisions_requested'

  const handleTransition = () => {
    if (!selectedTransition) return
    transitionMutation.mutate({ new_status: selectedTransition, comment: transitionComment || null })
    setSelectedTransition(null)
    setTransitionComment('')
  }

  const stepNames = [
    t('ministryReview'),
    t('cabinetReview'),
    t('parliamentaryReview'),
  ]

  return (
    <div>
      <div className="mb-6">
        <Link to="/policies" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors mb-3">
          <ArrowLeft size={14} />
          {t('backToPolicies')}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{policy.title}</h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                <StatusIcon size={10} />
                {t(`statuses.${policy.status}`, { ns: 'common', defaultValue: policy.status.replace('_', ' ') })}
              </span>
              <span>· v{policy.version}</span>
              <span>· {new Date(policy.updated_at).toLocaleDateString()}</span>
              <span>· {t('confidence')}: {policy.confidence}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDraft && (
              <RequirePermission perm="policy.create">
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Trash2 size={12} />
                  {t('delete')}
                </button>
              </RequirePermission>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('approvalStep')} value={`${policy.current_approval_step} / 3`} />
        <StatCard label={t('indicators')} value={String(policy.indicators.length)} />
        <StatCard
          label={t('implementation')}
          value={`${implementationProgress.completed} / ${implementationProgress.total}`}
          trend={implementationProgress.pct === 100 ? { value: t('complete'), direction: 'up' } : undefined}
        />
        <StatCard
          label={t('effectiveness')}
          value={avgEffectiveness > 0 ? `${avgEffectiveness.toFixed(1)} / 10` : '—'}
        />
      </div>

      <Card className="mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Gavel size={16} className="text-slate-500" />
          {t('approvalPipeline')}
        </h3>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800" />
          <div className="relative flex justify-between">
            {stepNames.map((stepName, idx) => {
              const step = policy.approvals.find((a) => a.approval_step === idx + 1)
              const isCompleted = step?.status === 'approved'
              const isCurrent = step?.status === 'pending'
              const isRejected = step?.status === 'rejected'
              const stepNum = idx + 1

              return (
                <div key={stepName} className="flex flex-col items-center relative z-10 bg-slate-900 px-2">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                      isRejected
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : isCurrent
                        ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : isRejected ? <XCircle size={18} /> : <span className="text-sm font-bold">{stepNum}</span>}
                  </div>
                  <p className={`text-xs font-medium mt-2 ${isCompleted || isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>
                    {stepName}
                  </p>
                  {step?.decided_at && (
                    <p className="text-[10px] text-slate-600">{new Date(step.decided_at).toLocaleDateString()}</p>
                  )}
                  {step?.approver && (
                    <p className="text-[10px] text-slate-500">{step.approver}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {canDecide && pendingStep && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-300 mb-2 flex items-center gap-2">
              <UserCheck size={14} className="text-violet-400" />
              {t('decide')} {t(pendingStep.step_name, { defaultValue: pendingStep.step_name })}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('addCommentOptional')}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={() => decideMutation.mutate({ stepId: pendingStep.id, status: 'approved', comments: approvalComment })}
                className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 size={14} />
                {t('approve')}
              </button>
              <button
                onClick={() => decideMutation.mutate({ stepId: pendingStep.id, status: 'rejected', comments: approvalComment })}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                <Ban size={14} />
                {t('reject')}
              </button>
            </div>
          </div>
        )}
      </Card>

      {availableTransitions.length > 0 && (
        <Card className="mb-6 border-violet-500/20 bg-violet-500/5">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <RotateCcw size={16} className="text-violet-400" />
            {t('statusTransition')}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableTransitions.map((trans) => (
              <button
                key={trans}
                onClick={() => setSelectedTransition(trans)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedTransition === trans
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t(`statuses.${trans}`, { ns: 'common', defaultValue: trans.replace('_', ' ') })}
              </button>
            ))}
          </div>
          {selectedTransition && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('transitionCommentOptional')}
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleTransition}
                className="bg-violet-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-violet-400 transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center gap-1 mb-4 border-b border-slate-800">
        {[
          { key: 'indicators', label: t('indicators'), icon: Target },
          { key: 'implementations', label: t('implementationTab'), icon: Milestone },
          { key: 'reviews', label: t('reviewsAndApprovals'), icon: MessageSquare },
          { key: 'evaluations', label: t('evaluations'), icon: Award },
        ].map((tab) => {
          const TabIcon = tab.icon
          const isActive = activeTab === (tab.key as typeof activeTab)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
                isActive
                  ? 'text-violet-400 border-violet-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-800 text-slate-500'}`}>
                {tab.key === 'indicators' ? policy.indicators.length : tab.key === 'implementations' ? policy.implementations.length : tab.key === 'reviews' ? policy.reviews.length + policy.approvals.length : policy.evaluations.length}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'indicators' && (
        <div className="space-y-4">
          {indicatorProgress.length === 0 && (
            <Card><p className="text-sm text-slate-500 text-center py-8">{t('noIndicatorsDefined')}</p></Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicatorProgress.map((ind) => (
              <Card key={ind.id} className="hover:border-violet-900/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-100 text-sm">{ind.indicator_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('target')}: {Number(ind.target_value).toLocaleString()} {ind.unit}</p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                    ind.pct >= 100 ? 'bg-emerald-500/10 text-emerald-400' : ind.pct >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {ind.pct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ind.pct >= 100 ? 'bg-emerald-400' : ind.pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(ind.pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{t('current')}: {Number(ind.current_value).toLocaleString()} {ind.unit}</span>
                  <span>{t('gap')}: {ind.gap > 0 ? ind.gap.toLocaleString() : '0'} {ind.unit}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2">{t('source')}: {ind.source} · {ind.as_of_date}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'implementations' && (
        <div className="space-y-4">
          {policy.implementations.length === 0 && (
            <Card><p className="text-sm text-slate-500 text-center py-8">{t('noImplementationMilestones')}</p></Card>
          )}
          <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
            {policy.implementations.map((impl) => {
              const isCompleted = impl.status === 'completed'
              const isOverdue = !isCompleted && new Date(impl.target_date) < new Date()
              return (
                <div key={impl.id} className="relative pl-6">
                  <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500' : isOverdue ? 'bg-red-500 border-red-500' : 'bg-slate-900 border-violet-500'
                  }`} />
                  <Card className={`${isOverdue ? 'border-red-900/30' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-100 text-sm">{impl.milestone}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t('target')}: {new Date(impl.target_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400' : isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
                      }`}>
                        {t(`statuses.${impl.status}`, { ns: 'common', defaultValue: impl.status.replace('_', ' ') })}
                      </span>
                    </div>
                    {impl.budget_utilized && (
                      <p className="text-xs text-slate-400 mb-1">{t('budgetUtilized')}: PKR {Number(impl.budget_utilized).toLocaleString()}</p>
                    )}
                    {impl.notes && <p className="text-xs text-slate-500 italic">{impl.notes}</p>}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {(policy.status === 'under_review' || policy.status === 'revisions_requested') && (
            <Card className="border-violet-500/20 bg-violet-500/5">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare size={14} className="text-violet-400" />
                {t('submitReview')}
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('reviewComments')}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => reviewMutation.mutate(reviewComment)}
                  className="bg-violet-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-violet-400 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </Card>
          )}

          {policy.reviews.map((review) => (
            <Card key={review.id} className="hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                    <MessageSquare size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">{t('reviewRound')} {review.review_round}</p>
                    <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                  review.status === 'changes_requested' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {t(`statuses.${review.status}`, { ns: 'common', defaultValue: review.status.replace('_', ' ') })}
                </span>
              </div>
              {review.comments && <p className="text-sm text-slate-400 mt-2 pl-10">{review.comments}</p>}
            </Card>
          ))}

          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-6 mb-2">{t('approvalHistory')}</h4>
          {policy.approvals.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between py-2 border-b border-slate-900 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${
                  approval.status === 'approved' ? 'bg-emerald-400' : approval.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <div>
                  <p className="text-sm text-slate-300">{t(approval.step_name, { defaultValue: approval.step_name })}</p>
                  <p className="text-xs text-slate-500">{t('step')} {approval.approval_step}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                  approval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : approval.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {t(`statuses.${approval.status}`, { ns: 'common', defaultValue: approval.status })}
                </span>
                {approval.decided_at && (
                  <p className="text-[10px] text-slate-600 mt-0.5">{new Date(approval.decided_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          {policy.evaluations.length === 0 && (
            <Card><p className="text-sm text-slate-500 text-center py-8">{t('noEvaluationsYet')}</p></Card>
          )}
          {policy.evaluations.map((ev) => (
            <Card key={ev.id} className="hover:border-sky-900/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Award size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-sm">{t('policyEvaluation')}</p>
                    <p className="text-xs text-slate-500">{new Date(ev.evaluated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">{t('effectiveness')}</p>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-sky-400" />
                    <span className="text-lg font-semibold text-slate-200">{ev.effectiveness_score ?? '—'} / 10</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">{t('efficiency')}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-lg font-semibold text-slate-200">{ev.efficiency_score ?? '—'} / 10</span>
                  </div>
                </div>
              </div>
              {ev.impact_summary && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 uppercase mb-1">{t('impactSummary')}</p>
                  <p className="text-sm text-slate-300">{ev.impact_summary}</p>
                </div>
              )}
              {ev.recommendations && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">{t('recommendations')}</p>
                  <p className="text-sm text-slate-300">{ev.recommendations}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}