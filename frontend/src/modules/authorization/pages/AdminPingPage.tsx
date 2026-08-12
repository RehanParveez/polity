import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../../../services/apiClient'
import { RequirePermission } from '../../../components/permissions/RequirePermission'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import {Shield, ShieldCheck, ShieldAlert, Activity, Server, Clock, RefreshCw, Terminal, CheckCircle2, XCircle, Loader2, Radio, Zap,
} from 'lucide-react'

function PingContent() {
  const [result, setResult] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [latency, setLatency] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState<string | null>(null)

  const ping = useCallback(async () => {
    setStatus('loading')
    setResult(null)
    const start = performance.now()
    try {
      const res = await apiClient.get('/authorization/ping')
      const end = performance.now()
      setLatency(Math.round(end - start))
      setResult(JSON.stringify(res.data, null, 2))
      setTimestamp(new Date().toLocaleString())
      setStatus('success')
    } catch {
      const end = performance.now()
      setLatency(Math.round(end - start))
      setResult('Connection failed — authorization service unreachable.')
      setTimestamp(new Date().toLocaleString())
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    ping()
  }, [ping])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Service status"
          value={status === 'success' ? 'Online' : status === 'error' ? 'Offline' : 'Checking…'}
          trend={{ value: status === 'success' ? 'Operational' : status === 'error' ? 'Degraded' : 'Pending', direction: status === 'success' ? 'up' : status === 'error' ? 'down' : 'up' }}
        />
        <StatCard
          label="Response time"
          value={latency !== null ? `${latency}ms` : '—'}
          trend={{ value: latency !== null && latency < 300 ? 'Fast' : latency !== null ? 'Slow' : '—', direction: latency !== null && latency < 300 ? 'up' : 'down' }}
        />
        <StatCard
          label="Last checked"
          value={timestamp ?? '—'}
          caption={timestamp ? 'Local time' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Terminal size={16} className="text-emerald-400" />
              Response payload
            </h3>
            <button
              onClick={ping}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 hover:border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={status === 'loading' ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className={`rounded-xl border p-4 font-mono text-xs leading-relaxed overflow-x-auto ${
            status === 'success'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
              : status === 'error'
              ? 'bg-red-500/5 border-red-500/20 text-red-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            {status === 'loading' ? (
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Calling /authorization/ping…</span>
              </div>
            ) : (
              <pre>{result}</pre>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${
              status === 'success'
                ? 'bg-emerald-500/10 text-emerald-400'
                : status === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {status === 'success' ? <CheckCircle2 size={10} /> : status === 'error' ? <XCircle size={10} /> : <Loader2 size={10} className="animate-spin" />}
              {status === 'success' ? 'Healthy' : status === 'error' ? 'Failed' : 'Pending'}
            </span>
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Radio size={10} />
              Endpoint: /authorization/ping
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            System health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={14} className={status === 'success' ? 'text-emerald-400' : 'text-red-400'} />
                <span className="text-sm text-slate-400">Authorization service</span>
              </div>
              <span className={`text-xs font-medium ${status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {status === 'success' ? 'Online' : status === 'error' ? 'Offline' : '…'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-sm text-slate-400">Permission check</span>
              </div>
              <span className="text-xs font-medium text-emerald-400">Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className={latency !== null && latency < 300 ? 'text-emerald-400' : latency !== null ? 'text-amber-400' : 'text-slate-600'} />
                <span className="text-sm text-slate-400">Latency grade</span>
              </div>
              <span className={`text-xs font-medium ${
                latency === null ? 'text-slate-600' : latency < 100 ? 'text-emerald-400' : latency < 300 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {latency === null ? '—' : latency < 100 ? 'Excellent' : latency < 300 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-600" />
                <span className="text-sm text-slate-400">Protocol</span>
              </div>
              <span className="text-xs font-medium text-slate-500">HTTP GET</span>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500">Response time</span>
                <span className="text-slate-100 font-medium">{latency !== null ? `${latency}ms` : '—'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    latency === null ? 'bg-slate-700' : latency < 150 ? 'bg-emerald-500' : latency < 400 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: latency !== null ? `${Math.min((latency / 500) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function AdminPingPage() {
  return (
    <div>
      <PageHeader
        title="Admin check"
        subtitle="Authorization service health and connectivity diagnostics"
      />

      <RequirePermission
        perm="authorization.role.manage"
        fallback={
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
            <ShieldAlert size={24} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Access denied</p>
              <p className="text-xs text-slate-500 mt-1">
                You don't have permission to view admin diagnostics. Required permission: authorization.role.manage
              </p>
            </div>
          </div>
        }
      >
        <PingContent />
      </RequirePermission>
    </div>
  )
}