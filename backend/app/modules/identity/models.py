import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.mixins import TimestampMixin

if TYPE_CHECKING:
  from app.modules.authorization.models import UserJurisdiction, UserRole

class User(Base, TimestampMixin):
  __tablename__ = "users"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
  hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
  full_name: Mapped[str] = mapped_column(String(255), nullable=False)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

  roles: Mapped[list["UserRole"]] = relationship(back_populates = "user")
  jurisdictions: Mapped[list["UserJurisdiction"]] = relationship(back_populates = "user")

class RefreshToken(Base, TimestampMixin):
  __tablename__ = "refresh_tokens"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
  
class PasswordResetToken(Base, TimestampMixin):
  __tablename__ = "password_reset_tokens"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)