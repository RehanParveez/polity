import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Crown, UserCheck, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { governmentService } from '../../../services/governmentService'

export function GovernmentDetailPage() {
  const { governmentId } = useParams<{ governmentId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['government', governmentId],
    queryFn: () => governmentService.getGovernment(governmentId!),
    enabled: !!governmentId,
  })

  if (isLoading) return <p className="text-slate-400">Loading…</p>
  if (error || !data) return <p className="text-red-400">Could not load government.</p>

  const activeMembers = data.cabinet_members.filter((m) => m.is_active)

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle={`Formed ${data.formed_date} · ${data.status.replace('_', ' ')}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Head of State"
          value={data.head_of_state_name ?? 'Unassigned'}
          caption={data.head_of_state_user_id ? 'Linked to user' : 'Placeholder'}
        />
        <StatCard
          label="Head of Government"
          value={data.head_of_government_name ?? 'Unassigned'}
          caption={data.head_of_government_user_id ? 'Linked to user' : 'Placeholder'}
        />
        <StatCard label="Cabinet size" value={String(activeMembers.length)} />
        <StatCard
          label="Oaths taken"
          value={`${activeMembers.filter((m) => m.oath_taken).length} / ${activeMembers.length}`}
        />
      </div>

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          Cabinet members
        </h3>
        {activeMembers.length === 0 ? (
          <p className="text-sm text-slate-500">No cabinet members assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-100 text-sm">{member.portfolio}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {member.ministry?.name ?? 'No ministry linked'}
                    </p>
                  </div>
                  {member.oath_taken && (
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-sm text-slate-200">
                    {member.user?.full_name ?? 'Vacant'}
                  </p>
                  {member.ministry && (
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      {member.ministry.code}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}