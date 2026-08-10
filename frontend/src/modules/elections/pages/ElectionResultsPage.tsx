import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { electionsService } from '../../../services/electionsService'

export function ElectionResultsPage() {
  const { electionId } = useParams<{ electionId: string }>()
  const electionQuery = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => electionsService.getElection(electionId!),
    enabled: !!electionId,
  })
  const resultsQuery = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: () => electionsService.getResults(electionId!),
    enabled: !!electionId,
  })

  if (electionQuery.isLoading) return <p className="text-slate-400">Loading…</p>
  if (electionQuery.error || !electionQuery.data) return <p className="text-red-400">Could not load election.</p>

  const results = resultsQuery.data

  return (
    <div>
      <PageHeader title={electionQuery.data.name} subtitle={`${electionQuery.data.election_date} · ${electionQuery.data.status.replace('_', ' ')}`} />

      {!results || results.total_seats_declared === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">No results declared yet for this election.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Seats by party</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={results.seats_by_party} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="party_name" stroke="#64748b" fontSize={12} width={160} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="seats" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Constituency results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pr-4">Constituency</th>
                    <th className="pb-2 pr-4">Winner</th>
                    <th className="pb-2 pr-4">Party</th>
                    <th className="pb-2 pr-4">Votes</th>
                    <th className="pb-2">Turnout (cast)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.constituency_results.map((r) => (
                    <tr key={r.constituency_id} className="border-b border-slate-900">
                      <td className="py-2 pr-4 text-slate-300">{r.constituency_code} · {r.constituency_name}</td>
                      <td className="py-2 pr-4 text-slate-100">{r.winner_candidate_name}</td>
                      <td className="py-2 pr-4 text-slate-400">{r.winner_party_name}</td>
                      <td className="py-2 pr-4 text-slate-400">{r.winner_votes.toLocaleString()}</td>
                      <td className="py-2 text-slate-400">{r.total_votes_cast.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}