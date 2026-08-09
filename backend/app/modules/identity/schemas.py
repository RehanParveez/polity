import uuid
from pydantic import BaseModel, ConfigDict, EmailStr

class UserCreate(BaseModel):
  email: EmailStr
  password: str
  full_name: str

class UserRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  email: EmailStr
  full_name: str
  is_active: bool
  permissions: list[str] = []

class LoginRequest(BaseModel):
  email: EmailStr
  password: str

class TokenPair(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"

class RefreshRequest(BaseModel):
  refresh_token: str