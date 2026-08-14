from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class AuditEventRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  entity_type: str
  entity_id: uuid.UUID
  action: str
  actor_id: uuid.UUID | None
  actor_name: str | None
  before_state: dict | None
  after_state: dict | None
  metadata: dict
  module: str | None
  created_at: datetime

class AuditEventList(BaseModel):
  data: list[AuditEventRead]
  total: int
  limit: int
  offset: int

class AuditSummaryByModule(BaseModel):
  module: str | None
  event_count: int

class AuditSummaryByAction(BaseModel):
  action: str
  event_count: int