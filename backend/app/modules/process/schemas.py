from pydantic import BaseModel, ConfigDict, Field
import uuid
from decimal import Decimal
from datetime import date, datetime

class IndicatorRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  code: str
  category: str
  unit: str
  description: str | None
  is_higher_better: bool

class IndicatorCreate(BaseModel):
  name: str = Field(min_length=1, max_length=150)
  code: str = Field(min_length=1, max_length=50)
  category: str = Field(min_length=1, max_length=50)
  unit: str = Field(min_length=1, max_length=50)
  description: str | None = None
  is_higher_better: bool = True

class IndicatorValueRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  indicator_id: uuid.UUID
  district_id: uuid.UUID | None
  value: Decimal
  as_of_date: date
  source: str
  confidence: str

class IndicatorValueCreate(BaseModel):
  indicator_id: uuid.UUID
  district_id: uuid.UUID | None = None
  value: Decimal = Field(max_digits=15, decimal_places=4)
  as_of_date: date
  source: str = "synthetic — illustrative only"
  confidence: str = "low"

class SimulationRuleRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  rule_name: str
  description: str | None
  version: int
  is_active: bool
  rule_config: dict
  affected_indicator_codes: list[str]

class SimulationRuleCreate(BaseModel):
  rule_name: str = Field(min_length=1, max_length=100)
  description: str | None = None
  rule_config: dict = Field(default_factory=dict)
  affected_indicator_codes: list[str] = Field(default_factory=list)

class ScenarioListRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  title: str
  description: str | None
  status: str
  visibility: str
  created_at: datetime
  updated_at: datetime

class ScenarioCreate(BaseModel):
  title: str = Field(min_length=1, max_length=200)
  description: str | None = None
  visibility: str = "private"

class ScenarioUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=1, max_length=200)
  description: str | None = None
  status: str | None = None
  visibility: str | None = None

class ScenarioInputRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  scenario_id: uuid.UUID
  rule_name: str
  parameter_name: str
  parameter_value: str

class ScenarioInputCreate(BaseModel):
  rule_name: str = Field(min_length=1, max_length=100)
  parameter_name: str = Field(min_length=1, max_length=100)
  parameter_value: str = Field(min_length=1, max_length=255)

class ScenarioDetailRead(ScenarioListRead):
  inputs: list[ScenarioInputRead] = []

class SimulationRunListRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  scenario_id: uuid.UUID
  status: str
  started_at: datetime | None
  completed_at: datetime | None
  error_message: str | None
  created_at: datetime

class SimulationRunRead(SimulationRunListRead):
  results: list["SimulationResultRead"] = []

class SimulationResultRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  simulation_run_id: uuid.UUID
  indicator_id: uuid.UUID
  indicator_name: str | None = None
  indicator_unit: str | None = None
  indicator_category: str | None = None
  district_id: uuid.UUID | None
  baseline_value: Decimal
  simulated_value: Decimal
  absolute_change: Decimal
  percent_change: Decimal
  rule_applied: str
  is_higher_better: bool = True

class ComparisonDiffItem(BaseModel):
  indicator_id: uuid.UUID
  indicator_name: str
  indicator_unit: str
  baseline_value: Decimal
  comparison_value: Decimal
  absolute_diff: Decimal
  percent_diff: Decimal
  is_higher_better: bool

class ScenarioComparisonRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  title: str
  baseline_run_id: uuid.UUID
  comparison_run_id: uuid.UUID
  diff_summary: dict
  created_at: datetime

class ScenarioComparisonCreate(BaseModel):
  title: str = Field(min_length=1, max_length=200)
  baseline_run_id: uuid.UUID
  comparison_run_id: uuid.UUID

class ScenarioComparisonDetailRead(ScenarioComparisonRead):
  diffs: list[ComparisonDiffItem] = []

class SimulationResultChartRow(BaseModel):
  indicator_name: str
  indicator_code: str
  category: str
  unit: str
  baseline: Decimal
  simulated: Decimal
  change_pct: Decimal
  color: str 