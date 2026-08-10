import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { ChevronDown, Users } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { institutionsService } from '../../../services/institutionsService'

export function MinistryOrgChartPage() {
  const { ministryId } = useParams<{ ministryId: string }>()
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, isLoading, error } = useQuery({
    queryKey: ['ministry', ministryId],
    queryFn: () => institutionsService.getMinistry(ministryId!),
    enabled: !!ministryId,
  })

  if (isLoading) return <p className="text-slate-400">Loading…</p>
  if (error || !data) return <p className="text-red-400">Could not load ministry.</p>

  return (
    <div>
      <PageHeader title={data.name} subtitle={data.description ?? undefined} />
      <div className="flex flex-col items-center">
        <Card className="mb-2 px-8 py-4 text-center">
          <p className="font-semibold text-slate-100">{data.name}</p>
          <p className="text-xs text-slate-500 uppercase mt-0.5">{data.code}</p>
        </Card>
        <div className="w-px h-8 bg-slate-700" />
        <div className="flex flex-wrap justify-center gap-6 pt-2 border-t border-slate-800 w-full max-w-4xl">
          {data.departments.map((dept) => (
            <div key={dept.id} className="flex flex-col items-center">
              <div className="w-px h-6 bg-slate-700 -mt-2" />
              <button onClick={() => setExpanded(expanded === dept.id ? null : dept.id)} className="text-left">
                <Card className="w-56 hover:border-teal-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-100 text-sm">{dept.name}</span>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform ${expanded === dept.id ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <Users size={12} />
                    {dept.memberships.length} member{dept.memberships.length === 1 ? '' : 's'}
                  </div>
                </Card>
              </button>
              {expanded === dept.id && (
                <div className="mt-2 w-56 space-y-1.5">
                  {dept.memberships.length === 0 ? (
                    <p className="text-xs text-slate-600 px-1">No members assigned yet.</p>
                  ) : (
                    dept.memberships.map((m) => (
                      <div key={m.id} className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                        <p className="text-slate-200">{m.user.full_name}</p>
                        <p className="text-slate-500">{m.title}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}