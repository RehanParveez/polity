from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date

class UserBrief(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  full_name: str

class MinistryBrief(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  code: str

class CabinetMemberRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  government_id: uuid.UUID
  user_id: uuid.UUID | None
  ministry_id: uuid.UUID | None
  portfolio: str
  oath_taken: bool
  is_active: bool
  user: UserBrief | None = None
  ministry: MinistryBrief | None = None

class CabinetMemberCreate(BaseModel):
  user_id: uuid.UUID | None = None
  ministry_id: uuid.UUID | None = None
  portfolio: str
  oath_taken: bool = False
  is_active: bool = True
  sort_order: int | None = None

class GovernmentListRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  election_id: uuid.UUID | None
  name: str
  status: str
  formed_date: date
  dissolved_date: date | None
  head_of_state_name: str | None
  head_of_government_name: str | None

class GovernmentRead(GovernmentListRead):
  cabinet_members: list[CabinetMemberRead] = []

class GovernmentCreate(BaseModel):
  election_id: uuid.UUID | None = None
  name: str
  status: str = "active"
  formed_date: date
  dissolved_date: date | None = None
  head_of_state_name: str | None = None
  head_of_government_name: str | None = None
  head_of_state_user_id: uuid.UUID | None = None
  head_of_government_user_id: uuid.UUID | None = None