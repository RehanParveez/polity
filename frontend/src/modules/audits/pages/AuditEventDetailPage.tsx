import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {Shield, ArrowLeft, User, Clock, Box, FileJson, ChevronDown, ChevronUp, GitCompare, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { auditService } from '../../../services/auditService'

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

function DiffViewer({
  before,
  after,
}: {
  before: Record<string, any> | null
  after: Record<string, any> | null
}) {
  const { t } = useTranslation('audit')

  const [expandedKeys, setExpandedKeys] = useState<
    Record<string, boolean>
  >({})

  if (!before && !after) {
    return (
      <p className="text-xs text-slate-500 text-center py-6">
        {t('detail.diff.noState')}
      </p>
    )
  }

  const allKeys = Array.from(
    new Set([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ])
  ).sort()

  const toggle = (key: string) => {
    setExpandedKeys((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const hasBefore = Boolean(
          before && key in before
        )

        const hasAfter = Boolean(
          after && key in after
        )

        const beforeVal = before?.[key]
        const afterVal = after?.[key]

        const changed =
          JSON.stringify(beforeVal) !==
          JSON.stringify(afterVal)

        const isOpen = expandedKeys[key] ?? true

        let statusIcon = (
          <Box size={12} className="text-slate-500" />
        )

        let statusClass = 'text-slate-400'

        if (!hasBefore && hasAfter) {
          statusIcon = (
            <CheckCircle2
              size={12}
              className="text-emerald-400"
            />
          )

          statusClass = 'text-emerald-400'
        } else if (hasBefore && !hasAfter) {
          statusIcon = (
            <XCircle
              size={12}
              className="text-red-400"
            />
          )

          statusClass = 'text-red-400'
        } else if (changed) {
          statusIcon = (
            <GitCompare
              size={12}
              className="text-amber-400"
            />
          )

          statusClass = 'text-amber-400'
        }

        return (
          <div
            key={key}
            className={`border rounded-lg overflow-hidden transition-colors ${
              changed
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-slate-800 bg-slate-950/30'
            }`}
          >
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {statusIcon}

                <span
                  className={`text-xs font-mono font-medium ${statusClass}`}
                >
                  {key}
                </span>

                {!hasBefore && hasAfter && (
                  <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    {t('detail.diff.added')}
                  </span>
                )}

                {hasBefore && !hasAfter && (
                  <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                    {t('detail.diff.removed')}
                  </span>
                )}

                {changed &&
                  hasBefore &&
                  hasAfter && (
                    <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                      {t('detail.diff.changed')}
                    </span>
                  )}
              </div>

              {isOpen ? (
                <ChevronUp
                  size={12}
                  className="text-slate-500"
                />
              ) : (
                <ChevronDown
                  size={12}
                  className="text-slate-500"
                />
              )}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {hasBefore && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
                      {t('detail.diff.before')}
                    </p>

                    <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(
                        beforeVal,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {hasAfter && (
                  <div
                    className={`rounded-lg p-2.5 border ${
                      hasBefore
                        ? 'bg-orange-500/5 border-orange-500/10'
                        : 'bg-emerald-500/5 border-emerald-500/10'
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wider font-medium mb-1.5 ${
                        hasBefore
                          ? 'text-orange-400/70'
                          : 'text-emerald-400/70'
                      }`}
                    >
                      {hasBefore
                        ? t('detail.diff.after')
                        : t('detail.diff.value')}
                    </p>

                    <pre
                      className={`text-[11px] font-mono whitespace-pre-wrap break-all ${
                        hasBefore
                          ? 'text-orange-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {JSON.stringify(
                        afterVal,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AuditEventDetailPage() {
  const { t, i18n } = useTranslation('audit')

  const { eventId } = useParams<{
    eventId: string
  }>()

  const [showRaw, setShowRaw] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-event', eventId],
    queryFn: () => auditService.getEvent(eventId!),
    enabled: Boolean(eventId),
  })

  if (isLoading) {
    return (
      <p className="text-slate-400">
        {t('detail.loading')}
      </p>
    )
  }

  if (!data) {
    return (
      <p className="text-red-400">
        {t('detail.notFound')}
      </p>
    )
  }

  const evt = data

  const actionColor =
    ACTION_COLORS[evt.action] ?? '#64748b'

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/audits"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-400 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          {t('detail.backToTrail')}
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${actionColor}15`,
                }}
              >
                <Shield
                  size={20}
                  style={{ color: actionColor }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-100 capitalize">
                    {evt.action}
                  </h1>

                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: actionColor,
                      backgroundColor: `${actionColor}15`,
                      border: `1px solid ${actionColor}30`,
                    }}
                  >
                    {evt.entity_type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {evt.id}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
              <Clock size={10} />

              {new Date(
                evt.created_at
              ).toLocaleString(i18n.language)}
            </p>

            {evt.module && (
              <p className="text-[10px] text-slate-500 mt-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full inline-block">
                {evt.module}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <GitCompare
                  size={16}
                  className="text-slate-500"
                />
                {t('detail.stateDiff')}
              </h3>

              <div className="flex items-center gap-2">
                {evt.before_state && (
                  <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                    {t('detail.beforeKeys', {
                      count: Object.keys(
                        evt.before_state
                      ).length,
                    })}
                  </span>
                )}

                {evt.after_state && (
                  <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                    {t('detail.afterKeys', {
                      count: Object.keys(
                        evt.after_state
                      ).length,
                    })}
                  </span>
                )}
              </div>
            </div>

            <DiffViewer
              before={evt.before_state}
              after={evt.after_state}
            />
          </Card>

          <Card>
            <button
              onClick={() =>
                setShowRaw((current) => !current)
              }
              className="w-full flex items-center justify-between mb-2"
            >
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileJson
                  size={16}
                  className="text-slate-500"
                />
                {t('detail.eventMetadata')}
              </h3>

              {showRaw ? (
                <ChevronUp
                  size={14}
                  className="text-slate-500"
                />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-slate-500"
                />
              )}
            </button>

            {showRaw && (
              <pre className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(
                  evt.event_metadata,
                  null,
                  2
                )}
              </pre>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={12} />
              {t('detail.actor')}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t('detail.name')}
                </span>

                <span className="text-slate-200">
                  {evt.actor_name ??
                    t('detail.system')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t('detail.id')}
                </span>

                <span className="text-slate-300 font-mono text-xs">
                  {evt.actor_id
                    ? `${evt.actor_id.slice(0, 12)}…`
                    : '—'}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Box size={12} />
              {t('detail.targetEntity')}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t('detail.type')}
                </span>

                <span className="text-slate-200 capitalize">
                  {evt.entity_type.replace(
                    '_',
                    ' '
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t('detail.id')}
                </span>

                <span className="text-slate-300 font-mono text-xs">
                  {evt.entity_id.slice(0, 12)}…
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-orange-500/10 bg-orange-500/5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <AlertCircle
                  size={16}
                  className="text-orange-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">
                  {t('detail.immutableRecord')}
                </p>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('detail.immutableDesc')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}