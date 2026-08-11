from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date
from decimal import Decimal

class DistrictBrief(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str

class EducationInstitutionRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  institution_type: str
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  enrollment_count: int
  teacher_count: int
  status: str
  source: str
  as_of_date: date
  confidence: str

class HealthcareInstitutionRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  facility_type: str
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  bed_count: int
  staff_count: int
  daily_patient_capacity: int
  status: str
  source: str
  as_of_date: date
  confidence: str

class FarmRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  area_hectares: Decimal
  primary_crop: str
  annual_yield_tons: Decimal
  irrigation_type: str
  status: str
  source: str
  as_of_date: date
  confidence: str

class InfrastructureAssetRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  asset_type: str
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  length_km_or_capacity: str
  condition_rating: str
  year_constructed: int | None
  status: str
  source: str
  as_of_date: date
  confidence: str

class LaborRecordRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  total_workforce: int
  employed_count: int
  unemployed_count: int
  unemployment_rate_pct: Decimal
  minimum_wage_pkr: Decimal
  dominant_sectors: str | None
  status: str
  source: str
  as_of_date: date
  confidence: str

class MilitaryPersonnelRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_branch_id: uuid.UUID
  rank_category: str
  count: int
  women_count: int
  training_status: str
  status: str

class DefenseBranchRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_ministry_id: uuid.UUID
  branch_name: str
  personnel_count: int
  training_completion_pct: Decimal
  active_operations_count: int
  status: str
  personnel: list[MilitaryPersonnelRead] = []

class DefenseBudgetRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_ministry_id: uuid.UUID
  fiscal_year: int
  total_allocated: Decimal
  total_spent: Decimal
  personnel_allocation_pct: Decimal
  equipment_allocation_pct: Decimal
  infrastructure_allocation_pct: Decimal
  research_allocation_pct: Decimal
  status: str

class DefenseProcurementRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_ministry_id: uuid.UUID
  title: str
  description: str | None
  budget_estimate: Decimal
  contract_value: Decimal | None
  status: str
  vendor_name: str | None
  approval_date: date | None

class DisasterResponseUnitRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_ministry_id: uuid.UUID
  unit_name: str
  unit_type: str
  district_id: uuid.UUID
  district: DistrictBrief | None = None
  personnel_count: int
  equipment_count: int
  readiness_pct: Decimal
  last_exercise_date: date | None
  status: str

class DefenseIndicatorRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  defense_ministry_id: uuid.UUID
  indicator_name: str
  value: Decimal
  unit: str
  as_of_date: date
  source: str
  confidence: str

class DefenseMinistryRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  ministry_id: uuid.UUID
  total_personnel_summary: int
  annual_budget_summary: Decimal
  training_completion_pct: Decimal
  civilian_oversight_status: str
  status: str
  branches: list[DefenseBranchRead] = []
  budgets: list[DefenseBudgetRead] = []
  procurements: list[DefenseProcurementRead] = []
  disaster_units: list[DisasterResponseUnitRead] = []
  indicators: list[DefenseIndicatorRead] = []

class SectorSummary(BaseModel):
  education_institutions: int
  total_enrollment: int
  healthcare_institutions: int
  total_beds: int
  farms: int
  total_farm_area: Decimal
  infrastructure_assets: int
  labor_records: int
  total_workforce: int
  defense_ministries: int
  total_defense_personnel: int