import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { geographyService } from '../../../services/geographyService'

export function ProvinceDistrictsPage() {
  const { provinceId } = useParams<{ provinceId: string }>()
  const { data, isLoading, error } = useQuery({
    queryKey: ['districts', provinceId],
    queryFn: () => geographyService.listDistricts(provinceId!),
    enabled: !!provinceId,
  })

  return (
    <div>
      <PageHeader title="Districts" />
      {isLoading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">Could not load districts.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((district) => (
          <Link key={district.id} to={`/geography/districts/${district.id}`}>
            <Card className="hover:border-teal-500/50 transition-colors">
              <span className="font-medium text-slate-100">{district.name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}