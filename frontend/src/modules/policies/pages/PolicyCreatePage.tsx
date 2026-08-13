import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {FileText, AlignLeft, Send, ArrowLeft, Sparkles, Gavel, Clock, CheckCircle2, ShieldCheck, BarChart3, Landmark, AlertCircle, Lightbulb,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { policyService } from '../../../services/policyService'
import { institutionsService } from '../../../services/institutionsService'

export function PolicyCreatePage() {
  const { t } = useTranslation(['policies', 'common'])
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ministryId, setMinistryId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: institutionsService.listMinistries,
  })

  const titleValid = title.length >= 5
  const descValid = description.length === 0 || description.length >= 20
  const canSubmit = titleValid && !loading

  const selectedMinistry = ministries?.find((m) => m.id === ministryId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload: {
        title: string
        description: string | null
        ministry_id?: string
      } = {
        title,
        description: description || null,
      }
      if (ministryId) payload.ministry_id = ministryId

      const policy = await policyService.createPolicy(payload)
      navigate(`/policies/${policy.id}`)
    } catch {
      setError(t('createPolicyErrorDetailed'))
    } finally {
      setLoading(false)
    }
  }

  const workflowSteps = [
    { icon: FileText, label: t('stepDraft'), desc: t('stepDraftDesc') },
    { icon: Clock, label: t('stepUnderReview'), desc: t('stepUnderReviewDesc') },
    { icon: Gavel, label: t('stepApproval'), desc: t('stepApprovalDesc') },
    { icon: ShieldCheck, label: t('stepImplemented'), desc: t('stepImplementedDesc') },
    { icon: BarChart3, label: t('stepEvaluated'), desc: t('stepEvaluatedDesc') },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link to="/policies" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors mb-3">
          <ArrowLeft size={14} />
          {t('backToPolicies')}
        </Link>
        <PageHeader title={t('newPolicyProposal')} subtitle={t('draftPolicySubtitle')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <TextField
                  label={t('policyTitle')}
                  icon={FileText}
                  placeholder={t('policyTitlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
                <div className="flex justify-between mt-1.5">
                  <span className={`text-[10px] ${titleValid ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
                    {title.length >= 5 ? t('titleLooksGood') : t('atLeast5CharsRequired')}
                  </span>
                  <span className="text-[10px] text-slate-600">{title.length} {t('chars')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Landmark size={14} className="text-slate-500" />
                  {t('linkedMinistry')}
                </label>
                <div className="relative">
                  <select
                    value={ministryId}
                    onChange={(e) => setMinistryId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">{t('selectMinistryOptional')}</option>
                    {ministries?.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  {t('ministryLinkHelp')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <AlignLeft size={14} className="text-slate-500" />
                  {t('description')}
                </label>
                <div className="relative">
                  <AlignLeft size={18} className="absolute left-3.5 top-3 text-slate-500" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={6}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className={`text-[10px] ${descValid ? 'text-slate-600' : 'text-amber-500/70'}`}>
                    {description.length > 0 && description.length < 20
                      ? t('consider20Chars')
                      : t('goodDescriptionHelp')}
                  </span>
                  <span className="text-[10px] text-slate-600">{description.length} {t('chars')}</span>
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
                  {t('createDraft')}
                </Button>
                <Link
                  to="/policies"
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {t('cancel')}
                </Link>
              </div>
            </form>
          </Card>

          <Card className="border-violet-500/10 bg-violet-500/5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Lightbulb size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{t('whatHappensAfterCreation')}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('afterCreationTip')}
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
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-sm line-clamp-2">
                      {title || t('untitledPolicy')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      v1 · {t('statuses.draft', { ns: 'common' })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {t('statuses.draft', { ns: 'common' })}
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                <div className="h-1.5 rounded-full bg-violet-400" style={{ width: '0%' }} />
              </div>

              {selectedMinistry && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Landmark size={12} className="text-slate-500" />
                  {selectedMinistry.name}
                </div>
              )}

              <p className="text-xs text-slate-500 line-clamp-3">
                {description || t('noDescriptionProvided')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/40 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-slate-200">0</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('indicators')}</p>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-slate-200">0</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('milestones')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gavel size={12} />
              {t('approvalWorkflow')}
            </h3>
            <div className="relative space-y-4">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-800" />
              {workflowSteps.map((step, idx) => {
                const StepIcon = step.icon
                return (
                  <div key={step.label} className="relative flex items-start gap-3 pl-1">
                    <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center border ${
                      idx === 0
                        ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}>
                      <StepIcon size={14} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${idx === 0 ? 'text-violet-300' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}