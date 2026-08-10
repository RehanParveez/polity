from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import ForeignKey, String, Boolean, Date, Integer,  Uuid
from datetime import date

if TYPE_CHECKING:
  from app.modules.elections.models import Election
  from app.modules.identity.models import User
  from app.modules.institutions.models import Ministry

class Government(Base, TimestampMixin):
  __tablename__ = "governments"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  election_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("elections.id"), nullable=True)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
  formed_date: Mapped[date] = mapped_column(Date, nullable=False)
  dissolved_date: Mapped[date | None] = mapped_column(Date, nullable=True)
  head_of_state_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
  head_of_government_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
  head_of_state_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  head_of_government_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  election: Mapped["Election | None"] = relationship()
  cabinet_members: Mapped[list["CabinetMember"]] = relationship(back_populates = "government", cascade = "all, delete-orphan", order_by = "CabinetMember.sort_order")

class CabinetMember(Base, TimestampMixin):
  __tablename__ = "cabinet_members"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  government_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("governments.id", ondelete = "CASCADE"), nullable=False)
  user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  ministry_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=True)
  portfolio: Mapped[str] = mapped_column(String(200), nullable=False)
  oath_taken: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
  sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
  government: Mapped["Government"] = relationship(back_populates = "cabinet_members")
  user: Mapped["User | None"] = relationship()
  ministry: Mapped["Ministry | None"] = relationship()