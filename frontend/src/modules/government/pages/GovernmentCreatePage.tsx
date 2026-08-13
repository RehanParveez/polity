import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Calendar, Landmark, Crown, UserCheck, ArrowLeft, Shield, FileText, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { governmentService } from '../../../services/governmentService'

export function GovernmentCreatePage() {
  const { t } = useTranslation(['government', 'common'])
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [formedDate, setFormedDate] = useState('')
  const [headOfState, setHeadOfState] = useState('')
  const [headOfGovt, setHeadOfGovt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const gov = await governmentService.createGovernment({
        name,
        formed_date: formedDate,
        head_of_state_name: headOfState || null,
        head_of_government_name: headOfGovt || null,
      })
      navigate(`/governments/${gov.id}`)
    } catch {
      setError(t('createError'))
    } finally {
      setLoading(false)
    }
  }

  const isValid = name.trim().length > 0 && formedDate.length > 0

  return (
    <div>
      <PageHeader
        title={t('formNewGovernment')}
        subtitle={t('createSubtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Landmark size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-200">{t('administrationDetails')}</h3>
                <p className="text-xs text-slate-500">{t('requiredFieldsMarked')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label={`${t('governmentName')} *`}
                  icon={Landmark}
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                <TextField
                  label={`${t('formedDate')} *`}
                  icon={Calendar}
                  type="date"
                  value={formedDate}
                  onChange={(e) => setFormedDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label={t('headOfStateTitle')}
                  icon={Crown}
                  placeholder={t('headOfStatePlaceholder')}
                  value={headOfState}
                  onChange={(e) => setHeadOfState(e.target.value)}
                />
                <TextField
                  label={t('headOfGovernmentTitle')}
                  icon={UserCheck}
                  placeholder={t('headOfGovernmentPlaceholder')}
                  value={headOfGovt}
                  onChange={(e) => setHeadOfGovt(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" loading={loading} disabled={!isValid}>
                  <Shield size={16} className="mr-1.5" />
                  {t('formGovernmentBtn')}
                </Button>
                <Link
                  to="/governments"
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  {t('backToGovernments')}
                </Link>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            {t('formationPreview')}
          </h3>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Landmark size={24} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {name.trim() || t('untitledGovernment')}
                </p>
                <p className="text-xs text-slate-500">
                  {formedDate ? t('formedOn', { date: formedDate }) : t('formationDatePending')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Crown size={14} className="text-amber-500/60 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{t('headOfState')}</p>
                  <p className="text-slate-300">{headOfState.trim() || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck size={14} className="text-amber-500/60 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{t('headOfGovernment')}</p>
                  <p className="text-slate-300">{headOfGovt.trim() || '—'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-500/10">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {isValid ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">{t('readyToForm')}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} className="text-amber-400" />
                    <span>{t('completeRequiredFields')}</span>
                  </>
                )}
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <Card>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                {t('guidelines')}
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {t('guidelineName')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {t('guidelineDate')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {t('guidelineUpdate')}
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}