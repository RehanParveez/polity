from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, ForeignKey, String, Text, JSON

if TYPE_CHECKING:
  from app.modules.identity.models import User
  from app.modules.institutions.models import Ministry

class SavedSession(Base, TimestampMixin):
  __tablename__ = "saved_sessions"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  scenario_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("scenarios.id"), nullable=True)
  snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  visibility: Mapped[str] = mapped_column(String(30), default = "private", nullable=False)
  owner: Mapped["User"] = relationship()
  shares: Mapped[list["SessionShare"]] = relationship(back_populates = "session", cascade = "all, delete-orphan")

class SessionShare(Base, TimestampMixin):
  __tablename__ = "session_shares"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  session_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("saved_sessions.id", ondelete = "CASCADE"), nullable=False)
  shared_with_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  shared_with_institution_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=True)
  permission: Mapped[str] = mapped_column(String(20), default = "view", nullable=False)
  session: Mapped["SavedSession"] = relationship(back_populates = "shares")
  shared_user: Mapped["User | None"] = relationship()
  shared_institution: Mapped["Ministry | None"] = relationship()