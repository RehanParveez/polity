import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { geographyService } from '../../../services/geographyService'

export function ProvincesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['provinces'], queryFn: geographyService.listProvinces })

  return (
    <div>
      <PageHeader title="Geography" subtitle="Provinces and territories" />
      {isLoading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-400">Could not load provinces.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((province) => (
          <Link key={province.id} to={`/geography/provinces/${province.id}`}>
            <Card className="hover:border-teal-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">{province.name}</span>
                <span className="text-xs text-slate-500 uppercase">{province.code}</span>
              </div>
              <span className="text-xs text-slate-500 capitalize">{province.unit_type}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}