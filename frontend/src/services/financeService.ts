import { apiClient } from './apiClient'

export type RevenueSource = {
  id: string
  name: string
  category: string
  amount: string
  fiscal_year: number
  source: string
  as_of_date: string
  confidence: string
}

export type BudgetLine = {
  id: string
  budget_id: string
  category: string
  allocated_amount: string
  spent_amount: string
}

export type Budget = {
  id: string
  ministry_id: string | null
  ministry_name: string | null
  government_id: string | null
  fiscal_year: number
  total_amount: string
  status: string
  description: string | null
  total_allocated: string
  total_spent: string
  remaining: string
  lines: BudgetLine[]
}

export type Procurement = {
  id: string
  ministry_id: string
  ministry_name: string | null
  title: string
  description: string | null
  budget_estimate: string
  status: string
  vendor_name: string | null
}

export type AuditFinding = {
  id: string
  entity_type: string
  entity_id: string
  severity: string
  description: string
  status: string
}

export type FinanceSummary = {
  total_revenue: string
  total_budget: string
  total_procurement: string
  open_audits: number
}

export const financeService = {
  getSummary: async (): Promise<FinanceSummary> =>
    (await apiClient.get('/finance/summary')).data,
  listRevenue: async (fiscalYear?: number): Promise<RevenueSource[]> =>
    (await apiClient.get('/finance/revenue', { params: { fiscal_year: fiscalYear } })).data,
  listBudgets: async (): Promise<Budget[]> =>
    (await apiClient.get('/finance/budgets')).data,
  getBudget: async (id: string): Promise<Budget> =>
    (await apiClient.get(`/finance/budgets/${id}`)).data,
  listProcurement: async (): Promise<Procurement[]> =>
    (await apiClient.get('/finance/procurement')).data,
  listAudits: async (): Promise<AuditFinding[]> =>
    (await apiClient.get('/finance/audit')).data,
}