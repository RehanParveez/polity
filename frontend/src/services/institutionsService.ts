import { apiClient } from './apiClient'

export type Ministry = { id: string; name: string; code: string; description: string | null }
export type Membership = { id: string; title: string; user: { full_name: string } }
export type DepartmentDetail = {
  id: string
  ministry_id: string
  name: string
  description: string | null
  memberships: Membership[]
}
export type MinistryDetail = Ministry & { departments: DepartmentDetail[] }

export const institutionsService = {
  listMinistries: async (): Promise<Ministry[]> => (await apiClient.get('/institutions/ministries')).data,
  getMinistry: async (id: string): Promise<MinistryDetail> => (await apiClient.get(`/institutions/ministries/${id}`)).data,
}