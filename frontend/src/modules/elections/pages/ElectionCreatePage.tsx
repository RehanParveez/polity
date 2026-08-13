import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Calendar, FileText, Vote, ArrowLeft, AlertCircle, Info, Clock, Users, Flag, CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { electionsService } from '../../../services/electionsService'

export function ElectionCreatePage() {
  const { t } = useTranslation(['elections', 'common'])
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [electionDate, setElectionDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const election = await electionsService.createElection(name, electionDate)
      navigate(`/elections/${election.id}`)
    } catch {
      setError(t('createError'))
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = name.trim().length > 0 && electionDate.length > 0
  const daysUntil = electionDate
    ? Math.ceil((new Date(electionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div>
      <PageHeader
        title={t('newElection')}
        subtitle={t('subtitle')}
      />

      {error && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">{t('failedToCreate')}</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Vote size={20} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-100">{t('electionDetails')}</h3>
                <p className="text-xs text-slate-500">{t('configureParameters')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <TextField
                label={t('electionName')}
                icon={FileText}
                placeholder={t('electionNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              <TextField
                label={t('electionDate')}
                icon={Calendar}
                type="date"
                value={electionDate}
                onChange={(e) => setElectionDate(e.target.value)}
                required
              />

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to="/elections"
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft size={14} />
                  {t('backToElections')}
                </Link>
                <Button type="submit" loading={loading} disabled={!isFormValid}>
                  <Vote size={16} className="mr-1.5" />
                  {t('createElection')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Info size={16} className="text-violet-400" />
              {t('preview')}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Flag size={20} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{t('electionName')}</p>
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {name.trim() || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{t('electionDate')}</p>
                  <p className="text-sm font-medium text-slate-100">
                    {electionDate
                      ? new Date(electionDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              {daysUntil !== null && !isNaN(daysUntil) && (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Clock size={20} className={daysUntil >= 0 ? 'text-violet-400' : 'text-red-400'} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('timeUntilElection')}</p>
                    <p className={`text-sm font-medium ${daysUntil >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
                      {daysUntil >= 0
                        ? t('daysLeft', { count: daysUntil })
                        : t('dateIsInThePast')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${
                isFormValid
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {isFormValid ? <CheckCircle2 size={12} /> : <Info size={12} />}
                {isFormValid ? t('readyToCreate') : t('fillInAllFields')}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              {t('whatsNext')}
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-violet-400">1</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('step1')}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">2</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('step2')}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">3</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('step3')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}