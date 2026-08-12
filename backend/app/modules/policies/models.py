from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin, AuditMixin, JurisdictionScopedMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, String, ForeignKey, Text, Numeric, Date, DateTime, Integer, func
from datetime import date, datetime
from decimal import Decimal

if TYPE_CHECKING:
  from app.modules.identity.models import User
  from app.modules.institutions.models import Ministry

class Policy(Base, TimestampMixin, AuditMixin, JurisdictionScopedMixin):

  __tablename__ = "policies"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  title: Mapped[str] = mapped_column(String(300), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  ministry_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "draft", nullable=False)
  current_approval_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  ministry: Mapped["Ministry | None"] = relationship()
  reviews: Mapped[list["PolicyReview"]] = relationship(back_populates = "policy", cascade = "all, delete-orphan", order_by = "PolicyReview.review_round.desc()")
  approvals: Mapped[list["PolicyApproval"]] = relationship(back_populates = "policy", cascade = "all, delete-orphan", order_by = "PolicyApproval.approval_step")
  indicators: Mapped[list["PolicyIndicator"]] = relationship(back_populates = "policy", cascade = "all, delete-orphan")
  implementations: Mapped[list["PolicyImplementation"]] = relationship(back_populates = "policy", cascade = "all, delete-orphan", order_by = "PolicyImplementation.target_date")
  evaluations: Mapped[list["PolicyEvaluation"]] = relationship(back_populates = "policy", cascade = "all, delete-orphan", order_by = "PolicyEvaluation.evaluated_at.desc()")

class PolicyReview(Base, TimestampMixin):
  __tablename__ = "policy_reviews"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  policy_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete = "CASCADE"), nullable=False)
  reviewer_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  review_round: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "submitted", nullable=False)
  comments: Mapped[str | None] = mapped_column(Text, nullable=True)
  policy: Mapped["Policy"] = relationship(back_populates = "reviews")
  reviewer: Mapped["User | None"] = relationship()

class PolicyApproval(Base, TimestampMixin):
  __tablename__ = "policy_approvals"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  policy_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete = "CASCADE"), nullable=False)
  approver_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  approval_step: Mapped[int] = mapped_column(Integer, nullable=False)
  step_name: Mapped[str] = mapped_column(String(100), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "pending", nullable=False)
  comments: Mapped[str | None] = mapped_column(Text, nullable=True)
  decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
  policy: Mapped["Policy"] = relationship(back_populates = "approvals")
  approver: Mapped["User | None"] = relationship()

class PolicyIndicator(Base, TimestampMixin):
  __tablename__ = "policy_indicators"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  policy_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete = "CASCADE"), nullable=False)
  indicator_name: Mapped[str] = mapped_column(String(150), nullable=False)
  target_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  current_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
  unit: Mapped[str] = mapped_column(String(50), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  policy: Mapped["Policy"] = relationship(back_populates = "indicators")

class PolicyImplementation(Base, TimestampMixin):
  __tablename__ = "policy_implementations"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  policy_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete = "CASCADE"), nullable=False)
  milestone: Mapped[str] = mapped_column(String(300), nullable=False)
  target_date: Mapped[date] = mapped_column(Date, nullable=False)
  completion_date: Mapped[date | None] = mapped_column(Date, nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "not_started", nullable=False)
  budget_utilized: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
  notes: Mapped[str | None] = mapped_column(Text, nullable=True)
  policy: Mapped["Policy"] = relationship(back_populates = "implementations")

class PolicyEvaluation(Base, TimestampMixin):
  __tablename__ = "policy_evaluations"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  policy_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
  evaluator_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  effectiveness_score: Mapped[int | None] = mapped_column(Integer, nullable=True) 
  efficiency_score: Mapped[int | None] = mapped_column(Integer, nullable=True) 
  impact_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
  recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
  evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
  policy: Mapped["Policy"] = relationship(back_populates = "evaluations")
  evaluator: Mapped["User | None"] = relationship()