from typing import TYPE_CHECKING
from app.core.database import Base
import uuid
from sqlalchemy import Uuid, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.shared.mixins import TimestampMixin

if TYPE_CHECKING:
  from app.modules.identity.models import User

class Role(Base, TimestampMixin):
  __tablename__ = "roles"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
  description: Mapped[str | None] = mapped_column(String(255), nullable=True)

  permissions: Mapped[list["RolePermission"]] = relationship(back_populates = "role")

class Permission(Base, TimestampMixin):
  __tablename__ = "permissions"
    
  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  code: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
  description: Mapped[str | None] = mapped_column(String(255), nullable=True)

class UserRole(Base):
  __tablename__ = "user_roles"
  __table_args__ = (UniqueConstraint("user_id", "role_id", name = "uq_user_role"),)

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  role_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("roles.id"), nullable=False)
  user: Mapped["User"] = relationship(back_populates = "roles")
  role: Mapped["Role"] = relationship()

class RolePermission(Base):
  __tablename__ = "role_permissions"
  __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  role_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("roles.id"), nullable=False)
  permission_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("permissions.id"), nullable=False)
  role: Mapped["Role"] = relationship(back_populates="permissions")
  permission: Mapped["Permission"] = relationship()

class Jurisdiction(Base, TimestampMixin):
  __tablename__ = "jurisdictions"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(150), nullable=False)
  level: Mapped[str] = mapped_column(String(50), nullable=False)  # real hierarchy lands Phase 2 (geography)

class UserJurisdiction(Base):
  __tablename__ = "user_jurisdictions"
  __table_args__ = (UniqueConstraint("user_id", "jurisdiction_id", name="uq_user_jurisdiction"),)

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  jurisdiction_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("jurisdictions.id"), nullable=False)
  user: Mapped["User"] = relationship(back_populates="jurisdictions")
  jurisdiction: Mapped["Jurisdiction"] = relationship()