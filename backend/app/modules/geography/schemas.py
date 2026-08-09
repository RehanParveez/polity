from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date

class ProvinceRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  code: str
  unit_type: str

class DistrictRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  province_id: uuid.UUID
  name: str

class TehsilRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  district_id: uuid.UUID
  name: str

class DemographicProfileRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  population: int
  literacy_rate_pct: float
  urban_pct: float
  source: str
  as_of_date: date
  confidence: str

class DistrictDetailRead(DistrictRead):
  tehsils: list[TehsilRead] = []
  demographic_profile: DemographicProfileRead | None = None