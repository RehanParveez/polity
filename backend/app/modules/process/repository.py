from app.modules.process.models import Indicator, IndicatorValue, SimulationRule, Scenario, ScenarioInput, SimulationRun, SimulationResult, ScenarioComparison
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload

async def list_indicators(db: AsyncSession, category: str | None = None) -> list[Indicator]:
  stmt = select(Indicator).order_by(Indicator.category, Indicator.name)
  if category:
    stmt = stmt.where(Indicator.category == category)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_indicator_by_code(db: AsyncSession, code: str) -> Indicator | None:
  result = await db.execute(select(Indicator).where(Indicator.code == code))
  return result.scalar_one_or_none()

async def get_indicator(db: AsyncSession, indicator_id: uuid.UUID) -> Indicator | None:
  result = await db.execute(select(Indicator).where(Indicator.id == indicator_id))
  return result.scalar_one_or_none()

async def create_indicator(db: AsyncSession, **kwargs) -> Indicator:
  ind = Indicator(**kwargs)
  db.add(ind)
  await db.flush()
  return ind

async def list_indicator_values(db: AsyncSession, indicator_id: uuid.UUID | None = None, district_id: uuid.UUID | None = None) -> list[IndicatorValue]:
  stmt = select(IndicatorValue).options(selectinload(IndicatorValue.indicator), selectinload(IndicatorValue.district))
  if indicator_id:
    stmt = stmt.where(IndicatorValue.indicator_id == indicator_id)
  if district_id:
    stmt = stmt.where(IndicatorValue.district_id == district_id)
  result = await db.execute(stmt.order_by(IndicatorValue.as_of_date.desc()))
  return list(result.scalars().all())

async def get_latest_indicator_value(db: AsyncSession, indicator_code: str, district_id: uuid.UUID | None = None) -> IndicatorValue | None:
  indicator = await get_indicator_by_code(db, indicator_code)
  if not indicator:
    return None
  stmt = (
    select(IndicatorValue)
    .where(IndicatorValue.indicator_id == indicator.id)
    .order_by(IndicatorValue.as_of_date.desc())
  )
  if district_id:
    stmt = stmt.where(IndicatorValue.district_id == district_id)
  else:
    stmt = stmt.where(IndicatorValue.district_id.is_(None))
  result = await db.execute(stmt)
  return result.scalars().first()

async def create_indicator_value(db: AsyncSession, **kwargs) -> IndicatorValue:
  iv = IndicatorValue(**kwargs)
  db.add(iv)
  await db.flush()
  return iv

async def list_active_rules(db: AsyncSession) -> list[SimulationRule]:
  result = await db.execute(select(SimulationRule).where(SimulationRule.is_active == True).order_by(SimulationRule.rule_name))
  return list(result.scalars().all())

async def get_rule_by_name(db: AsyncSession, rule_name: str) -> SimulationRule | None:
  result = await db.execute(select(SimulationRule).where(SimulationRule.rule_name == rule_name))
  return result.scalar_one_or_none()

async def create_rule(db: AsyncSession, **kwargs) -> SimulationRule:
  rule = SimulationRule(**kwargs)
  db.add(rule)
  await db.flush()
  return rule

async def list_scenarios(db: AsyncSession, owner_id: uuid.UUID | None = None, status: str | None = None) -> list[Scenario]:
  stmt = select(Scenario).order_by(Scenario.created_at.desc())
  if owner_id:
    stmt = stmt.where(Scenario.owner_id == owner_id)
  if status:
    stmt = stmt.where(Scenario.status == status)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_scenario(db: AsyncSession, scenario_id: uuid.UUID) -> Scenario | None:
  stmt = (
    select(Scenario)
    .options(selectinload(Scenario.inputs), selectinload(Scenario.simulation_runs))
    .where(Scenario.id == scenario_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_scenario(db: AsyncSession, **kwargs) -> Scenario:
  scenario = Scenario(**kwargs)
  db.add(scenario)
  await db.flush()
  return scenario

async def update_scenario(db: AsyncSession, scenario: Scenario, **kwargs) -> None:
  for key, value in kwargs.items():
    if value is not None and hasattr(scenario, key):
      setattr(scenario, key, value)
  await db.flush()

async def delete_scenario(db: AsyncSession, scenario: Scenario) -> None:
  await db.delete(scenario)
  await db.flush()

async def add_scenario_input(db: AsyncSession, scenario_id: uuid.UUID, **kwargs) -> ScenarioInput:
  inp = ScenarioInput(scenario_id=scenario_id, **kwargs)
  db.add(inp)
  await db.flush()
  return inp

async def get_scenario_input(db: AsyncSession, input_id: uuid.UUID) -> ScenarioInput | None:
  result = await db.execute(select(ScenarioInput).where(ScenarioInput.id == input_id))
  return result.scalar_one_or_none()

async def delete_scenario_input(db: AsyncSession, inp: ScenarioInput) -> None:
  await db.delete(inp)
  await db.flush()

async def get_run(db: AsyncSession, run_id: uuid.UUID) -> SimulationRun | None:
  stmt = (
    select(SimulationRun)
    .options(selectinload(SimulationRun.results).selectinload(SimulationResult.indicator))
    .where(SimulationRun.id == run_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_run(db: AsyncSession, **kwargs) -> SimulationRun:
  run = SimulationRun(**kwargs)
  db.add(run)
  await db.flush()
  return run

async def update_run_status(db: AsyncSession, run: SimulationRun, status: str, error_message: str | None = None) -> None:
  run.status = status
  if status == "running":
    run.started_at = datetime.now(timezone.utc)
  if status in {"completed", "failed"}:
    run.completed_at = datetime.now(timezone.utc)
  if error_message is not None:
    run.error_message = error_message
  await db.flush()

async def add_result(db: AsyncSession, **kwargs) -> SimulationResult:
  res = SimulationResult(**kwargs)
  db.add(res)
  await db.flush()
  return res

async def create_comparison(db: AsyncSession, **kwargs) -> ScenarioComparison:
  comp = ScenarioComparison(**kwargs)
  db.add(comp)
  await db.flush()
  return comp

async def get_comparison(db: AsyncSession, comparison_id: uuid.UUID) -> ScenarioComparison | None:
  result = await db.execute(select(ScenarioComparison).where(ScenarioComparison.id == comparison_id))
  return result.scalar_one_or_none()

async def list_comparisons(db: AsyncSession) -> list[ScenarioComparison]:
  result = await db.execute(select(ScenarioComparison).order_by(ScenarioComparison.created_at.desc()))
  return list(result.scalars().all())