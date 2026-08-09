import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { geographyService } from '../../../services/geographyService'

export function DistrictDetailPage() {
  const { districtId } = useParams<{ districtId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['district', districtId],
    queryFn: () => geographyService.getDistrict(districtId!),
    enabled: !!districtId,
  })

  if (isLoading) return <p className="text-slate-400">Loading…</p>
  if (error || !data) return <p className="text-red-400">Could not load district.</p>

  return (
    <div>
      <PageHeader title={data.name} subtitle={`${data.tehsils.length} tehsils on record`} />

      {data.demographic_profile ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Population" value={data.demographic_profile.population.toLocaleString()} />
          <StatCard label="Literacy rate" value={`${data.demographic_profile.literacy_rate_pct}%`} />
          <StatCard label="Urban population" value={`${data.demographic_profile.urban_pct}%`} />
        </div>
      ) : (
        <p className="text-slate-500 text-sm mb-6">No demographic profile on record for this district yet.</p>
      )}

      {data.demographic_profile && (
        <p className="text-xs text-slate-600 mb-6">
          Source: {data.demographic_profile.source} · as of {data.demographic_profile.as_of_date} · confidence:{' '}
          {data.demographic_profile.confidence}
        </p>
      )}

      <Card>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Tehsils</h3>
        {data.tehsils.length === 0 ? (
          <p className="text-sm text-slate-500">None on record yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.tehsils.map((t) => (
              <li key={t.id} className="text-sm text-slate-300">{t.name}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}