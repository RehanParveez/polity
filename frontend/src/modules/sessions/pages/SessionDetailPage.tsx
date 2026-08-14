import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {Bookmark, ArrowLeft, Play, RotateCcw, Copy, Trash2, Pencil, Check, X, Lock, Globe, Building2, BarChart3, Zap, Calendar, Users, ChevronDown,
  ChevronUp, TrendingUp, TrendingDown, Share2, Plus, AlertTriangle, Loader2, Save, FolderOpen
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { Button } from '../../../components/ui/Button'
import { sessionService } from '../../../services/sessionService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'
import { useAuthStore } from '../../../app/store'

const VISIBILITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  private: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: Lock },
  shared: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Globe },
  institutional: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: Building2 },
}

export function SessionDetailPage() {
  const { t, i18n } = useTranslation(['sessions', 'common'])
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editVisibility, setEditVisibility] = useState('')
  const [expandedResults, setExpandedResults] = useState(false)
  const [showShareForm, setShowShareForm] = useState(false)
  const [shareUserId, setShareUserId] = useState('')
  const [sharePermission, setSharePermission] = useState('view')

  const { data, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionService.getSession(sessionId!),
    enabled: !!sessionId,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { title?: string; description?: string | null; visibility?: string }) =>
      sessionService.updateSession(sessionId!, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setIsEditing(false)
      setEditTitle(res.title)
      setEditDesc(res.description ?? '')
      setEditVisibility(res.visibility)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionService.deleteSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/sessions')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: () => sessionService.duplicateSession(sessionId!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/sessions/${res.id}`)
    },
  })

  const resumeMutation = useMutation({
    mutationFn: () => sessionService.resumeSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })

  const rerunMutation = useMutation({
    mutationFn: () => sessionService.rerunSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const shareMutation = useMutation({
    mutationFn: (payload: { shared_with_user_id?: string | null; permission?: string }) =>
      sessionService.addShare(sessionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      setShowShareForm(false)
      setShareUserId('')
      setSharePermission('view')
    },
  })

  const removeShareMutation = useMutation({
    mutationFn: (shareId: string) => sessionService.removeShare(sessionId!, shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', sessionId] }),
  })

  if (isLoading) return <p className="text-slate-400">{t('sessions:detail.loadingSession')}</p>
  if (!data) return <p className="text-red-400">{t('sessions:detail.loadError')}</p>

  const session = data
  const snapshot = session.snapshot
  const isOwner = session.owner_id === currentUser?.id
  const vis = VISIBILITY_STYLES[session.visibility] ?? VISIBILITY_STYLES.private
  const VisIcon = vis.icon
  const visLabel = t(`sessions:visibility.${session.visibility}` as const)

  const startEdit = () => {
    setEditTitle(session.title)
    setEditDesc(session.description ?? '')
    setEditVisibility(session.visibility)
    setIsEditing(true)
  }

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    const payload: { title?: string; description?: string | null; visibility?: string } = {}
    if (editTitle !== session.title) payload.title = editTitle
    if (editDesc !== (session.description ?? '')) payload.description = editDesc || null
    if (editVisibility !== session.visibility) payload.visibility = editVisibility
    if (Object.keys(payload).length > 0) {
      updateMutation.mutate(payload)
    } else {
      setIsEditing(false)
    }
  }

  const results = snapshot?.results ?? []
  const hasResults = results.length > 0
  const positiveChanges = results.filter((r) => Number(r.percent_change) > 0).length
  const negativeChanges = results.filter((r) => Number(r.percent_change) < 0).length

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/sessions"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          {t('sessions:detail.backToSessions')}
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3 max-w-xl">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-lg font-semibold text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />
                <div className="flex items-center gap-2">
                  {['private', 'shared', 'institutional'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setEditVisibility(v)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        editVisibility === v
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {t(`sessions:visibility.${v}` as const)}
                    </button>
                  ))}
                  <button
                    onClick={saveEdit}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1 text-xs bg-amber-500 text-slate-950 font-semibold rounded-lg px-3 py-1.5 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    <Save size={12} />
                    {t('common:save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <X size={12} />
                    {t('common:cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-slate-100">{session.title}</h1>
                  <span
                    className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${vis.bg} ${vis.text} ${vis.border}`}
                  >
                    <VisIcon size={10} />
                    {visLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Calendar size={12} />
                  {t('sessions:detail.savedAt', { date: snapshot?.saved_at ? new Date(snapshot.saved_at).toLocaleString(i18n.language) : '—' })}
                  <span>·</span>
                  <span>{t('sessions:detail.updatedAt', { date: new Date(session.updated_at).toLocaleDateString(i18n.language) })}</span>
                </p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <RequirePermission perm="session.create">
                <button
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                  className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  <Play size={14} />
                  {resumeMutation.isPending ? t('sessions:detail.resuming') : t('sessions:detail.resume')}
                </button>
              </RequirePermission>

              {isOwner && (
                <>
                  <RequirePermission perm="session.create">
                    <button
                      onClick={() => rerunMutation.mutate()}
                      disabled={rerunMutation.isPending}
                      className="flex items-center gap-1.5 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      <RotateCcw size={14} />
                      {rerunMutation.isPending ? t('sessions:detail.running') : t('sessions:detail.rerun')}
                    </button>
                  </RequirePermission>

                  <button
                    onClick={() => duplicateMutation.mutate()}
                    disabled={duplicateMutation.isPending}
                    className="flex items-center gap-1.5 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <Copy size={14} />
                    {t('sessions:detail.duplicate')}
                  </button>

                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>

                  <RequirePermission perm="session.create">
                    <button
                      onClick={() => {
                        if (confirm(t('sessions:detail.deleteConfirm'))) {
                          deleteMutation.mutate()
                        }
                      }}
                      className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </RequirePermission>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sessions:detail.snapshotResults')}
          value={results.length.toString()}
          caption={snapshot?.scenario?.title ?? t('sessions:detail.noScenarioLinked')}
        />
        <StatCard
          label={t('sessions:detail.positiveChanges')}
          value={positiveChanges.toString()}
          trend={{ value: t('sessions:detail.improved'), direction: 'up' }}
        />
        <StatCard
          label={t('sessions:detail.negativeChanges')}
          value={negativeChanges.toString()}
          trend={{ value: t('sessions:detail.declined'), direction: 'down' }}
        />
        <StatCard
          label={t('sessions:detail.inputs')}
          value={String(snapshot?.scenario?.inputs?.length ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {snapshot?.scenario && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FolderOpen size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t('sessions:detail.scenarioSnapshot')}</p>
                  <p className="text-xs text-slate-500">{snapshot.scenario.title}</p>
                </div>
              </div>

              {snapshot.scenario.inputs && snapshot.scenario.inputs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('sessions:detail.ruleInputs')}</p>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.scenario.inputs.map((inp, i) => (
                      <div
                        key={i}
                        className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="text-slate-400 capitalize">{inp.rule_name.replace('_', ' ')}</span>
                        <span className="text-slate-600 mx-1">·</span>
                        <span className="text-slate-300 font-mono">{inp.parameter_name}</span>
                        <span className="text-amber-400 font-semibold ml-1">= {inp.parameter_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {hasResults && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-amber-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">{t('sessions:detail.snapshotResults')}</p>
                </div>
                <button
                  onClick={() => setExpandedResults((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  {expandedResults ? (
                    <>
                      <ChevronUp size={12} /> {t('sessions:detail.collapse')}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} /> {t('sessions:detail.expand')}
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {results.slice(0, expandedResults ? undefined : 6).map((res) => {
                  const change = Number(res.percent_change)
                  const isPositive = change > 0
                  const isNeutral = change === 0

                  return (
                    <div
                      key={res.indicator_code}
                      className="border border-slate-800 rounded-lg p-3 hover:border-amber-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{res.indicator_name}</p>
                          <p className="text-xs text-slate-500">
                            {res.category} · {res.unit}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-xs font-medium ${
                            isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp size={14} /> : isNeutral ? <span className="w-3" /> : <TrendingDown size={14} />}
                          {isPositive ? '+' : ''}
                          {change.toFixed(2)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-950/40 rounded-lg p-2.5">
                          <p className="text-[10px] text-slate-500 uppercase mb-1">{t('sessions:detail.baseline')}</p>
                          <p className="text-sm font-semibold text-slate-200">
                            {Number(res.baseline_value).toLocaleString(i18n.language, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-amber-500/5 rounded-lg p-2.5 border border-amber-500/10">
                          <p className="text-[10px] text-amber-400/70 uppercase mb-1">{t('sessions:detail.simulated')}</p>
                          <p className="text-sm font-semibold text-amber-300">
                            {Number(res.simulated_value).toLocaleString(i18n.language, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-slate-950/40 rounded-lg p-2.5">
                          <p className="text-[10px] text-slate-500 uppercase mb-1">{t('sessions:detail.absChange')}</p>
                          <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-200' : 'text-red-400'}`}>
                            {Number(res.absolute_change) > 0 ? '+' : ''}
                            {Number(res.absolute_change).toLocaleString(i18n.language, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${isPositive ? 'bg-emerald-400' : isNeutral ? 'bg-slate-500' : 'bg-red-400'}`}
                            style={{
                              width: `${Math.min(Math.abs(change) * 5, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!expandedResults && results.length > 6 && (
                <p className="text-xs text-slate-500 text-center mt-3">
                  {t('sessions:detail.moreResults', { count: results.length - 6 })}
                </p>
              )}
            </Card>
          )}

          {!hasResults && (
            <Card>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 size={32} className="text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">{t('sessions:detail.noResultsTitle')}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {t('sessions:detail.noResultsDesc')}
                </p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
    
          {snapshot?.run && (
            <Card>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={12} />
                {t('sessions:detail.runSnapshot')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('common:status')}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      snapshot.run.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {snapshot.run.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('sessions:detail.runId')}</span>
                  <span className="text-slate-300 font-mono text-xs">{snapshot.run.id.slice(0, 8)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('sessions:detail.created')}</span>
                  <span className="text-slate-300 text-xs">
                    {snapshot.run.created_at ? new Date(snapshot.run.created_at).toLocaleDateString(i18n.language) : '—'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {isOwner && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Share2 size={12} />
                  {t('sessions:detail.sharing')}
                </h3>
                <button
                  onClick={() => setShowShareForm((s) => !s)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={12} />
                  {t('sessions:detail.add')}
                </button>
              </div>

              {showShareForm && (
                <div className="mb-4 space-y-2 border border-slate-800 rounded-lg p-3">
                  <input
                    type="text"
                    placeholder={t('sessions:detail.userIdPlaceholder')}
                    value={shareUserId}
                    onChange={(e) => setShareUserId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={sharePermission}
                      onChange={(e) => setSharePermission(e.target.value)}
                      className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 appearance-none cursor-pointer"
                    >
                      <option value="view">{t('sessions:detail.permissions.view')}</option>
                      <option value="edit">{t('sessions:detail.permissions.edit')}</option>
                    </select>
                    <button
                      onClick={() => {
                        if (shareUserId.trim()) {
                          shareMutation.mutate({
                            shared_with_user_id: shareUserId.trim(),
                            permission: sharePermission,
                          })
                        }
                      }}
                      disabled={shareMutation.isPending || !shareUserId.trim()}
                      className="bg-amber-500 text-slate-950 font-semibold rounded-lg px-3 py-2 text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {t('sessions:detail.share')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {session.shares.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">{t('sessions:detail.notShared')}</p>
                )}
                {session.shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between bg-slate-950/40 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={12} className="text-slate-500" />
                      <span className="text-xs text-slate-300 font-mono">
                        {share.shared_with_user_id?.slice(0, 8) ?? share.shared_with_institution_id?.slice(0, 8) ?? '—'}…
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full ${
                          share.permission === 'edit'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t(`sessions:detail.permissions.${share.permission}` as const)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeShareMutation.mutate(share.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="border-amber-500/10 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bookmark size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{t('sessions:detail.sessionVsLive')}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <span className="text-amber-400 font-medium">{t('sessions:detail.resumeHelp')}</span>
                  {t('sessions:detail.resumeHelpText')}
                  <span className="text-amber-400 font-medium"> {t('sessions:detail.rerunHelp')}</span>
                  {t('sessions:detail.rerunHelpText')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}