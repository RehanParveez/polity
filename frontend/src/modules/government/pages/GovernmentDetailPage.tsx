import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Crown, UserCheck, ShieldCheck, Users, Scale, Building2, Calendar, Gavel, ChevronRight, Landmark, FileCheck,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { governmentService } from '../../../services/governmentService'

const GOVERNMENT_COLORS = {
  primary: '#6366f1',  
  success: '#10b981',   
  warning: '#f59e0b',   
  muted: '#64748b',    
}

export function GovernmentDetailPage() {
  const { t } = useTranslation(['government', 'common'])
  const { governmentId } = useParams<{ governmentId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['government', governmentId],
    queryFn: () => governmentService.getGovernment(governmentId!),
    enabled: !!governmentId,
  })

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>
  if (error || !data) return <p className="text-red-400">{t('couldNotLoad', { resource: t('title') })}</p>

  const activeMembers = data.cabinet_members.filter((m) => m.is_active)
  const oathCount = activeMembers.filter((m) => m.oath_taken).length
  const oathPct = activeMembers.length > 0 ? Math.round((oathCount / activeMembers.length) * 100) : 0

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle={`${t('formedOn', { date: data.formed_date })} · ${t(`statuses.${data.status}`, { defaultValue: data.status.replace('_', ' ') })} · ${activeMembers.length} ${t('cabinetMembers')}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('headOfState')}
          value={data.head_of_state_name ?? t('unassigned')}
          caption={data.head_of_state_user_id ? t('linkedToUser') : t('placeholder')}
        />
        <StatCard
          label={t('headOfGovernment')}
          value={data.head_of_government_name ?? t('unassigned')}
          caption={data.head_of_government_user_id ? t('linkedToUser') : t('placeholder')}
        />
        <StatCard
          label={t('cabinetSize')}
          value={String(activeMembers.length)}
          trend={{ value: t('withMinistry', { count: activeMembers.filter(m => m.ministry).length }), direction: 'up' }}
        />
        <StatCard
          label={t('oathsTaken')}
          value={`${oathCount} / ${activeMembers.length}`}
          trend={{ value: t('pctComplete', { pct: oathPct }), direction: oathPct >= 80 ? 'up' : 'down' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Landmark size={16} className="text-indigo-400" />
            {t('governmentStructure')}
          </h3>
          <div className="space-y-4">
            <div className="relative pl-4 border-l-2 border-indigo-500/30">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium mb-0.5">
                {t('headOfState')}
              </p>
              <p className="text-sm font-medium text-slate-100">
                {data.head_of_state_name ?? t('vacant')}
              </p>
              <p className="text-xs text-slate-500">
                {data.head_of_state_user_id ? t('userAccountLinked') : t('noUserLinked')}
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-indigo-500/30">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium mb-0.5">
                {t('headOfGovernment')}
              </p>
              <p className="text-sm font-medium text-slate-100">
                {data.head_of_government_name ?? t('vacant')}
              </p>
              <p className="text-xs text-slate-500">
                {data.head_of_government_user_id ? t('userAccountLinked') : t('noUserLinked')}
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-700">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-600" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">
                {t('cabinet')}
              </p>
              <p className="text-sm font-medium text-slate-200">
                {t('activeMembers', { count: activeMembers.length })}
              </p>
              <p className="text-xs text-slate-500">
                {t('swornIn', { count: activeMembers.filter(m => m.oath_taken).length })}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{t('governmentStatus')}</span>
              <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${
                data.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : data.status === 'dissolved'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {t(`statuses.${data.status}`, { defaultValue: data.status.replace('_', ' ') })}
              </span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              {t('cabinetMembers')}
            </h3>
            <span className="text-xs text-slate-500">
              {t('swornInOf', { sworn: oathCount, total: activeMembers.length })}
            </span>
          </div>

          {activeMembers.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
              <Scale size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">{t('noCabinetMembers')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="group bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-900/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 text-sm">
                          {member.portfolio}
                        </p>
                        {member.oath_taken ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            <FileCheck size={10} />
                            {t('sworn')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                            <Gavel size={10} />
                            {t('pendingOath')}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        {member.ministry ? (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-600" />
                            {member.ministry.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building2 size={12} />
                            {t('noMinistryLinked')}
                          </span>
                        )}
                        {member.ministry?.code && (
                          <span className="text-[10px] uppercase tracking-wider text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">
                            {member.ministry.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm text-slate-200">
                        {member.user?.full_name ?? (
                          <span className="text-slate-600 italic">{t('vacant')}</span>
                        )}
                      </p>
                      {member.user ? (
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                          <UserCheck size={10} />
                          {t('accountLinked')}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-600 mt-0.5">{t('noAccount')}</p>
                      )}
                    </div>
                  </div>

                  {!member.oath_taken && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                        <span>{t('oathProgress')}</span>
                        <span>{t('awaitingCeremony')}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-amber-500/50"
                          style={{ width: '35%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeMembers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">{t('oathCompletionRate')}</span>
                <span className="text-slate-100 font-medium">{oathPct}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${oathPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">
                {t('membersSwornInPending', { sworn: oathCount, pending: activeMembers.length - oathCount })}
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Calendar size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('formedDate')}</p>
              <p className="text-sm font-medium text-slate-200">{data.formed_date}</p>
            </div>
          </div>
        </Card>

        <Card>
         <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
             <Crown size={18} className="text-slate-500" />
           </div>
          <div>
           <p className="text-xs text-slate-500">{t('leadership')}</p>
           <p className="text-sm font-medium text-slate-200">
             {data.head_of_state_user_id && data.head_of_government_user_id
               ? t('fullyLinked')
               : data.head_of_state_user_id || data.head_of_government_user_id
               ? t('partiallyLinked')
               : t('noUsersLinked')}
           </p>
          </div>
         </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <ShieldCheck size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('legitimacyStatus')}</p>
              <p className="text-sm font-medium text-slate-200 capitalize">
                {t(`statuses.${data.status}`, { defaultValue: data.status.replace('_', ' ') })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}