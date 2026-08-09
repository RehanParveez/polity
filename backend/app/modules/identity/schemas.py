import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field

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
  permissions: list[str] = Field(default_factory=list)

class LoginRequest(BaseModel):
  email: EmailStr
  password: str

class TokenPair(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"

class RefreshRequest(BaseModel):
  refresh_token: str
  
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    dev_reset_token: str | None = None 

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str