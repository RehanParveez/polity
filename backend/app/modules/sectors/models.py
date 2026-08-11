from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, Date, ForeignKey, Integer, Numeric, String, Text
from datetime import date
from decimal import Decimal

if TYPE_CHECKING:
  from app.modules.geography.models import District
  from app.modules.institutions.models import Ministry

class EducationInstitution(Base, TimestampMixin):
  __tablename__ = "education_institutions"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  institution_type: Mapped[str] = mapped_column(String(50), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  enrollment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  teacher_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship()

class HealthcareInstitution(Base, TimestampMixin):
  __tablename__ = "healthcare_institutions"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  facility_type: Mapped[str] = mapped_column(String(50), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  bed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  staff_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  daily_patient_capacity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship()

class Farm(Base, TimestampMixin):
  __tablename__ = "farms"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  area_hectares: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
  primary_crop: Mapped[str] = mapped_column(String(100), nullable=False)
  annual_yield_tons: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
  irrigation_type: Mapped[str] = mapped_column(String(50), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship()

class InfrastructureAsset(Base, TimestampMixin):
  __tablename__ = "infrastructure_assets"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  length_km_or_capacity: Mapped[str] = mapped_column(String(100), nullable=False)
  condition_rating: Mapped[str] = mapped_column(String(20), nullable=False)
  year_constructed: Mapped[int | None] = mapped_column(Integer, nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "operational", nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship()

class LaborRecord(Base, TimestampMixin):
  __tablename__ = "labor_records"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  total_workforce: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  employed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  unemployed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  unemployment_rate_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  minimum_wage_pkr: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
  dominant_sectors: Mapped[str | None] = mapped_column(String(255), nullable=True)
  status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship()

class DefenseMinistry(Base, TimestampMixin):
  __tablename__ = "defense_ministries"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ministries.id"), nullable=False)
  total_personnel_summary: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  annual_budget_summary: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
  training_completion_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  civilian_oversight_status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)

  ministry: Mapped["Ministry"] = relationship()
  branches: Mapped[list["DefenseBranch"]] = relationship(back_populates = "defense_ministry", cascade = "all, delete-orphan")
  budgets: Mapped[list["DefenseBudget"]] = relationship(back_populates = "defense_ministry", cascade = "all, delete-orphan")
  procurements: Mapped[list["DefenseProcurementProject"]] = relationship(back_populates = "defense_ministry", cascade = "all, delete-orphan")
  disaster_units: Mapped[list["DisasterResponseUnit"]] = relationship(back_populates = "defense_ministry", cascade = "all, delete-orphan")
  indicators: Mapped[list["DefenseIndicator"]] = relationship(back_populates = "defense_ministry", cascade = "all, delete-orphan")

class DefenseBranch(Base, TimestampMixin):
  __tablename__ = "defense_branches"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_ministries.id", ondelete = "CASCADE"), nullable=False)
  branch_name: Mapped[str] = mapped_column(String(100), nullable=False)
  personnel_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  training_completion_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  active_operations_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  defense_ministry: Mapped["DefenseMinistry"] = relationship(back_populates = "branches")
  personnel: Mapped[list["MilitaryPersonnel"]] = relationship(back_populates = "defense_branch", cascade = "all, delete-orphan")

class MilitaryPersonnel(Base, TimestampMixin):
  __tablename__ = "military_personnel"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_branches.id", ondelete = "CASCADE"), nullable=False)
  rank_category: Mapped[str] = mapped_column(String(50), nullable=False)
  count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  women_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  training_status: Mapped[str] = mapped_column(String(30), default = "trained", nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  defense_branch: Mapped["DefenseBranch"] = relationship(back_populates = "personnel")

class DefenseBudget(Base, TimestampMixin):
  __tablename__ = "defense_budgets"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_ministries.id", ondelete = "CASCADE"), nullable=False)
  fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
  total_allocated: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  total_spent: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
  personnel_allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  equipment_allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  infrastructure_allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  research_allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  defense_ministry: Mapped["DefenseMinistry"] = relationship(back_populates = "budgets")

class DefenseProcurementProject(Base, TimestampMixin):
  __tablename__ = "defense_procurement_projects"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_ministries.id", ondelete = "CASCADE"), nullable=False)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  budget_estimate: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
  contract_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "planned", nullable=False)
  vendor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
  approval_date: Mapped[date | None] = mapped_column(Date, nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "planned", nullable=False)
  defense_ministry: Mapped["DefenseMinistry"] = relationship(back_populates = "procurements")

class DisasterResponseUnit(Base, TimestampMixin):
  __tablename__ = "disaster_response_units"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_ministries.id", ondelete = "CASCADE"), nullable=False)
  unit_name: Mapped[str] = mapped_column(String(150), nullable=False)
  unit_type: Mapped[str] = mapped_column(String(50), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  personnel_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  equipment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  readiness_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
  last_exercise_date: Mapped[date | None] = mapped_column(Date, nullable=True)
  status: Mapped[str] = mapped_column(String(30), default = "active", nullable=False)
  defense_ministry: Mapped["DefenseMinistry"] = relationship(back_populates = "disaster_units")
  district: Mapped["District"] = relationship()

class DefenseIndicator(Base, TimestampMixin):
  __tablename__ = "defense_indicators"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  defense_ministry_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("defense_ministries.id", ondelete = "CASCADE"), nullable=False)
  indicator_name: Mapped[str] = mapped_column(String(150), nullable=False)
  value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
  unit: Mapped[str] = mapped_column(String(50), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  defense_ministry: Mapped["DefenseMinistry"] = relationship(back_populates = "indicators")