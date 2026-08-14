from pydantic import ConfigDict, BaseModel, Field
import uuid
from datetime import datetime

class SavedSessionListRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  owner_id: uuid.UUID
  title: str
  description: str | None
  visibility: str
  created_at: datetime
  updated_at: datetime

class SavedSessionCreate(BaseModel):
  title: str = Field(min_length=1, max_length=200)
  description: str | None = None
  scenario_id: uuid.UUID | None = None
  visibility: str = Field(default = "private", pattern = "^(private|shared|institutional)$")

class SavedSessionUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=1, max_length=200)
  description: str | None = None
  visibility: str | None = Field(default=None, pattern="^(private|shared|institutional)$")

class SimulationResultSnapshot(BaseModel):
  indicator_name: str
  indicator_code: str
  category: str
  unit: str
  baseline_value: str
  simulated_value: str
  absolute_change: str
  percent_change: str

class ScenarioSnapshot(BaseModel):
  id: uuid.UUID
  title: str
  description: str | None
  inputs: list[dict]

class RunSnapshot(BaseModel):
  id: uuid.UUID
  status: str
  created_at: datetime

class SavedSessionSnapshot(BaseModel):
  scenario: ScenarioSnapshot | None
  run: RunSnapshot | None
  results: list[SimulationResultSnapshot]
  saved_at: str

class SavedSessionDetailRead(SavedSessionListRead):
  snapshot: SavedSessionSnapshot | None = None
  shares: list["SessionShareRead"] = []

class SessionShareRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  session_id: uuid.UUID
  shared_with_user_id: uuid.UUID | None
  shared_with_institution_id: uuid.UUID | None
  permission: str
  created_at: datetime

class SessionShareCreate(BaseModel):
  shared_with_user_id: uuid.UUID | None = None
  shared_with_institution_id: uuid.UUID | None = None
  permission: str = Field(default = "view", pattern = "^(view|edit)$")

class SessionResumeResponse(BaseModel):
  session: SavedSessionDetailRead
  message: str

class SessionRerunResponse(BaseModel):
  new_run_id: uuid.UUID
  message: str