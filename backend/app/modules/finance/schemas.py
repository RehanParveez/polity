from pydantic import BaseModel, ConfigDict, Field
import uuid
from decimal import Decimal

class RevenueSourceRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  category: str
  amount: Decimal
  fiscal_year: int
  source: str
  as_of_date: str
  confidence: str

class BudgetLineRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  budget_id: uuid.UUID
  category: str
  allocated_amount: Decimal
  spent_amount: Decimal

class BudgetLineCreate(BaseModel):
  category: str
  allocated_amount: Decimal = Field(max_digits=15, decimal_places=2)
  spent_amount: Decimal = Field(default=Decimal("0.00"), max_digits=15, decimal_places=2)

class BudgetRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  ministry_id: uuid.UUID | None
  ministry_name: str | None = None
  government_id: uuid.UUID | None
  fiscal_year: int
  total_amount: Decimal
  status: str
  description: str | None
  total_allocated: Decimal = Decimal("0.00")
  total_spent: Decimal = Decimal("0.00")
  remaining: Decimal = Decimal("0.00")
  lines: list[BudgetLineRead] = []

class BudgetCreate(BaseModel):
  ministry_id: uuid.UUID | None = None
  government_id: uuid.UUID | None = None
  fiscal_year: int
  total_amount: Decimal = Field(max_digits=15, decimal_places=2)
  status: str = "draft"
  description: str | None = None

class ProcurementRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  ministry_id: uuid.UUID
  ministry_name: str | None = None
  title: str
  description: str | None
  budget_estimate: Decimal
  status: str
  vendor_name: str | None

class ProcurementCreate(BaseModel):
  ministry_id: uuid.UUID
  title: str
  description: str | None = None
  budget_estimate: Decimal = Field(max_digits=15, decimal_places=2)
  status: str = "planned"
  vendor_name: str | None = None

class AuditFindingRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  entity_type: str
  entity_id: uuid.UUID
  severity: str
  description: str
  status: str

class FinanceSummary(BaseModel):
  total_revenue: Decimal
  total_budget: Decimal
  total_procurement: Decimal
  open_audits: int