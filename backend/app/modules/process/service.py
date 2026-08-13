from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.process.models import SimulationResult, SimulationRun, Scenario, ScenarioInput, ScenarioComparison
from collections import defaultdict
from app.modules.process import repository
from decimal import Decimal, ROUND_HALF_UP
from app.modules.process.schemas import ScenarioCreate, ScenarioUpdate, ScenarioInputCreate, SimulationResultChartRow
from typing import Optional

class SimulationError(Exception):
  pass

class RuleEngine:

  def __init__(self, db: AsyncSession):
    self.db = db

  async def run(self, scenario_id: uuid.UUID, run_id: uuid.UUID) -> list[SimulationResult]:
    scenario = await repository.get_scenario(self.db, scenario_id)
    if not scenario:
      raise SimulationError("scenario is not present")

    inputs_by_rule: dict[str, dict[str, str]] = defaultdict(dict)
    for inp in scenario.inputs:
      inputs_by_rule[inp.rule_name][inp.parameter_name] = inp.parameter_value
    results: list[SimulationResult] = []

    for rule_name, params in inputs_by_rule.items():
      handler = getattr(self, f"_apply_{rule_name}", None)
      if handler:
        rule_results = await handler(run_id, params)
        results.extend(rule_results)
      else:
        pass

    return results

  async def _baseline(self, indicator_code: str, district_id: uuid.UUID | None = None) -> Decimal:
    iv = await repository.get_latest_indicator_value(self.db, indicator_code, district_id)
    if iv:
      return Decimal(str(iv.value))
    return Decimal("0")

  async def _indicator_id(self, indicator_code: str) -> uuid.UUID | None:
    ind = await repository.get_indicator_by_code(self.db, indicator_code)
    return ind.id if ind else None

  def _result(self, run_id: uuid.UUID, indicator_id: uuid.UUID, district_id: uuid.UUID | None,
    baseline: Decimal, simulated: Decimal, rule: str) -> SimulationResult:
    change = simulated - baseline
    pct = (change / baseline * 100).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP) if baseline != 0 else Decimal("0")
    return SimulationResult(simulation_run_id=run_id, indicator_id=indicator_id, district_id=district_id, baseline_value=baseline.quantize(Decimal("0.0001")),
     simulated_value=simulated.quantize(Decimal("0.0001")), absolute_change=change.quantize(Decimal("0.0001")), percent_change=pct, rule_applied=rule,
    )

  async def _apply_education_investment(self, run_id: uuid.UUID, params: dict[str, str]) -> list[SimulationResult]:
    budget_pct = Decimal(params.get("budget_increase_pct", "0"))
    training_hrs = Decimal(params.get("teacher_training_hours", "0"))

    baseline_literacy = await self._baseline("literacy_rate")
    baseline_enrollment = await self._baseline("total_enrollment")
    baseline_teachers = await self._baseline("teacher_count")

    new_literacy = baseline_literacy + (budget_pct / 10 * Decimal("0.3")) + (training_hrs / 100 * Decimal("0.05"))
    new_literacy = min(new_literacy, Decimal("100"))

    new_enrollment = baseline_enrollment * (1 + budget_pct / 100 * Decimal("0.2"))
    new_teachers = baseline_teachers * (1 + budget_pct / 100 * Decimal("0.15") + training_hrs / 100 * Decimal("0.005"))

    results = []
    for code, val in [("literacy_rate", new_literacy), ("total_enrollment", new_enrollment), ("teacher_count", new_teachers)]:
      iid = await self._indicator_id(code)
      if iid:
        results.append(self._result(run_id, iid, None, await self._baseline(code), val, "education_investment"))
    return results

  async def _apply_health_expansion(self, run_id: uuid.UUID, params: dict[str, str]) -> list[SimulationResult]:
    budget_pct = Decimal(params.get("budget_increase_pct", "0"))
    new_beds = int(params.get("new_beds_target", "0"))

    baseline_beds = await self._baseline("bed_count")
    baseline_staff = await self._baseline("staff_count")
    baseline_capacity = await self._baseline("patient_capacity")

    new_beds_val = baseline_beds + Decimal(new_beds) + (baseline_beds * budget_pct / 100 * Decimal("0.1"))
    new_staff = baseline_staff + Decimal(new_beds) * Decimal("0.4") + (baseline_staff * budget_pct / 100 * Decimal("0.08"))
    new_capacity = baseline_capacity + Decimal(new_beds) * Decimal("1.2") + (baseline_capacity * budget_pct / 100 * Decimal("0.05"))

    results = []
    for code, val in [("bed_count", new_beds_val), ("staff_count", new_staff), ("patient_capacity", new_capacity)]:
      iid = await self._indicator_id(code)
      if iid:
        results.append(self._result(run_id, iid, None, await self._baseline(code), val, "health_expansion"))
    return results

  async def _apply_infrastructure_build(self, run_id: uuid.UUID, params: dict[str, str]) -> list[SimulationResult]:
    investment = Decimal(params.get("road_investment_billion_pkr", "0"))

    baseline_road = await self._baseline("road_condition_index")
    baseline_conn = await self._baseline("connectivity_score")
    baseline_travel = await self._baseline("travel_time_reduction_pct")

    new_road = baseline_road + investment * Decimal("2.0")
    new_conn = baseline_conn + investment * Decimal("1.5")
    new_travel = baseline_travel + investment * Decimal("0.8")

    results = []
    for code, val in [("road_condition_index", new_road), ("connectivity_score", new_conn), ("travel_time_reduction_pct", new_travel)]:
      iid = await self._indicator_id(code)
      if iid:
        results.append(self._result(run_id, iid, None, await self._baseline(code), val, "infrastructure_build"))
    return results

  async def _apply_agriculture_modernization(self, run_id: uuid.UUID, params: dict[str, str]) -> list[SimulationResult]:
    drip_ha = Decimal(params.get("drip_irrigation_hectares", "0"))
    subsidy = Decimal(params.get("subsidy_budget_billion_pkr", "0"))

    baseline_yield = await self._baseline("yield_per_hectare")
    baseline_prod = await self._baseline("farm_productivity_index")
    baseline_water = await self._baseline("water_efficiency_score")

    new_yield = baseline_yield * (1 + drip_ha / 1000 * Decimal("0.05")) + subsidy * Decimal("0.5")
    new_prod = baseline_prod + subsidy * Decimal("3.0") + drip_ha / 1000 * Decimal("1.5")
    new_water = baseline_water + drip_ha / 1000 * Decimal("2.0") + subsidy * Decimal("0.8")

    results = []
    for code, val in [("yield_per_hectare", new_yield), ("farm_productivity_index", new_prod), ("water_efficiency_score", new_water)]:
      iid = await self._indicator_id(code)
      if iid:
        results.append(self._result(run_id, iid, None, await self._baseline(code), val, "agriculture_modernization"))
    return results

  async def _apply_labor_reform(self, run_id: uuid.UUID, params: dict[str, str]) -> list[SimulationResult]:
    wage_pct = Decimal(params.get("minimum_wage_increase_pct", "0"))
    jobs = int(params.get("job_creation_target", "0"))

    baseline_unemp = await self._baseline("unemployment_rate")
    baseline_employed = await self._baseline("employed_count")
    baseline_participation = await self._baseline("workforce_participation")

    new_unemp = baseline_unemp - (Decimal(jobs) / 1000 * Decimal("0.5")) - (wage_pct / 10 * Decimal("0.2"))
    new_unemp = max(new_unemp, Decimal("0"))

    new_employed = baseline_employed + Decimal(jobs)
    new_participation = baseline_participation + Decimal(jobs) / 1000 * Decimal("0.3")

    results = []
    for code, val in [("unemployment_rate", new_unemp), ("employed_count", new_employed), ("workforce_participation", new_participation)]:
      iid = await self._indicator_id(code)
      if iid:
        results.append(self._result(run_id, iid, None, await self._baseline(code), val, "labor_reform"))
    return results

