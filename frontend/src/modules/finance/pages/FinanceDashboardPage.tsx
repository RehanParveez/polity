import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Banknote, Landmark, ShoppingCart, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { financeService } from '../../../services/financeService'
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, TooltipProps,
} from 'recharts'

export function FinanceDashboardPage() {
  const { t } = useTranslation('finance')
  const summaryQuery = useQuery({ queryKey: ['finance-summary'], queryFn: financeService.getSummary })
  const revenueQuery = useQuery({ queryKey: ['finance-revenue'], queryFn: () => financeService.listRevenue(2026) })

  const summary = summaryQuery.data
  const revenueTooltipFormatter: TooltipProps['formatter'] = (
  value, name, item, index, payload,
) => {
  if (value == null) return ''
  const num = typeof value === 'number' ? value : Number(value)
  return `PKR ${num.toLocaleString()}`
}

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('dashboard.totalRevenue')}
          value={summary ? `PKR ${Number(summary.total_revenue).toLocaleString()}` : '—'}
          caption="FY 2026"
        />
        <StatCard
          label={t('dashboard.totalBudget')}
          value={summary ? `PKR ${Number(summary.total_budget).toLocaleString()}` : '—'}
          caption="FY 2026"
        />
        <StatCard
          label={t('dashboard.totalProcurement')}
          value={summary ? `PKR ${Number(summary.total_procurement).toLocaleString()}` : '—'}
        />
        <StatCard
          label={t('dashboard.openAudits')}
          value={summary ? String(summary.open_audits) : '—'}
          trend={{ value: '2 critical', direction: 'down' }}
        />
      </div>

      {revenueQuery.data && revenueQuery.data.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t('revenue.title')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueQuery.data} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `PKR ${(Number(v) / 1e9).toFixed(0)}B`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={180} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={revenueTooltipFormatter}
               />
              <Bar dataKey="amount" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}