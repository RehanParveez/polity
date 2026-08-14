import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {Bookmark, ArrowLeft, Sparkles, Lock, Globe, Building2, AlertCircle, FolderOpen, Zap
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { sessionService } from '../../../services/sessionService'
import { simulationService } from '../../../services/processService'

const VISIBILITY_OPTIONS = [
  { key: 'private', icon: Lock },
  { key: 'shared', icon: Globe },
  { key: 'institutional', icon: Building2 },
]

export function SessionCreatePage() {
  const { t } = useTranslation(['sessions', 'common'])
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [scenarioId, setScenarioId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios-for-sessions'],
    queryFn: () => simulationService.listScenarios(),
  })

  const createMutation = useMutation({
    mutationFn: sessionService.createSession,
    onSuccess: (res) => navigate(`/sessions/${res.id}`),
    onError: (err: any) => setError(err?.response?.data?.detail || t('sessions:create.failedToCreate')),
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!scenarioId) {
      setError(t('sessions:create.selectScenarioError'))
      return
    }
    createMutation.mutate({
      title,
      description: description || null,
      scenario_id: scenarioId,
      visibility,
    })
  }

  const selectedScenario = scenarios?.find((s) => s.id === scenarioId)

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/sessions"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          {t('sessions:create.backToSessions')}
        </Link>
        <PageHeader title={t('sessions:create.title')} subtitle={t('sessions:create.subtitle')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <TextField
                label={t('sessions:create.sessionTitle')}
                icon={Bookmark}
                placeholder={t('sessions:create.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('sessions:create.description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('sessions:create.descriptionPlaceholder')}
                  rows={3}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('sessions:create.sourceScenario')}</label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  required
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                >
                  <option value="">{t('sessions:create.selectScenario')}</option>
                  {scenarios?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.status})
                    </option>
                  ))}
                </select>
                {scenarios?.length === 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    {t('sessions:create.noScenarios')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('sessions:create.visibility')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = visibility === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setVisibility(opt.key)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon size={18} />
                        <div>
                          <p className="text-sm font-medium">{t(`sessions:visibility.${opt.key}` as const)}</p>
                          <p className="text-[10px] text-slate-500">{t(`sessions:create.visibilityDesc.${opt.key}` as const)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={createMutation.isPending} className="w-auto px-6">
                  <Sparkles size={16} className="mr-1.5" />
                  {t('sessions:create.saveSnapshot')}
                </Button>
                <Link to="/sessions" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {t('common:cancel')}
                </Link>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FolderOpen size={12} />
              {t('sessions:create.preview')}
            </h3>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Bookmark size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-sm line-clamp-2">
                      {title || t('sessions:create.untitled')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t(`sessions:visibility.${visibility}` as const)} ·{' '}
                      {selectedScenario ? t('sessions:create.scenarioLinked') : t('sessions:create.noScenario')}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-3">
                {description || t('sessions:create.noDescription')}
              </p>
            </div>

            {selectedScenario && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('sessions:create.linkedScenario')}</p>
                <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={12} className="text-fuchsia-400" />
                    <p className="text-sm font-medium text-slate-200">{selectedScenario.title}</p>
                  </div>
                  <p className="text-xs text-slate-500">{t('sessions:create.status')}: {selectedScenario.status}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}