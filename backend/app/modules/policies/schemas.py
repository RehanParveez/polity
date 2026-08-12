from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import date, datetime
from decimal import Decimal

class PolicyListRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  title: str
  ministry_id: uuid.UUID | None
  status: str
  current_approval_step: int
  version: int
  created_at: datetime
  updated_at: datetime

class PolicyCreate(BaseModel):
  title: str = Field(min_length=5, max_length=300)
  description: str | None = None
  ministry_id: uuid.UUID | None = None
  jurisdiction_id: uuid.UUID | None = None
  institution_id: uuid.UUID | None = None

class PolicyUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=5, max_length=300)
  description: str | None = None
  ministry_id: uuid.UUID | None = None

class PolicyRead(PolicyListRead):
  description: str | None
  source: str
  as_of_date: date
  confidence: str
  created_by: uuid.UUID | None
  updated_by: uuid.UUID | None

class PolicyReviewRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  policy_id: uuid.UUID
  reviewer_id: uuid.UUID | None
  review_round: int
  status: str
  comments: str | None
  created_at: datetime

class PolicyReviewCreate(BaseModel):
  review_round: int = 1
  status: str = "submitted"  
  comments: str | None = None

class PolicyApprovalRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  policy_id: uuid.UUID
  approver_id: uuid.UUID | None
  approval_step: int
  step_name: str
  status: str
  comments: str | None
  decided_at: datetime | None
  created_at: datetime

class PolicyApprovalCreate(BaseModel):
  approval_step: int
  step_name: str = Field(min_length=1, max_length=100)

class PolicyApprovalDecide(BaseModel):
  status: str  
  comments: str | None = None

class PolicyIndicatorRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  policy_id: uuid.UUID
  indicator_name: str
  target_value: Decimal
  current_value: Decimal
  unit: str
  as_of_date: date
  source: str
  confidence: str

class PolicyIndicatorCreate(BaseModel):
  indicator_name: str = Field(min_length=1, max_length=150)
  target_value: Decimal = Field(max_digits=10, decimal_places=2)
  current_value: Decimal = Field(default=Decimal("0.00"), max_digits=10, decimal_places=2)
  unit: str = Field(min_length=1, max_length=50)
  as_of_date: date
  source: str = "synthetic — illustrative only"
  confidence: str = "low"

class PolicyIndicatorUpdate(BaseModel):
  current_value: Decimal = Field(default=None, max_digits=10, decimal_places=2)
  as_of_date: date | None = None
  source: str | None = None
  confidence: str | None = None

class PolicyImplementationRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  policy_id: uuid.UUID
  milestone: str
  target_date: date
  completion_date: date | None
  status: str
  budget_utilized: Decimal | None
  notes: str | None
  created_at: datetime

class PolicyImplementationCreate(BaseModel):
  milestone: str = Field(min_length=1, max_length=300)
  target_date: date
  budget_utilized: Decimal | None = Field(default=None, max_digits=15, decimal_places=2)
  notes: str | None = None

class PolicyImplementationUpdate(BaseModel):
  status: str | None = None 
  completion_date: date | None = None
  budget_utilized: Decimal | None = Field(default=None, max_digits=15, decimal_places=2)
  notes: str | None = None

class PolicyEvaluationRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  policy_id: uuid.UUID
  evaluator_id: uuid.UUID | None
  effectiveness_score: int | None = Field(default=None, ge=1, le=10)
  efficiency_score: int | None = Field(default=None, ge=1, le=10)
  impact_summary: str | None
  recommendations: str | None
  evaluated_at: datetime

class PolicyEvaluationCreate(BaseModel):
  effectiveness_score: int | None = Field(default=None, ge=1, le=10)
  efficiency_score: int | None = Field(default=None, ge=1, le=10)
  impact_summary: str | None = None
  recommendations: str | None = None

class PolicyDetailRead(PolicyRead):
  reviews: list[PolicyReviewRead] = []
  approvals: list[PolicyApprovalRead] = []
  indicators: list[PolicyIndicatorRead] = []
  implementations: list[PolicyImplementationRead] = []
  evaluations: list[PolicyEvaluationRead] = []

class PolicyStatusTransition(BaseModel):
  new_status: str
  comment: str | None = None