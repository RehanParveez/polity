import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from 'recharts'
import {Trophy, Users, MapPin, BarChart3, Crown, AlertCircle, CheckCircle2, Clock, TrendingUp, Flag, Vote, ChevronRight,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { electionsService } from '../../../services/electionsService'

const PARTY_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#f97316',
]

export function ElectionResultsPage() {
  const { t } = useTranslation('elections')
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

  if (electionQuery.isLoading) return <p className="text-slate-400">{t('common:loading', { ns: 'common' })}</p>
  if (electionQuery.error || !electionQuery.data) return <p className="text-red-400">{t('loadError')}</p>

  const election = electionQuery.data
  const results = resultsQuery.data

  const totalSeats = results?.total_seats_declared ?? 0
  const totalVotes = results?.constituency_results?.reduce((acc, r) => acc + (r.total_votes_cast ?? 0), 0) ?? 0
  const totalWinnerVotes = results?.constituency_results?.reduce((acc, r) => acc + (r.winner_votes ?? 0), 0) ?? 0
  const partyCount = results?.seats_by_party?.length ?? 0
  const leadingParty = results?.seats_by_party?.[0]

  const statusLabel = election.status.replace('_', ' ')

  return (
    <div>
      <PageHeader
        title={election.name}
        subtitle={`${election.election_date} · ${statusLabel}`}
      />

      {!results || totalSeats === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Vote size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">{t('noResults')}</p>
            <p className="text-xs text-slate-500 mt-1">Results will appear once constituencies begin reporting.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total seats"
              value={String(totalSeats)}
              trend={{ value: `${partyCount} parties`, direction: 'up' }}
            />
            <StatCard
              label="Total votes cast"
              value={totalVotes.toLocaleString()}
            />
            <StatCard
              label="Leading party"
              value={leadingParty?.party_name ?? '—'}
              trend={{ value: leadingParty ? `${leadingParty.seats} seats` : '—', direction: 'up' }}
            />
            <StatCard
              label="Constituencies"
              value={String(results.constituency_results.length)}
              trend={{ value: `${results.constituency_results.filter((r) => r.winner_candidate_name).length} declared`, direction: 'up' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-violet-400" />
                {t('seatsByParty')}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={results.seats_by_party} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="party_name"
                    stroke="#64748b"
                    fontSize={12}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: any) => {
                      const num = typeof value === 'number' ? value : Number(value) || 0
                      return [`${num} seat${num !== 1 ? 's' : ''}`, '']
                    }}
                   />
                  <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                    {results.seats_by_party.map((_, i) => (
                      <Cell key={i} fill={PARTY_COLORS[i % PARTY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {results.seats_by_party.map((entry, i) => (
                  <div key={entry.party_name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PARTY_COLORS[i % PARTY_COLORS.length] }}
                    />
                    {entry.party_name} ({entry.seats})
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-violet-400" />
                Results overview
              </h3>
              <div className="space-y-4">
                {results.seats_by_party.slice(0, 5).map((party, i) => {
                  const pct = totalSeats > 0 ? (party.seats / totalSeats) * 100 : 0
                  return (
                    <div key={party.party_name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: PARTY_COLORS[i % PARTY_COLORS.length] }}
                          />
                          {party.party_name}
                        </span>
                        <span className="text-slate-100 font-medium">{party.seats}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PARTY_COLORS[i % PARTY_COLORS.length],
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{pct.toFixed(1)}% of seats</p>
                    </div>
                  )
                })}

                <div className="pt-4 border-t border-slate-800 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total votes</span>
                    <span className="text-slate-200 font-medium">{totalVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Winner votes</span>
                    <span className="text-slate-200 font-medium">{totalWinnerVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Parties contested</span>
                    <span className="text-slate-200 font-medium">{partyCount}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${
                    election.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : election.status === 'active'
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {election.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {statusLabel}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-violet-400" />
              {t('constituencyResults')}
            </h3>

            {results.constituency_results.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
                <Flag size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No constituency results reported yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800">
                      <th className="pb-2 pr-4">{t('constituency')}</th>
                      <th className="pb-2 pr-4">{t('winner')}</th>
                      <th className="pb-2 pr-4">{t('party')}</th>
                      <th className="pb-2 pr-4 text-right">{t('votes')}</th>
                      <th className="pb-2 text-right">{t('turnout')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.constituency_results.map((r) => {
                      const turnoutPct = r.registered_voters
                        ? ((r.total_votes_cast / r.registered_voters) * 100).toFixed(1)
                        : null

                      return (
                        <tr key={r.constituency_id} className="border-b border-slate-900">
                          <td className="py-3 pr-4">
                            <p className="text-slate-200 font-medium text-sm">{r.constituency_code}</p>
                            <p className="text-xs text-slate-500">{r.constituency_name}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-slate-100 text-sm">{r.winner_candidate_name}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {r.winner_party_name}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <p className="text-slate-200 font-medium">{r.winner_votes.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-600">
                              of {r.total_votes_cast.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-3 text-right">
                            {turnoutPct ? (
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-16 bg-slate-800 rounded-full h-1">
                                  <div
                                    className="h-1 rounded-full bg-violet-500"
                                    style={{ width: `${Math.min(Number(turnoutPct), 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400">{turnoutPct}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}