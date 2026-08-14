from app.core.database import Base
from app.shared.mixins import TimestampMixin
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid, String, JSON

class AuditEvent(Base, TimestampMixin):
  __tablename__ = "audit_events"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
  entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
  action: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
  actor_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
  actor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
  before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
  after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
  event_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  module: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)