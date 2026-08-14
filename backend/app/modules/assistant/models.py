from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, ForeignKey, String, Text, Integer, Boolean, JSON

if TYPE_CHECKING:
  from app.modules.identity.models import User

class AIRequest(Base, TimestampMixin):
  __tablename__ = "ai_requests"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  agent_name: Mapped[str] = mapped_column(String(50), nullable=False)
  prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
  model_used: Mapped[str] = mapped_column(String(50), nullable=False)
  status: Mapped[str] = mapped_column(String(20), default = "pending", nullable=False)
  latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
  error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
  entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True) 
  entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
  tokens_prompt: Mapped[int | None] = mapped_column(Integer, nullable=True)
  tokens_completion: Mapped[int | None] = mapped_column(Integer, nullable=True)
  user: Mapped["User"] = relationship()
  response: Mapped["AIResponse | None"] = relationship(back_populates = "request", uselist=False)

class AIResponse(Base, TimestampMixin):
  __tablename__ = "ai_responses"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  request_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ai_requests.id"), nullable=False)
  raw_output: Mapped[str] = mapped_column(Text, nullable=False)
  parsed_output: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  is_valid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  validation_error: Mapped[str | None] = mapped_column(Text, nullable=True)
  used_fallback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  request: Mapped["AIRequest"] = relationship(back_populates = "response")