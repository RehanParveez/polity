import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Vote, Plus } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { electionsService } from '../../../services/electionsService'

export function ElectionsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['elections'], queryFn: electionsService.listElections })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Elections</h1>
          <p className="text-sm text-slate-400 mt-1">Elections and their results</p>
        </div>
        <Link to="/elections/new" className="flex items-center gap-2 bg-teal-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-teal-400 transition-colors h-fit">
          <Plus size={16} />
          New election
        </Link>
      </div>
      {isLoading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">Could not load elections.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data?.map((election) => (
          <Link key={election.id} to={`/elections/${election.id}`}>
            <Card className="hover:border-teal-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Vote size={20} className="text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{election.name}</p>
                  <p className="text-xs text-slate-500">{election.election_date} · {election.status.replace('_', ' ')}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}