async def create_scenario(db: AsyncSession, payload: ScenarioCreate, owner_id: uuid.UUID) -> Scenario:
  data = payload.model_dump(exclude_unset=True)
  data["owner_id"] = owner_id
  data["status"] = "draft"
  scenario = await repository.create_scenario(db, **data)
  await db.commit()
  await db.refresh(scenario)
  return scenario

async def get_scenario_detail(db: AsyncSession, scenario_id: uuid.UUID) -> Scenario | None:
  return await repository.get_scenario(db, scenario_id)

async def update_scenario(db: AsyncSession, scenario: Scenario, payload: ScenarioUpdate) -> Scenario:
  data = payload.model_dump(exclude_unset=True)
  await repository.update_scenario(db, scenario, **data)
  await db.commit()
  await db.refresh(scenario)
  return scenario

async def delete_scenario(db: AsyncSession, scenario: Scenario) -> None:
  if scenario.simulation_runs:
    raise SimulationError("cannot delete scenario with existing porcess runs")
  await repository.delete_scenario(db, scenario)
  await db.commit()

async def add_input(db: AsyncSession, scenario: Scenario, payload: ScenarioInputCreate) -> ScenarioInput:
  if scenario.status == "archived":
    raise SimulationError("cannot modify archived scenario")
  data = payload.model_dump(exclude_unset=True)
  inp = await repository.add_scenario_input(db, scenario.id, **data)
  await db.commit()
  await db.refresh(inp)
  return inp

