from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, Date, ForeignKey, Integer, Numeric, String, Text
from datetime import date
from decimal import Decimal

if TYPE_CHECKING:
  from app.modules.institutions.models import Ministry

class RevenueSource(Base, TimestampMixin):
  __tablename__ = "revenue_sources"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(150), nullable=False)
  category: Mapped[str] = mapped_column(String(50), nullable=False)
  amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)

class Budget(Base, TimestampMixin):
  __tablename__ = "budgets"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  ministry_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=True)
  government_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("governments.id"), nullable=True)
  fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
  total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default="draft", nullable=False)
  description: Mapped[str | None] = mapped_column(String(500), nullable=True)
  ministry: Mapped["Ministry | None"] = relationship()
  lines: Mapped[list["BudgetLine"]] = relationship(back_populates = "budget", cascade = "all, delete-orphan")


class BudgetLine(Base, TimestampMixin):
  __tablename__ = "budget_lines"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  budget_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("budgets.id", ondelete = "CASCADE"), nullable=False)
  category: Mapped[str] = mapped_column(String(100), nullable=False)
  allocated_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  spent_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
  budget: Mapped["Budget"] = relationship(back_populates="lines")


class ProcurementProject(Base, TimestampMixin):
  __tablename__ = "procurement_projects"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=False)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  budget_estimate: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "planned", nullable=False)
  vendor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
  ministry: Mapped["Ministry"] = relationship()

class AuditFinding(Base, TimestampMixin):
  __tablename__ = "audit_findings"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
  entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
  severity: Mapped[str] = mapped_column(String(20), nullable=False)
  description: Mapped[str] = mapped_column(Text, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "open", nullable=False)