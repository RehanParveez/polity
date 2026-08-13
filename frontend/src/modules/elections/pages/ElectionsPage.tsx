import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Vote, Plus, Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight, BarChart3, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { electionsService } from '../../../services/electionsService'

export function ElectionsPage() {
  const { t } = useTranslation(['elections', 'common'])
  const { data, isLoading, error } = useQuery({
    queryKey: ['elections'],
    queryFn: electionsService.listElections,
  })

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (error) return <p className="text-red-400">{t('couldNotLoad', { resource: t('title') })}</p>

  const now = new Date()
  const totalElections = data?.length ?? 0
  const upcomingElections = data?.filter((e) => new Date(e.election_date) > now) ?? []
  const pastElections = data?.filter((e) => new Date(e.election_date) <= now) ?? []
  const scheduledCount = data?.filter((e) => e.status === 'scheduled').length ?? 0
  const completedCount = data?.filter((e) => e.status === 'completed').length ?? 0
  const nextElection = upcomingElections.sort((a, b) =>
    new Date(a.election_date).getTime() - new Date(b.election_date).getTime()
  )[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <Link
          to="/elections/new"
          className="flex items-center gap-2 bg-violet-500 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-violet-400 transition-colors h-fit"
        >
          <Plus size={16} />
          {t('newElection')}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalElections')} value={String(totalElections)} />
        <StatCard
          label={t('upcoming')}
          value={String(upcomingElections.length)}
          trend={{ value: `${pastElections.length} ${t('concluded')}`, direction: 'up' }}
        />
        <StatCard label={t('scheduled')} value={String(scheduledCount)} />
        <StatCard
          label={t('statuses.completed', { ns: 'common' })}
          value={String(completedCount)}
          trend={{ value: `${totalElections - completedCount} ${t('statuses.pending', { ns: 'common' })}`, direction: 'up' }}
        />
      </div>

      {nextElection && (
        <Link to={`/elections/${nextElection.id}`} className="block mb-6">
          <Card className="border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Vote size={28} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-100 text-lg">{nextElection.name}</p>
                  <span className="text-[10px] uppercase tracking-wider font-medium bg-violet-500/20 text-violet-400 px-2.5 py-1 rounded-full">
                    {t('nextElection')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(nextElection.election_date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <Calendar size={12} className="text-violet-400" />
                    <span className="text-slate-500">{t('date')}:</span>
                    <span className="text-slate-200">{nextElection.election_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <BarChart3 size={12} className="text-blue-400" />
                    <span className="text-slate-500">{t('system')}:</span>
                    <span className="text-slate-200">{nextElection.system}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <Clock size={12} className="text-amber-400" />
                    <span className="text-slate-500">{t('status')}:</span>
                    <span className="text-slate-200 capitalize">{t(`statuses.${nextElection.status}`, { defaultValue: nextElection.status.replace('_', ' ') })}</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
            </div>
          </Card>
        </Link>
      )}

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-slate-500" />
          {t('allElections')}
        </h3>

        {data?.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
            <Vote size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{t('noElectionsOnRecord')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.map((election) => {
              const electionDate = new Date(election.election_date)
              const isPast = electionDate <= now
              const daysDiff = Math.ceil(Math.abs(electionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <Link key={election.id} to={`/elections/${election.id}`} className="block">
                  <div className="group bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-900/40 transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          election.status === 'completed'
                            ? 'bg-emerald-500/10'
                            : election.status === 'active'
                            ? 'bg-violet-500/10'
                            : 'bg-slate-900 border border-slate-800'
                        }`}>
                          <Vote size={18} className={
                            election.status === 'completed'
                              ? 'text-emerald-400'
                              : election.status === 'active'
                              ? 'text-violet-400'
                              : 'text-slate-500'
                          } />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-100 text-sm truncate">{election.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            {election.election_date}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        election.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : election.status === 'active'
                          ? 'bg-violet-500/10 text-violet-400'
                          : election.status === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {election.status === 'completed' && <CheckCircle2 size={10} />}
                        {election.status === 'active' && <BarChart3 size={10} />}
                        {election.status === 'scheduled' && <Clock size={10} />}
                        {t(`statuses.${election.status}`, { defaultValue: election.status.replace('_', ' ') })}
                      </span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        {isPast ? (
                          <>
                            <CheckCircle2 size={10} />
                            {t('daysAgo', { count: daysDiff })}
                          </>
                        ) : (
                          <>
                            <Clock size={10} />
                            {t('daysLeft', { count: daysDiff })}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}