import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { useAuthStore } from '../../../app/store'
import {LayoutDashboard, User, Shield, MapPin, Mail, Calendar, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Activity, Clock, KeyRound, Fingerprint,
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const permissionCount = user?.permissions.length ?? 0
  const jurisdictionCount = 0
  const accountAge = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name ?? 'User'}`}
        subtitle={user?.email ?? 'No email on record'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Account status"
          value={user?.is_active ? 'Active' : 'Inactive'}
          trend={{ value: user?.is_active ? 'Verified' : 'Suspended', direction: user?.is_active ? 'up' : 'down' }}
        />
        <StatCard
          label="Permissions granted"
          value={String(permissionCount)}
          trend={{ value: permissionCount > 5 ? 'Elevated access' : 'Standard access', direction: 'up' }}
        />
        <StatCard
          label="Assigned jurisdictions"
          value={String(jurisdictionCount)}
          trend={{ value: jurisdictionCount > 0 ? 'Mapped' : 'None assigned', direction: jurisdictionCount > 0 ? 'up' : 'down' }}
        />
        <StatCard
          label="Account age"
          value={accountAge !== null ? `${accountAge} days` : '—'}
          caption={user?.created_at ? `Since ${new Date(user.created_at).toLocaleDateString()}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-400" />
            Profile overview
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-slate-400">
                {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-medium text-slate-100 truncate">{user?.full_name ?? 'Unnamed user'}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Mail size={10} />
                {user?.email ?? 'No email'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Fingerprint size={10} />
                ID: {user?.id ?? '—'}
              </p>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield size={12} className="text-slate-600" />
                Role
              </span>
              <span className="text-slate-200 font-medium">{user?.role ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Activity size={12} className="text-slate-600" />
                Status
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                user?.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {user?.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock size={12} className="text-slate-600" />
                Member since
              </span>
              <span className="text-slate-200">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            Permissions & access
          </h3>

          {permissionCount === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
              <ShieldAlert size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No permissions assigned to this account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Access level</span>
                <span className="text-slate-100 font-medium">{permissionCount} permission{permissionCount > 1 ? 's' : ''}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(permissionCount * 5, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user?.permissions.map((perm, i) => (
                  <div
                    key={`${perm}-${i}`}
                    className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2"
                  >
                    <KeyRound size={12} className="text-slate-600 shrink-0" />
                    <span className="text-xs text-slate-300 truncate">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${
              user?.is_active
                ? permissionCount > 10
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {user?.is_active ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {user?.is_active
                ? permissionCount > 10
                  ? 'High privilege account'
                  : 'Standard access'
                : 'Account disabled'}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Security status</p>
              <p className="text-sm font-medium text-slate-200">{user?.is_active ? 'Protected' : 'Restricted'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <MapPin size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Jurisdictions</p>
              <p className="text-sm font-medium text-slate-200">{jurisdictionCount} mapped</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Calendar size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Last updated</p>
              <p className="text-sm font-medium text-slate-200">
                {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}