import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {Filter, User, Activity, ChevronLeft, ChevronRight, Search, RotateCcw, FileText, ArrowRight, BarChart3, Clock,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { auditService } from '../../../services/auditService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

const ACTION_COLORS: Record<string, string> = {
  create: '#10b981',
  update: '#f59e0b',
  delete: '#ef4444',
  login: '#0ea5e9',
  logout: '#64748b',
  transition: '#8b5cf6',
  run: '#ec4899',
  share: '#f97316',
  approve: '#10b981',
  reject: '#ef4444',
  publish: '#22c55e',
  archive: '#64748b',
}

const MODULE_COLORS = [
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
]

const ENTITY_TYPES = [
  'user',
  'policy',
  'budget',
  'simulation_run',
  'cabinet_member',
  'session_share',
  'scenario',
  'election',
]

const ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'transition',
  'run',
  'share',
  'approve',
  'reject',
]

const MODULES = [
  'identity',
  'policies',
  'finance',
  'simulations',
  'government',
  'sessions',
  'elections',
  'institutions',
]

export function AuditDashboardPage() {
  const { t, i18n } = useTranslation('audit')

  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    module: '',
    actor_id: '',
    start_date: '',
    end_date: '',
  })

  const [limit] = useState(25)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-events', filters, limit, offset],
    queryFn: () =>
      auditService.listEvents({
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        ),
        limit,
        offset,
      }),
  })

  const { data: moduleSummary } = useQuery({
    queryKey: [
      'audit-summary-modules',
      filters.start_date,
      filters.end_date,
    ],
    queryFn: () =>
      auditService.summaryByModule(
        filters.start_date || undefined,
        filters.end_date || undefined
      ),
  })

  const { data: actionSummary } = useQuery({
    queryKey: [
      'audit-summary-actions',
      filters.start_date,
      filters.end_date,
    ],
    queryFn: () =>
      auditService.summaryByAction(
        filters.start_date || undefined,
        filters.end_date || undefined
      ),
  })

  const totalEvents = data?.total ?? 0

  const eventsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return (
      data?.data.filter((event) =>
        event.created_at.startsWith(today)
      ).length ?? 0
    )
  }, [data])

  const uniqueActors = useMemo(() => {
    const ids = new Set(
      data?.data.map((event) => event.actor_id).filter(Boolean)
    )

    return ids.size
  }, [data])

  const activeModules = useMemo(
    () =>
      new Set(
        data?.data.map((event) => event.module).filter(Boolean)
      ).size,
    [data]
  )

  const updateFilter = (key: string, value: string) => {
    setOffset(0)
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      entity_type: '',
      action: '',
      module: '',
      actor_id: '',
      start_date: '',
      end_date: '',
    })

    setOffset(0)
  }

  const hasFilters = Object.values(filters).some(
    (value) => value !== ''
  )

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <RequirePermission perm="audit.read">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 transition-colors"
          >
            <RotateCcw size={14} />
            {t('refresh')}
          </button>
        </RequirePermission>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('stats.totalEvents')}
          value={totalEvents.toLocaleString(i18n.language)}
          caption={t('stats.matchingFilters')}
        />

        <StatCard
          label={t('stats.eventsToday')}
          value={eventsToday.toString()}
          trend={{
            value: t('stats.liveTrail'),
            direction: 'up',
          }}
        />

        <StatCard
          label={t('stats.uniqueActors')}
          value={uniqueActors.toString()}
        />

        <StatCard
          label={t('stats.modulesActive')}
          value={activeModules.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-slate-500" />
            {t('charts.eventsByModule')}
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={moduleSummary ?? []}
              layout="vertical"
              margin={{ left: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                horizontal={false}
              />

              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
              />

              <YAxis
                type="category"
                dataKey="module"
                stroke="#64748b"
                fontSize={12}
                width={100}
                tickFormatter={(value) => value ?? 'unknown'}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                }}
                formatter={(value) => {
                  const count = Array.isArray(value)
                    ? Number(value[0] ?? 0)
                    : Number(value ?? 0)

                  return [
                    `${count} ${t('charts.count')}`,
                    t('charts.count'),
                  ]
                }}
              />

              <Bar
                dataKey="event_count"
                radius={[0, 4, 4, 0]}
              >
                {(moduleSummary ?? []).map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      MODULE_COLORS[
                        index % MODULE_COLORS.length
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            {t('charts.eventsByAction')}
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={actionSummary ?? []}
              layout="vertical"
              margin={{ left: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                horizontal={false}
              />

              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
              />

              <YAxis
                type="category"
                dataKey="action"
                stroke="#64748b"
                fontSize={12}
                width={80}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                }}
                formatter={(value) => {
                  const count = Array.isArray(value)
                    ? Number(value[0] ?? 0)
                    : Number(value ?? 0)

                  return [
                    `${count} ${t('charts.count')}`,
                    t('charts.count'),
                  ]
                }}
              />

              <Bar
                dataKey="event_count"
                radius={[0, 4, 4, 0]}
              >
                {(actionSummary ?? []).map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      ACTION_COLORS[entry.action] ??
                      '#64748b'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('filters.title')}
          </h3>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              {t('filters.clearAll')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.entityType')}
            </label>

            <select
              value={filters.entity_type}
              onChange={(event) =>
                updateFilter(
                  'entity_type',
                  event.target.value
                )
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="">
                {t('filters.allTypes')}
              </option>

              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.action')}
            </label>

            <select
              value={filters.action}
              onChange={(event) =>
                updateFilter('action', event.target.value)
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="">
                {t('filters.allActions')}
              </option>

              {ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.module')}
            </label>

            <select
              value={filters.module}
              onChange={(event) =>
                updateFilter('module', event.target.value)
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="">
                {t('filters.allModules')}
              </option>

              {MODULES.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.actorId')}
            </label>

            <input
              type="text"
              placeholder={t('filters.uuidPlaceholder')}
              value={filters.actor_id}
              onChange={(event) =>
                updateFilter(
                  'actor_id',
                  event.target.value
                )
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.from')}
            </label>

            <input
              type="date"
              value={filters.start_date}
              onChange={(event) =>
                updateFilter(
                  'start_date',
                  event.target.value
                )
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1">
              {t('filters.to')}
            </label>

            <input
              type="date"
              value={filters.end_date}
              onChange={(event) =>
                updateFilter(
                  'end_date',
                  event.target.value
                )
              }
              className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            {t('trail.title')}

            <span className="text-xs text-slate-500 font-normal">
              ({data?.data.length ?? 0} {t('trail.of')} {totalEvents})
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setOffset((current) =>
                  Math.max(0, current - limit)
                )
              }
              disabled={offset === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs text-slate-500 px-2">
              {t('trail.pageXofY', {
                page: Math.floor(offset / limit) + 1,
                total: Math.max(
                  1,
                  Math.ceil(totalEvents / limit)
                ),
              })}
            </span>

            <button
              onClick={() =>
                setOffset((current) =>
                  current + limit < totalEvents
                    ? current + limit
                    : current
                )
              }
              disabled={offset + limit >= totalEvents}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isLoading && (
          <p className="text-slate-400 text-sm">
            {t('trail.loading')}
          </p>
        )}

        {!isLoading && data?.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search
              size={32}
              className="text-slate-600 mb-3"
            />

            <p className="text-sm text-slate-400">
              {t('trail.noResultsTitle')}
            </p>

            <p className="text-xs text-slate-600 mt-1">
              {t('trail.noResultsDesc')}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {data?.data.map((evt) => {
            const actionColor =
              ACTION_COLORS[evt.action] ?? '#64748b'

            return (
              <Link
                key={evt.id}
                to={`/audits/events/${evt.id}`}
                className="group flex items-center gap-4 border border-slate-800 rounded-lg px-4 py-3 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${actionColor}15`,
                  }}
                >
                  <Activity
                    size={16}
                    style={{ color: actionColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        color: actionColor,
                        backgroundColor: `${actionColor}15`,
                      }}
                    >
                      {evt.action}
                    </span>

                    <span className="text-xs text-slate-500 capitalize">
                      {evt.entity_type.replace('_', ' ')}
                    </span>

                    {evt.module && (
                      <span className="text-[10px] text-slate-600 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                        {evt.module}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-slate-500">
                      {evt.entity_id.slice(0, 8)}…
                    </span>

                    {evt.actor_name && (
                      <>
                        <span>·</span>

                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {evt.actor_name}
                        </span>
                      </>
                    )}

                    {evt.before_state && evt.after_state && (
                      <>
                        <span>·</span>

                        <span className="text-orange-400/80">
                          {t('trail.stateChanged')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(
                      evt.created_at
                    ).toLocaleTimeString(i18n.language)}
                  </p>

                  <p className="text-[10px] text-slate-600">
                    {new Date(
                      evt.created_at
                    ).toLocaleDateString(i18n.language)}
                  </p>
                </div>

                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover:text-orange-500 transition-colors shrink-0"
                />
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}