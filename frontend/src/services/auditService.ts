import { apiClient } from './apiClient'

export type AuditEvent = {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string | null
  actor_name: string | null
  before_state: Record<string, any> | null
  after_state: Record<string, any> | null
  event_metadata: Record<string, any>
  module: string | null
  created_at: string
}

export type AuditEventList = {
  data: AuditEvent[]
  total: number
  limit: number
  offset: number
}

export type AuditSummaryByModule = {
  module: string | null
  event_count: number
}

export type AuditSummaryByAction = {
  action: string
  event_count: number
}

export type AuditFilters = {
  entity_type?: string
  action?: string
  module?: string
  actor_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export const auditService = {
  listEvents: async (filters: AuditFilters = {}): Promise<AuditEventList> =>
    (await apiClient.get('/audit/events', { params: filters })).data,

  getEvent: async (id: string): Promise<AuditEvent> =>
    (await apiClient.get(`/audit/events/${id}`)).data,

  summaryByModule: async (start?: string, end?: string): Promise<AuditSummaryByModule[]> =>
    (await apiClient.get('/audit/summary/modules', { params: { start_date: start, end_date: end } })).data,

  summaryByAction: async (start?: string, end?: string): Promise<AuditSummaryByAction[]> =>
    (await apiClient.get('/audit/summary/actions', { params: { start_date: start, end_date: end } })).data,
}