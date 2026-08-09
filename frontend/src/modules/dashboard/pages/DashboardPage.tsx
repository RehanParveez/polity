import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { useAuthStore } from '../../../app/store'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.full_name ?? ''}`} subtitle={user?.email} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Account status" value={user?.is_active ? 'Active' : 'Inactive'} />
        <StatCard label="Permissions granted" value={String(user?.permissions.length ?? 0)} />
        <StatCard label="Assigned jurisdictions" value="0" caption="Jurisdiction assignment lands in Phase 3" />
      </div>
    </div>
  )
}