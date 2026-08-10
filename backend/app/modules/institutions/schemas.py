from pydantic import BaseModel, ConfigDict
import uuid

class MinistryRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  code: str
  description: str | None = None

class DepartmentRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  ministry_id: uuid.UUID
  name: str
  description: str | None = None

class MembershipUserBrief(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  full_name: str

class MembershipRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  title: str
  user: MembershipUserBrief

class DepartmentDetailRead(DepartmentRead):
  memberships: list[MembershipRead] = []

class MinistryDetailRead(MinistryRead):
  departments: list[DepartmentDetailRead] = []