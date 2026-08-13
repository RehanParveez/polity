import { useTranslation } from 'react-i18next'
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {FlaskConical, ArrowLeft, Sparkles, BrainCircuit, Lock, Globe, Plus, Trash2, AlertCircle, Lightbulb, Zap,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { simulationService } from '../../../services/processService'

const VISIBILITY_OPTIONS = [
  { key: 'private', labelKey: 'visibilityPrivate', icon: Lock, descKey: 'visibilityPrivateDesc' },
  { key: 'shared', labelKey: 'visibilityShared', icon: Globe, descKey: 'visibilitySharedDesc' },
]

export function ScenarioCreatePage() {
  const { t } = useTranslation(['process', 'common'])
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [inputs, setInputs] = useState<Array<{ rule_name: string; parameter_name: string; parameter_value: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: rules } = useQuery({
    queryKey: ['simulation-rules'],
    queryFn: simulationService.listRules,
  })

  const createMutation = useMutation({
    mutationFn: simulationService.createScenario,
    onSuccess: (scenario) => {
      Promise.all(
        inputs.map((inp) => simulationService.addInput(scenario.id, inp))
      ).then(() => {
        navigate(`/process/${scenario.id}`)
      })
    },
    onError: () => {
      setError(t('createError'))
      setLoading(false)
    },
  })

  const addInputRow = () => setInputs([...inputs, { rule_name: '', parameter_name: '', parameter_value: '' }])
  const removeInputRow = (idx: number) => setInputs(inputs.filter((_, i) => i !== idx))
  const updateInput = (idx: number, field: string, value: string) => {
    const next = [...inputs]
    next[idx] = { ...next[idx], [field]: value }
    setInputs(next)
  }

  const titleValid = title.length >= 1
  const canSubmit = titleValid && !loading

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    createMutation.mutate({
      title,
      description: description || null,
      visibility,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/process" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-fuchsia-400 transition-colors mb-3">
          <ArrowLeft size={14} />
          {t('backToSimulations')}
        </Link>
        <PageHeader title={t('newScenarioTitle')} subtitle={t('configureSubtitle')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <TextField
                label={t('scenarioTitle')}
                icon={FlaskConical}
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={4}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-colors resize-none"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-600">{t('descriptionHint')}</span>
                  <span className="text-[10px] text-slate-600">{t('charCount', { count: description.length })}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('visibilityLabel')}</label>
                <div className="grid grid-cols-2 gap-3">
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
                            ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon size={18} />
                        <div>
                          <p className="text-sm font-medium">{t(opt.labelKey)}</p>
                          <p className="text-[10px] text-slate-500">{t(opt.descKey)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Zap size={14} className="text-slate-500" />
                    {t('ruleInputs')}
                  </label>
                  <button
                    type="button"
                    onClick={addInputRow}
                    className="flex items-center gap-1 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    <Plus size={12} />
                    {t('addParameter')}
                  </button>
                </div>

                <div className="space-y-3">
                  {inputs.map((inp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <select
                        value={inp.rule_name}
                        onChange={(e) => updateInput(idx, 'rule_name', e.target.value)}
                        className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-500 appearance-none cursor-pointer min-w-[180px]"
                      >
                        <option value="" className="bg-slate-900">{t('selectRule')}</option>
                        {rules?.map((r) => (
                          <option key={r.id} value={r.rule_name} className="bg-slate-900">
                            {r.rule_name.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={t('parameterName')}
                        value={inp.parameter_name}
                        onChange={(e) => updateInput(idx, 'parameter_name', e.target.value)}
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
                      />
                      <input
                        type="text"
                        placeholder={t('value')}
                        value={inp.parameter_value}
                        onChange={(e) => updateInput(idx, 'parameter_value', e.target.value)}
                        className="w-28 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeInputRow(idx)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {inputs.length === 0 && (
                    <p className="text-xs text-slate-600 italic">{t('noInputsYet')}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={loading} className="w-auto px-6">
                  <Sparkles size={16} className="mr-1.5" />
                  {t('createScenarioBtn')}
                </Button>
                <Link to="/process" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {t('common:cancel')}
                </Link>
              </div>
            </form>
          </Card>

          <Card className="border-fuchsia-500/10 bg-fuchsia-500/5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                <Lightbulb size={16} className="text-fuchsia-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{t('howSimulationsWork')}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('howSimulationsWorkDesc')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={12} />
              {t('livePreview')}
            </h3>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                    <FlaskConical size={20} className="text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-sm line-clamp-2">
                      {title || t('untitledScenario')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t(`visibility.${visibility}`)} · {t('inputCount', { count: inputs.length })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {t('statuses.draft')}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-3">
                {description || t('noDescription')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/40 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-slate-200">{inputs.length}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('inputs')}</p>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-slate-200">0</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('runs')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BrainCircuit size={12} />
              {t('activeRules')}
            </h3>
            <div className="space-y-3">
              {rules?.map((rule) => (
                <div key={rule.id} className="border border-slate-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-200 capitalize">
                    {rule.rule_name.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rule.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rule.affected_indicator_codes.map((code: string) => (
                      <span key={code} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {code.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}