import { apiClient } from './apiClient'

export type DistrictBrief = { id: string; name: string }

export type EducationInstitution = {
  id: string; name: string; institution_type: string; district_id: string
  district: DistrictBrief | null; enrollment_count: number; teacher_count: number
  status: string; source: string; as_of_date: string; confidence: string
}

export type HealthcareInstitution = {
  id: string; name: string; facility_type: string; district_id: string
  district: DistrictBrief | null; bed_count: number; staff_count: number
  daily_patient_capacity: number; status: string; source: string
  as_of_date: string; confidence: string
}

export type Farm = {
  id: string; name: string; district_id: string; district: DistrictBrief | null
  area_hectares: string; primary_crop: string; annual_yield_tons: string
  irrigation_type: string; status: string; source: string
  as_of_date: string; confidence: string
}

export type InfrastructureAsset = {
  id: string; name: string; asset_type: string; district_id: string
  district: DistrictBrief | null; length_km_or_capacity: string
  condition_rating: string; year_constructed: number | null
  status: string; source: string; as_of_date: string; confidence: string
}

export type LaborRecord = {
  id: string; district_id: string; district: DistrictBrief | null
  total_workforce: number; employed_count: number; unemployed_count: number
  unemployment_rate_pct: string; minimum_wage_pkr: string
  dominant_sectors: string | null; status: string; source: string
  as_of_date: string; confidence: string
}

export type MilitaryPersonnel = {
  id: string; defense_branch_id: string; rank_category: string
  count: number; women_count: number; training_status: string; status: string
}

export type DefenseBranch = {
  id: string; defense_ministry_id: string; branch_name: string
  personnel_count: number; training_completion_pct: string
  active_operations_count: number; status: string; personnel: MilitaryPersonnel[]
}

export type DefenseBudget = {
  id: string; defense_ministry_id: string; fiscal_year: number
  total_allocated: string; total_spent: string
  personnel_allocation_pct: string; equipment_allocation_pct: string
  infrastructure_allocation_pct: string; research_allocation_pct: string
  status: string
}

export type DefenseProcurement = {
  id: string; defense_ministry_id: string; title: string
  description: string | null; budget_estimate: string
  contract_value: string | null; status: string
  vendor_name: string | null; approval_date: string | null
}

export type DisasterResponseUnit = {
  id: string; defense_ministry_id: string; unit_name: string
  unit_type: string; district_id: string; district: DistrictBrief | null
  personnel_count: number; equipment_count: number
  readiness_pct: string; last_exercise_date: string | null; status: string
}

export type DefenseIndicator = {
  id: string; defense_ministry_id: string; indicator_name: string
  value: string; unit: string; as_of_date: string
  source: string; confidence: string
}

export type DefenseMinistry = {
  id: string; ministry_id: string; total_personnel_summary: number
  annual_budget_summary: string; training_completion_pct: string
  civilian_oversight_status: string; status: string
  branches: DefenseBranch[]; budgets: DefenseBudget[]
  procurements: DefenseProcurement[]; disaster_units: DisasterResponseUnit[]
  indicators: DefenseIndicator[]
}

export type SectorSummary = {
  education_institutions: number; total_enrollment: number
  healthcare_institutions: number; total_beds: number
  farms: number; total_farm_area: string
  infrastructure_assets: number; labor_records: number
  total_workforce: number; defense_ministries: number
  total_defense_personnel: number
}

export const sectorsService = {
  getSummary: async (): Promise<SectorSummary> =>
    (await apiClient.get('/sectors/summary')).data,
  listEducation: async (): Promise<EducationInstitution[]> =>
    (await apiClient.get('/sectors/education')).data,
  listHealthcare: async (): Promise<HealthcareInstitution[]> =>
    (await apiClient.get('/sectors/healthcare')).data,
  listAgriculture: async (): Promise<Farm[]> =>
    (await apiClient.get('/sectors/agriculture')).data,
  listInfrastructure: async (): Promise<InfrastructureAsset[]> =>
    (await apiClient.get('/sectors/infrastructure')).data,
  listLabor: async (): Promise<LaborRecord[]> =>
    (await apiClient.get('/sectors/labor')).data,
  getDefense: async (): Promise<DefenseMinistry> =>
    (await apiClient.get('/sectors/defense')).data,
}