import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Bookmark, Plus, Lock, Globe, Building2, Clock, BarChart3, Users, Archive, ChevronRight, Sparkles, FolderOpen
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sessionService } from '../../../services/sessionService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'
import { useAuthStore } from '../../../app/store'

const VISIBILITY_FILTERS = [
  { key: 'all', icon: FolderOpen },
  { key: 'private', icon: Lock },
  { key: 'shared', icon: Globe },
  { key: 'institutional', icon: Building2 },
]

const VISIBILITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  private: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: Lock },
  shared: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Globe },
  institutional: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: Building2 },
}

export function SessionsPage() {
  const { t, i18n } = useTranslation('sessions')
  const currentUser = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState('all')
  const { data, isLoading } = useQuery({
    queryKey: ['sessions', filter],
    queryFn: () => sessionService.listSessions(filter === 'all' ? undefined : filter),
  })

  const total = data?.length ?? 0
  const ownCount = useMemo(() => data?.filter((s) => s.owner_id === currentUser?.id).length ?? 0, [data, currentUser])
  const sharedCount = useMemo(() => data?.filter((s) => s.visibility === 'shared').length ?? 0, [data])
  const institutionalCount = useMemo(() => data?.filter((s) => s.visibility === 'institutional').length ?? 0, [data])

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <RequirePermission perm="session.create">
          <Link
            to="/sessions/new"
            className="flex items-center gap-2 bg-amber-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-amber-400 transition-colors h-fit"
          >
            <Plus size={16} />
            {t('newSession')}
          </Link>
        </RequirePermission>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('stats.total')} value={total.toLocaleString()} />
        <StatCard label={t('stats.owned')} value={ownCount.toLocaleString()} />
        <StatCard label={t('stats.shared')} value={sharedCount.toLocaleString()} trend={{ value: t('stats.collaborative'), direction: 'up' }} />
        <StatCard label={t('stats.institutional')} value={institutionalCount.toLocaleString()} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Archive size={16} className="text-slate-500" />
            {t('filterByVisibility')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {VISIBILITY_FILTERS.map((f) => {
            const Icon = f.icon
            const isActive = filter === f.key
            const count =
              f.key === 'all'
                ? total
                : data?.filter((s) => s.visibility === f.key).length ?? 0
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Icon size={12} />
                {t(`visibility.${f.key}`)}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.map((session) => {
          const vis = VISIBILITY_STYLES[session.visibility] ?? VISIBILITY_STYLES.private
          const VisIcon = vis.icon
          const isOwner = session.owner_id === currentUser?.id

          return (
            <Link key={session.id} to={`/sessions/${session.id}`}>
              <Card className="group hover:border-amber-500/40 transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Bookmark size={20} className="text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100 text-sm line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {session.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(session.updated_at).toLocaleDateString(i18n.language === 'ur' ? 'ur-PK' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${vis.bg} ${vis.text} ${vis.border}`}
                  >
                    <VisIcon size={10} />
                    {t(`visibility.${session.visibility}`)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">
                  {session.description ?? t('noDescription')}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    {!isOwner && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Users size={10} />
                        {t('sharedLabel')}
                      </span>
                    )}
                    {isOwner && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <Sparkles size={10} />
                        {t('owner')}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-600 group-hover:text-amber-500 transition-colors"
                  />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {data?.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
              <Bookmark size={24} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 mb-1">{t('emptyState.title')}</p>
            <p className="text-xs text-slate-600 max-w-xs">
              {t('emptyState.description')}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}