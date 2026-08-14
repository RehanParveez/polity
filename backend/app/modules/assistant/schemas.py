from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import datetime

class AIOutputContract(BaseModel):
  language: str = Field(default = "en", pattern = "^(en|ur)$")
  summary: str = Field(min_length=1)
  evidence: list[str] = Field(default_factory=list)
  assumptions: list[str] = Field(default_factory=list)
  risks: list[str] = Field(default_factory=list)
  confidence: str = Field(default = "medium", pattern = "^(low|medium|high)$")
  requires_human_review: bool = True

class PolicyExplainRequest(BaseModel):
  policy_id: uuid.UUID
  query: str | None = Field(default=None, description = "Optional follow-up question")
  language: str = Field(default = "en", pattern = "^(en|ur)$")

class BudgetExplainRequest(BaseModel):
  budget_id: uuid.UUID
  query: str | None = None
  language: str = Field(default = "en", pattern = "^(en|ur)$")

class ChatRequest(BaseModel):
  message: str = Field(min_length=1, max_length=2000)
  language: str = Field(default = "en", pattern = "^(en|ur)$")
  context_indicator_codes: list[str] = Field(default_factory=list, description = "Ground the answer in these indicators")

class TranslateRequest(BaseModel):
  text: str = Field(min_length=1, max_length=3000)
  target_language: str = Field(default = "ur", pattern = "^(en|ur)$")

class ReportGenerateRequest(BaseModel):
  ministry_id: uuid.UUID | None = None
  report_type: str = Field(default = "summary", pattern = "^(summary|sector|budget|policy)$")
  fiscal_year: int | None = None
  language: str = Field(default = "en", pattern = "^(en|ur)$")

class SimulationExplainRequest(BaseModel):
  run_id: uuid.UUID
  language: str = Field(default = "en", pattern = "^(en|ur)$")

class AIExplainResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  request_id: uuid.UUID
  output: AIOutputContract
  used_fallback: bool
  latency_ms: int | None

class AIChatResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  request_id: uuid.UUID
  output: AIOutputContract
  used_fallback: bool
  latency_ms: int | None

class AITranslateResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  request_id: uuid.UUID
  translated_text: str
  source_language: str
  target_language: str
  used_fallback: bool
  latency_ms: int | None

class AIReportResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  request_id: uuid.UUID
  output: AIOutputContract
  used_fallback: bool
  latency_ms: int | None

class AISimulationExplainResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  request_id: uuid.UUID
  output: AIOutputContract
  used_fallback: bool
  latency_ms: int | None

class AIRequestRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  user_id: uuid.UUID
  agent_name: str
  model_used: str
  status: str
  latency_ms: int | None
  entity_type: str | None
  entity_id: uuid.UUID | None
  created_at: datetime

class AIResponseRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  request_id: uuid.UUID
  is_valid: bool
  used_fallback: bool
  parsed_output: dict
  created_at: datetime