from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import DateTime, Uuid, Integer, func
import uuid

class TimestampMixin:
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

class AuditMixin:
  created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
  updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
  version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

class JurisdictionScopedMixin:
  jurisdiction_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
  institution_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)