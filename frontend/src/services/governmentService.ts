import { apiClient } from './apiClient'

export type CabinetMember = {
  id: string
  government_id: string
  user_id: string | null
  ministry_id: string | null
  portfolio: string
  oath_taken: boolean
  is_active: boolean
  user: { id: string; full_name: string } | null
  ministry: { id: string; name: string; code: string } | null
}

export type Government = {
  id: string
  election_id: string | null
  name: string
  status: string
  formed_date: string
  dissolved_date: string | null
  head_of_state_name: string | null
  head_of_government_name: string | null
  head_of_state_user_id: string | null
  head_of_government_user_id: string | null
  cabinet_members: CabinetMember[]
}

export type GovernmentCreate = {
  election_id?: string | null
  name: string
  status?: string
  formed_date: string
  dissolved_date?: string | null
  head_of_state_name?: string | null
  head_of_government_name?: string | null
  head_of_state_user_id?: string | null
  head_of_government_user_id?: string | null
}

export type CabinetMemberCreate = {
  user_id?: string | null
  ministry_id?: string | null
  portfolio: string
  oath_taken?: boolean
  is_active?: boolean
  sort_order?: number | null
}

export const governmentService = {
  listGovernments: async (): Promise<Government[]> =>
    (await apiClient.get('/governments')).data,
  getGovernment: async (id: string): Promise<Government> =>
    (await apiClient.get(`/governments/${id}`)).data,
  createGovernment: async (payload: GovernmentCreate): Promise<Government> =>
    (await apiClient.post('/governments', payload)).data,
  addCabinetMember: async (
    govId: string,
    payload: CabinetMemberCreate
  ): Promise<CabinetMember> =>
    (await apiClient.post(`/governments/${govId}/cabinet`, payload)).data,
  removeCabinetMember: async (govId: string, memberId: string): Promise<void> =>
    (await apiClient.delete(`/governments/${govId}/cabinet/${memberId}`)).data,
}