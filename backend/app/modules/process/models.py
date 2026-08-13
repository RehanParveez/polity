from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin, AuditMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, ForeignKey, String, Text, Numeric, Date, DateTime, Integer, Boolean, JSON
from datetime import date, datetime
from decimal import Decimal
from app.modules.geography.models import District

if TYPE_CHECKING:
  from app.modules.identity.models import User

class Indicator(Base, TimestampMixin):
  __tablename__ = "indicators"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(150), nullable=False)
  code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
  category: Mapped[str] = mapped_column(String(50), nullable=False) 
  unit: Mapped[str] = mapped_column(String(50), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  is_higher_better: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
  values: Mapped[list["IndicatorValue"]] = relationship(back_populates = "indicator", cascade = "all, delete-orphan")
  simulation_results: Mapped[list["SimulationResult"]] = relationship(back_populates = "indicator")

class IndicatorValue(Base, TimestampMixin):
  __tablename__ = "indicator_values"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  indicator_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("indicators.id", ondelete="CASCADE"), nullable=False)
  district_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=True)
  value: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  indicator: Mapped["Indicator"] = relationship(back_populates = "values")
  district: Mapped["District | None"] = relationship()

class SimulationRule(Base, TimestampMixin):
  __tablename__ = "simulation_rules"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  rule_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
  rule_config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False) 
  affected_indicator_codes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

class Scenario(Base, TimestampMixin, AuditMixin):
  __tablename__ = "scenarios"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "draft", nullable=False)  
  visibility: Mapped[str] = mapped_column(String(30), default = "private", nullable=False)  
  owner: Mapped["User"] = relationship()
  inputs: Mapped[list["ScenarioInput"]] = relationship(back_populates = "scenario", cascade = "all, delete-orphan")
  simulation_runs: Mapped[list["SimulationRun"]] = relationship(back_populates = "scenario", cascade = "all, delete-orphan", order_by = "SimulationRun.created_at.desc()")

class ScenarioInput(Base, TimestampMixin):
  __tablename__ = "scenario_inputs"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  scenario_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("scenarios.id", ondelete = "CASCADE"), nullable=False)
  rule_name: Mapped[str] = mapped_column(String(100), nullable=False)
  parameter_name: Mapped[str] = mapped_column(String(100), nullable=False)
  parameter_value: Mapped[str] = mapped_column(String(255), nullable=False)  
  scenario: Mapped["Scenario"] = relationship(back_populates = "inputs")

class SimulationRun(Base, TimestampMixin):
  __tablename__ = "simulation_runs"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  scenario_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("scenarios.id", ondelete = "CASCADE"), nullable=False)
  status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
  started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
  completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
  triggered_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
  error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
  scenario: Mapped["Scenario"] = relationship(back_populates = "simulation_runs")
  results: Mapped[list["SimulationResult"]] = relationship(back_populates = "simulation_run", cascade = "all, delete-orphan")
  comparisons_baseline: Mapped[list["ScenarioComparison"]] = relationship(foreign_keys = "ScenarioComparison.baseline_run_id", back_populates = "baseline_run")
  comparisons_comparison: Mapped[list["ScenarioComparison"]] = relationship(foreign_keys = "ScenarioComparison.comparison_run_id", back_populates = "comparison_run")

class SimulationResult(Base, TimestampMixin):
  __tablename__ = "simulation_results"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  simulation_run_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("simulation_runs.id", ondelete = "CASCADE"), nullable=False)
  indicator_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("indicators.id"), nullable=False)
  district_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=True)
  baseline_value: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
  simulated_value: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
  absolute_change: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
  percent_change: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
  rule_applied: Mapped[str] = mapped_column(String(100), nullable=False)
  simulation_run: Mapped["SimulationRun"] = relationship(back_populates = "results")
  indicator: Mapped["Indicator"] = relationship()
  district: Mapped["District | None"] = relationship()

class ScenarioComparison(Base, TimestampMixin):
  __tablename__ = "scenario_comparisons"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  title: Mapped[str] = mapped_column(String(200), nullable=False)
  baseline_run_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("simulation_runs.id"), nullable=False)
  comparison_run_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("simulation_runs.id"), nullable=False)
  diff_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
  baseline_run: Mapped["SimulationRun"] = relationship(foreign_keys=[baseline_run_id], back_populates = "comparisons_baseline")
  comparison_run: Mapped["SimulationRun"] = relationship(foreign_keys=[comparison_run_id], back_populates = "comparisons_comparison")