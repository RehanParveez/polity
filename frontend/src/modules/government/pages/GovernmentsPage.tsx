import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Landmark, Plus, Crown, UserCheck, Building2, History, Users, ArrowRight } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { governmentService } from '../../../services/governmentService'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

export function GovernmentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['governments'],
    queryFn: governmentService.listGovernments,
  })

  const activeGov = data?.find((g) => g.status === 'active')
  const pastGovs = data?.filter((g) => g.status !== 'active') ?? []
  const totalCabinetMembers = data?.reduce((acc, g) => acc + (g.cabinet_members?.length ?? 0), 0) ?? 0

  if (isLoading) return <p className="text-slate-400">Loading governments…</p>
  if (error) return <p className="text-red-400">Could not load governments.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Government" subtitle="Cabinet formation and administration" />
        <RequirePermission perm="government.manage">
          <Link
            to="/governments/new"
            className="flex items-center gap-2 bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-indigo-400 transition-colors h-fit"
          >
            <Plus size={16} />
            Form government
          </Link>
        </RequirePermission>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total governments"
          value={String(data?.length ?? 0)}
        />
        <StatCard
          label="Active government"
          value={activeGov?.name ?? 'None'}
          caption={activeGov ? `Since ${activeGov.formed_date}` : 'No active government'}
        />
        <StatCard
          label="Past governments"
          value={String(pastGovs.length)}
        />
        <StatCard
          label="Total cabinet members"
          value={String(totalCabinetMembers)}
        />
      </div>

      {activeGov && (
        <Link to={`/governments/${activeGov.id}`} className="block mb-6">
          <Card className="border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Landmark size={28} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-100 text-lg">{activeGov.name}</p>
                  <span className="text-[10px] uppercase tracking-wider font-medium bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">Formed {activeGov.formed_date}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {activeGov.head_of_state_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <Crown size={12} className="text-amber-400" />
                      <span className="text-slate-500">Head of State:</span>
                      <span className="text-slate-200">{activeGov.head_of_state_name}</span>
                    </div>
                  )}
                  {activeGov.head_of_government_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <UserCheck size={12} className="text-indigo-400" />
                      <span className="text-slate-500">Head of Govt:</span>
                      <span className="text-slate-200">{activeGov.head_of_government_name}</span>
                    </div>
                  )}
                  {activeGov.cabinet_members && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <Users size={12} className="text-emerald-400" />
                      <span className="text-slate-500">Cabinet:</span>
                      <span className="text-slate-200">{activeGov.cabinet_members.length} members</span>
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
            </div>
          </Card>
        </Link>
      )}

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          Government history
        </h3>

        {pastGovs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
            <Building2 size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No historical governments on record.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastGovs.map((gov) => (
              <Link key={gov.id} to={`/governments/${gov.id}`} className="block">
                <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-900/40 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 text-sm">{gov.name}</p>
                        <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                          gov.status === 'dissolved'
                            ? 'bg-red-500/10 text-red-400'
                            : gov.status === 'caretaker'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {gov.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">Formed {gov.formed_date}</span>
                        {gov.head_of_state_name && (
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Crown size={10} /> {gov.head_of_state_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}