from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
import uuid 
from sqlalchemy import Uuid, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
  from app.modules.identity.models import User
  
class Ministry(Base, TimestampMixin):
  __tablename__ = "ministries"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
  code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
  description: Mapped[str | None] = mapped_column(String(500), nullable=True)
  departments: Mapped[list["Department"]] = relationship(back_populates = "ministry")


class Department(Base, TimestampMixin):
  __tablename__ = "departments"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=False)
  name: Mapped[str] = mapped_column(String(150), nullable=False)
  description: Mapped[str | None] = mapped_column(String(500), nullable=True)

  ministry: Mapped["Ministry"] = relationship(back_populates = "departments")
  memberships: Mapped[list["InstitutionMembership"]] = relationship(back_populates = "department")

class InstitutionMembership(Base, TimestampMixin):
  __tablename__ = "institution_memberships"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=False)
  department_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("departments.id"), nullable=True)
  title: Mapped[str] = mapped_column(String(150), nullable=False)

  user: Mapped["User"] = relationship()
  ministry: Mapped["Ministry"] = relationship()
  department: Mapped["Department | None"] = relationship(back_populates = "memberships")