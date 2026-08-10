import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Landmark, Plus, Crown, UserCheck, Building2 } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { governmentService } from '../../../services/governmentService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

export function GovernmentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['governments'],
    queryFn: governmentService.listGovernments,
  })

  const activeGov = data?.find((g) => g.status === 'active')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Government" subtitle="Cabinet formation and administration" />
        <RequirePermission perm="government.manage">
          <Link
            to="/governments/new"
            className="flex items-center gap-2 bg-teal-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-teal-400 transition-colors h-fit"
          >
            <Plus size={16} />
            Form government
          </Link>
        </RequirePermission>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">Could not load governments.</p>}

      {activeGov && (
        <Link to={`/governments/${activeGov.id}`} className="block mb-6">
          <Card className="border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                <Landmark size={24} className="text-teal-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-100">{activeGov.name}</p>
                  <span className="text-[10px] uppercase tracking-wider font-medium bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Formed {activeGov.formed_date}</p>
                <div className="flex gap-4 mt-2">
                  {activeGov.head_of_state_name && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Crown size={12} /> {activeGov.head_of_state_name}
                    </span>
                  )}
                  {activeGov.head_of_government_name && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <UserCheck size={12} /> {activeGov.head_of_government_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data
          ?.filter((g) => g.status !== 'active')
          .map((gov) => (
            <Link key={gov.id} to={`/governments/${gov.id}`}>
              <Card className="hover:border-teal-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{gov.name}</p>
                    <p className="text-xs text-slate-500">
                      {gov.formed_date} · {gov.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  )
}