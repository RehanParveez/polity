import { apiClient } from './apiClient'

export type AIOutputContract = {
  language: string
  summary: string
  evidence: string[]
  assumptions: string[]
  risks: string[]
  confidence: 'low' | 'medium' | 'high'
  requires_human_review: boolean
}

export type AIExplainResponse = {
  request_id: string
  output: AIOutputContract
  used_fallback: boolean
  latency_ms: number | null
}

export type AIChatResponse = AIExplainResponse
export type AIReportResponse = AIExplainResponse
export type AISimulationExplainResponse = AIExplainResponse

export type AITranslateResponse = {
  request_id: string
  translated_text: string
  source_language: string
  target_language: string
  used_fallback: boolean
  latency_ms: number | null
}

export type AIHistoryItem = {
  id: string
  user_id: string
  agent_name: string
  model_used: string
  status: string
  latency_ms: number | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

export const aiService = {
  explainPolicy: async (policyId: string, query?: string, language = 'en'): Promise<AIExplainResponse> =>
    (await apiClient.post('/ai/policy/explain', { policy_id: policyId, query, language })).data,

  explainBudget: async (budgetId: string, query?: string, language = 'en'): Promise<AIExplainResponse> =>
    (await apiClient.post('/ai/budget/explain', { budget_id: budgetId, query, language })).data,

  chat: async (message: string, language = 'en', contextIndicatorCodes: string[] = []): Promise<AIChatResponse> =>
    (await apiClient.post('/ai/chat', { message, language, context_indicator_codes: contextIndicatorCodes })).data,

  translate: async (text: string, targetLanguage = 'ur'): Promise<AITranslateResponse> =>
    (await apiClient.post('/ai/translate', { text, target_language: targetLanguage })).data,

  generateReport: async (payload: {
    ministry_id?: string | null
    report_type?: string
    fiscal_year?: number | null
    language?: string
  }): Promise<AIReportResponse> =>
    (await apiClient.post('/ai/report/generate', payload)).data,

  explainSimulation: async (runId: string, language = 'en'): Promise<AISimulationExplainResponse> =>
    (await apiClient.post('/ai/simulation/explain', { run_id: runId, language })).data,

  listHistory: async (limit = 20): Promise<AIHistoryItem[]> =>
    (await apiClient.get('/ai/history', { params: { limit } })).data,
}