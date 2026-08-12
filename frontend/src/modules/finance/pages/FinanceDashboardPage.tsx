import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Banknote,
  Landmark,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { financeService } from '../../../services/financeService'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function FinanceDashboardPage() {
  const { t } = useTranslation('finance')
  const summaryQuery = useQuery({ queryKey: ['finance-summary'], queryFn: financeService.getSummary })
  const revenueQuery = useQuery({ queryKey: ['finance-revenue'], queryFn: () => financeService.listRevenue(2026) })

  const summary = summaryQuery.data
  const isLoading = summaryQuery.isLoading || revenueQuery.isLoading

  if (isLoading) return <p className="text-slate-400">{t('loading')}</p>

  const totalRevenue = summary ? Number(summary.total_revenue) : 0
  const totalBudget = summary ? Number(summary.total_budget) : 0
  const totalProcurement = summary ? Number(summary.total_procurement) : 0
  const openAudits = summary ? Number(summary.open_audits) : 0
  const budgetUtilization = totalBudget > 0 ? (totalProcurement / totalBudget) * 100 : 0
  const revenueVsBudget = totalBudget > 0 ? (totalRevenue / totalBudget) * 100 : 0

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {openAudits > 0 && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">{openAudits} open audit{openAudits > 1 ? 's' : ''} requiring attention</p>
            <p className="text-xs text-slate-500">Review pending financial audits and discrepancies</p>
          </div>
          <ArrowUpRight size={16} className="text-red-400 shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('dashboard.totalRevenue')}
          value={summary ? `PKR ${(totalRevenue / 1e9).toFixed(1)}B` : '—'}
          caption="FY 2026"
          trend={{ value: revenueVsBudget > 100 ? 'Above budget' : `${revenueVsBudget.toFixed(0)}% of budget`, direction: revenueVsBudget >= 100 ? 'up' : 'down' }}
        />
        <StatCard
          label={t('dashboard.totalBudget')}
          value={summary ? `PKR ${(totalBudget / 1e9).toFixed(1)}B` : '—'}
          caption="FY 2026"
        />
        <StatCard
          label={t('dashboard.totalProcurement')}
          value={summary ? `PKR ${(totalProcurement / 1e9).toFixed(1)}B` : '—'}
          trend={{ value: `${budgetUtilization.toFixed(1)}% of budget`, direction: budgetUtilization > 80 ? 'down' : 'up' }}
        />
        <StatCard
          label={t('dashboard.openAudits')}
          value={summary ? String(openAudits) : '—'}
          trend={{ value: openAudits > 0 ? 'Action required' : 'All clear', direction: openAudits > 0 ? 'down' : 'up' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {revenueQuery.data && revenueQuery.data.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              {t('revenue.title')}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueQuery.data} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `PKR ${(Number(v) / 1e9).toFixed(0)}B`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  width={180}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any) => {
                    const num = typeof value === 'number' ? value : Number(value) || 0
                    return [`PKR ${num.toLocaleString()}`, 'Amount']
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            Fiscal health
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Budget utilization</span>
                <span className="text-slate-100 font-medium">{budgetUtilization.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${budgetUtilization > 90 ? 'bg-red-500' : budgetUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                PKR {(totalProcurement / 1e9).toFixed(1)}B spent of PKR {(totalBudget / 1e9).toFixed(1)}B
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Revenue coverage</span>
                <span className="text-slate-100 font-medium">{revenueVsBudget.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${revenueVsBudget >= 100 ? 'bg-emerald-500' : revenueVsBudget >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(revenueVsBudget, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                Revenue covers {revenueVsBudget.toFixed(0)}% of total budget
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wallet size={12} className="text-slate-600" />
                  Total revenue
                </span>
                <span className="text-slate-200 font-medium">PKR {(totalRevenue / 1e9).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Landmark size={12} className="text-slate-600" />
                  Total budget
                </span>
                <span className="text-slate-200 font-medium">PKR {(totalBudget / 1e9).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShoppingCart size={12} className="text-slate-600" />
                  Procurement
                </span>
                <span className="text-slate-200 font-medium">PKR {(totalProcurement / 1e9).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-slate-600" />
                  Open audits
                </span>
                <span className={openAudits > 0 ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                  {openAudits}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${
                openAudits > 0
                  ? 'bg-amber-500/10 text-amber-400'
                  : budgetUtilization > 90
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {openAudits > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                {openAudits > 0 ? 'Audit attention needed' : budgetUtilization > 90 ? 'High utilization' : 'Fiscal health good'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Banknote size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Revenue streams</p>
              <p className="text-sm font-medium text-slate-200">{revenueQuery.data?.length ?? 0} categories</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <PieChart size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Budget efficiency</p>
              <p className="text-sm font-medium text-slate-200">{budgetUtilization.toFixed(1)}% utilized</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Activity size={18} className={openAudits > 0 ? 'text-red-400' : 'text-emerald-400'} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Audit status</p>
              <p className="text-sm font-medium text-slate-200">{openAudits > 0 ? `${openAudits} pending` : 'All clear'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}