async def remove_input(db: AsyncSession, scenario: Scenario, input_id: uuid.UUID) -> None:
  if scenario.status == "archived":
    raise SimulationError("cannot modify archived scenario")
  inp = await repository.get_scenario_input(db, input_id)
  if not inp or inp.scenario_id != scenario.id:
    raise SimulationError("input not found")
  await repository.delete_scenario_input(db, inp)
  await db.commit()

async def trigger_simulation_run(db: AsyncSession, scenario_id: uuid.UUID, triggered_by: uuid.UUID) -> SimulationRun:
  scenario = await repository.get_scenario(db, scenario_id)
  if not scenario:
    raise SimulationError("scenario is not present")
  if not scenario.inputs:
    raise SimulationError("scenario has no inputs, add parameters before running")

  run = await repository.create_run(db, scenario_id=scenario_id, triggered_by=triggered_by)
  await db.commit()
  await db.refresh(run)

  try:
    await repository.update_run_status(db, run, "running")
    await db.commit()

    engine = RuleEngine(db)
    results = await engine.run(scenario_id, run.id)

    for res in results:
      db.add(res)
    await db.flush()

    await repository.update_run_status(db, run, "completed")
    await db.commit()
    await db.refresh(run)

  except Exception as exc:
    await repository.update_run_status(db, run, "failed", error_message=str(exc))
    await db.commit()
    await db.refresh(run)
    raise SimulationError(f"process failed: {exc}") from exc

  return run

async def get_run_detail(db: AsyncSession, run_id: uuid.UUID) -> SimulationRun | None:
  return await repository.get_run(db, run_id)

async def create_comparison(db: AsyncSession, baseline_run_id: uuid.UUID, comparison_run_id: uuid.UUID, title: str, created_by: uuid.UUID) -> "ScenarioComparison":
  if baseline_run_id == comparison_run_id:
    raise SimulationError("baseline and comparison runs must be different")

  baseline = await repository.get_run(db, baseline_run_id)
  comparison = await repository.get_run(db, comparison_run_id)
  if not baseline or not comparison:
    raise SimulationError("one or both runs not found")
  if baseline.status != "completed" or comparison.status != "completed":
    raise SimulationError("both runs must be completed before comparison")

  diff_items = []
  baseline_by_indicator: dict[uuid.UUID, SimulationResult] = {r.indicator_id: r for r in baseline.results}
  comparison_by_indicator: dict[uuid.UUID, SimulationResult] = {r.indicator_id: r for r in comparison.results}

  all_indicator_ids = set(baseline_by_indicator.keys()) | set(comparison_by_indicator.keys())
  for iid in all_indicator_ids:
    b = baseline_by_indicator.get(iid)
    c = comparison_by_indicator.get(iid)
    if b and c:
      diff = c.simulated_value - b.simulated_value
      pct_diff = (diff / b.simulated_value * 100).quantize(Decimal("0.01")) if b.simulated_value != 0 else Decimal("0")
      diff_items.append({"indicator_id": str(iid), "baseline_value": str(b.simulated_value), "comparison_value": str(c.simulated_value),
        "absolute_diff": str(diff), "percent_diff": str(pct_diff),
      })

  comp = await repository.create_comparison(db,
    title=title,
    baseline_run_id=baseline_run_id,
    comparison_run_id=comparison_run_id,
    diff_summary={"items": diff_items},
    created_by=created_by,
  )
  await db.commit()
  await db.refresh(comp)
  return comp

async def get_comparison_detail(db: AsyncSession, comparison_id: uuid.UUID) -> Optional["ScenarioComparison"]:
    return await repository.get_comparison(db, comparison_id)

async def build_chart_rows(db: AsyncSession, run_id: uuid.UUID) -> list[SimulationResultChartRow]:
  run = await repository.get_run(db, run_id)
  if not run:
    return []

  rows: list[SimulationResultChartRow] = []
  for res in run.results:
    ind = res.indicator
    if not ind:
      continue
    change = res.percent_change
    is_good = (ind.is_higher_better and change > 0) or (not ind.is_higher_better and change < 0)
    color = "#22c55e" if is_good else "#ef4444"
    rows.append(SimulationResultChartRow(indicator_name=ind.name, indicator_code=ind.code, category=ind.category, unit=ind.unit,
      baseline=res.baseline_value, simulated=res.simulated_value, change_pct=res.percent_change, color=color,
    ))
  return rows