import { apiClient } from './apiClient'

export type Province = { id: string; name: string; code: string; unit_type: string }
export type District = { id: string; province_id: string; name: string }
export type Tehsil = { id: string; district_id: string; name: string }
export type DemographicProfile = {
  population: number
  literacy_rate_pct: number
  urban_pct: number
  source: string
  as_of_date: string
  confidence: string
}
export type DistrictDetail = District & { tehsils: Tehsil[]; demographic_profile: DemographicProfile | null }

export const geographyService = {
  listProvinces: async (): Promise<Province[]> => (await apiClient.get('/geography/provinces')).data,
  listDistricts: async (provinceId: string): Promise<District[]> =>
    (await apiClient.get(`/geography/provinces/${provinceId}/districts`)).data,
  getDistrict: async (districtId: string): Promise<DistrictDetail> =>
    (await apiClient.get(`/geography/districts/${districtId}`)).data,
}