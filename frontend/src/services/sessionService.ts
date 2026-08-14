import { apiClient } from './apiClient'

export type SessionShare = {
  id: string
  session_id: string
  shared_with_user_id: string | null
  shared_with_institution_id: string | null
  permission: string
  created_at: string
}

export type SimulationResultSnapshot = {
  indicator_name: string
  indicator_code: string
  category: string
  unit: string
  baseline_value: string
  simulated_value: string
  absolute_change: string
  percent_change: string
}

export type ScenarioSnapshot = {
  id: string
  title: string
  description: string | null
  inputs: Array<{ rule_name: string; parameter_name: string; parameter_value: string }>
}

export type RunSnapshot = {
  id: string
  status: string
  created_at: string
}

export type SavedSessionSnapshot = {
  scenario: ScenarioSnapshot | null
  run: RunSnapshot | null
  results: SimulationResultSnapshot[]
  saved_at: string
}

export type SavedSession = {
  id: string
  owner_id: string
  title: string
  description: string | null
  visibility: string
  created_at: string
  updated_at: string
}

export type SavedSessionDetail = SavedSession & {
  snapshot: SavedSessionSnapshot | null
  shares: SessionShare[]
}

export type SessionCreatePayload = {
  title: string
  description?: string | null
  scenario_id?: string | null
  visibility?: string
}

export type SessionUpdatePayload = {
  title?: string
  description?: string | null
  visibility?: string
}

export type SessionSharePayload = {
  shared_with_user_id?: string | null
  shared_with_institution_id?: string | null
  permission?: string
}

export type SessionResumeResponse = {
  session: SavedSessionDetail
  message: string
}

export type SessionRerunResponse = {
  new_run_id: string
  message: string
}

export const sessionService = {
  listSessions: async (visibility?: string): Promise<SavedSession[]> =>
    (await apiClient.get('/sessions', { params: visibility ? { visibility } : undefined })).data,

  getSession: async (id: string): Promise<SavedSessionDetail> =>
    (await apiClient.get(`/sessions/${id}`)).data,

  createSession: async (payload: SessionCreatePayload): Promise<SavedSessionDetail> =>
    (await apiClient.post('/sessions', payload)).data,

  updateSession: async (id: string, payload: SessionUpdatePayload): Promise<SavedSessionDetail> =>
    (await apiClient.patch(`/sessions/${id}`, payload)).data,

  deleteSession: async (id: string): Promise<void> =>
    (await apiClient.delete(`/sessions/${id}`)).data,

  duplicateSession: async (id: string): Promise<SavedSessionDetail> =>
    (await apiClient.post(`/sessions/${id}/duplicate`)).data,

  resumeSession: async (id: string): Promise<SessionResumeResponse> =>
    (await apiClient.post(`/sessions/${id}/resume`)).data,

  rerunSession: async (id: string): Promise<SessionRerunResponse> =>
    (await apiClient.post(`/sessions/${id}/rerun`)).data,

  addShare: async (sessionId: string, payload: SessionSharePayload): Promise<SessionShare> =>
    (await apiClient.post(`/sessions/${sessionId}/shares`, payload)).data,

  removeShare: async (sessionId: string, shareId: string): Promise<void> =>
    (await apiClient.delete(`/sessions/${sessionId}/shares/${shareId}`)).data,
}