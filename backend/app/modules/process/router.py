from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
from app.modules.process.schemas import ( IndicatorRead, IndicatorCreate, IndicatorValueCreate, IndicatorValueRead, SimulationRuleCreate, SimulationRuleRead,
   ScenarioCreate, ScenarioDetailRead, ScenarioListRead, ScenarioUpdate, ScenarioInputCreate, ScenarioInputRead, SimulationRunRead,
  ScenarioComparisonCreate, ScenarioComparisonDetailRead, ScenarioComparisonRead, SimulationResultChartRow,
 )
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.process import repository, service
from app.modules.process.permissions import SIMULATION_MANAGE, SIMULATION_CREATE, SIMULATION_RUN,  SIMULATION_COMPARE
import uuid
from app.modules.identity.models import User
from decimal import Decimal

router = APIRouter(prefix="/simulations", tags=["simulations"], dependencies=[Depends(get_current_user)])

@router.get("/indicators", response_model=list[IndicatorRead])
async def list_indicators_endpoint(
  category: str | None = None,
  db: AsyncSession = Depends(get_db),
):
  return await repository.list_indicators(db, category=category)

@router.post("/indicators", response_model=IndicatorRead, status_code=status.HTTP_201_CREATED)
async def create_indicator_endpoint(payload: IndicatorCreate, current_user: User = Depends(require_permission(SIMULATION_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  return await repository.create_indicator(db, **payload.model_dump(exclude_unset=True))

@router.get("/indicators/{indicator_id}/values", response_model=list[IndicatorValueRead])
async def list_indicator_values_endpoint(
  indicator_id: uuid.UUID,
  district_id: uuid.UUID | None = None,
  db: AsyncSession = Depends(get_db),
):
  return await repository.list_indicator_values(db, indicator_id=indicator_id, district_id=district_id)

@router.post("/indicators/{indicator_id}/values", response_model=IndicatorValueRead, status_code=status.HTTP_201_CREATED)
async def create_indicator_value_endpoint(
  indicator_id: uuid.UUID,
  payload: IndicatorValueCreate,
  current_user: User = Depends(require_permission(SIMULATION_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  data = payload.model_dump(exclude_unset=True)
  data["indicator_id"] = indicator_id
  return await repository.create_indicator_value(db, **data)

@router.get("/rules", response_model=list[SimulationRuleRead])
async def list_rules_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_active_rules(db)

@router.post("/rules", response_model=SimulationRuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule_endpoint(
  payload: SimulationRuleCreate,
  current_user: User = Depends(require_permission(SIMULATION_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  return await repository.create_rule(db, **payload.model_dump(exclude_unset=True))

@router.get("/scenarios", response_model=list[ScenarioListRead])
async def list_scenarios_endpoint(
  status: str | None = None,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_db),
):
  return await repository.list_scenarios(db, owner_id=current_user.id, status=status)

@router.post("/scenarios", response_model=ScenarioDetailRead, status_code=status.HTTP_201_CREATED)
async def create_scenario_endpoint(
  payload: ScenarioCreate,
  current_user: User = Depends(require_permission(SIMULATION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  return await service.create_scenario(db, payload, current_user.id)

@router.get("/scenarios/{scenario_id}", response_model=ScenarioDetailRead)
async def get_scenario_endpoint(scenario_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  scenario = await service.get_scenario_detail(db, scenario_id)
  if not scenario:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "scenario is not present")
  return scenario

@router.patch("/scenarios/{scenario_id}", response_model=ScenarioDetailRead)
async def update_scenario_endpoint(
  scenario_id: uuid.UUID,
  payload: ScenarioUpdate,
  current_user: User = Depends(require_permission(SIMULATION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  scenario = await service.get_scenario_detail(db, scenario_id)
  if not scenario:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "scenario is not present")
  if scenario.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "not your scenario")
  try:
    return await service.update_scenario(db, scenario, payload, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario_endpoint(
  scenario_id: uuid.UUID,
  current_user: User = Depends(require_permission(SIMULATION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  scenario = await service.get_scenario_detail(db, scenario_id)
  if not scenario:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "scenario is not present")
  if scenario.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "not your scenario")
  try:
    await service.delete_scenario(db, scenario, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/scenarios/{scenario_id}/inputs", response_model=ScenarioInputRead, status_code=status.HTTP_201_CREATED)
async def add_scenario_input_endpoint(
  scenario_id: uuid.UUID,
  payload: ScenarioInputCreate,
  current_user: User = Depends(require_permission(SIMULATION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  scenario = await service.get_scenario_detail(db, scenario_id)
  if not scenario:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "scenario is not present")
  if scenario.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "not your scenario")
  try:
    return await service.add_input(db, scenario, payload, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.delete("/scenarios/{scenario_id}/inputs/{input_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_scenario_input_endpoint(
  scenario_id: uuid.UUID,
  input_id: uuid.UUID,
  current_user: User = Depends(require_permission(SIMULATION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  scenario = await service.get_scenario_detail(db, scenario_id)
  if not scenario:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "scenario is not present")
  if scenario.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "not your scenario")
  try:
    await service.remove_input(db, scenario, input_id, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/scenarios/{scenario_id}/run", response_model=SimulationRunRead, status_code=status.HTTP_201_CREATED)
async def trigger_run_endpoint(
  scenario_id: uuid.UUID,
  current_user: User = Depends(require_permission(SIMULATION_RUN)),
  db: AsyncSession = Depends(get_db),
):
  try:
    return await service.trigger_simulation_run(db, scenario_id, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.get("/runs/{run_id}", response_model=SimulationRunRead)
async def get_run_endpoint(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  run = await service.get_run_detail(db, run_id)
  if not run:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "run is not present")
  return run

@router.get("/runs/{run_id}/chart", response_model=list[SimulationResultChartRow])
async def get_run_chart_endpoint(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  return await service.build_chart_rows(db, run_id)

@router.get("/comparisons", response_model=list[ScenarioComparisonRead])
async def list_comparisons_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_comparisons(db)

@router.post("/comparisons", response_model=ScenarioComparisonRead, status_code=status.HTTP_201_CREATED)
async def create_comparison_endpoint(
  payload: ScenarioComparisonCreate,
  current_user: User = Depends(require_permission(SIMULATION_COMPARE)),
  db: AsyncSession = Depends(get_db),
):
  try:
    return await service.create_comparison(db, payload.baseline_run_id, payload.comparison_run_id, payload.title, current_user.id)
  except service.SimulationError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.get("/comparisons/{comparison_id}", response_model=ScenarioComparisonDetailRead)
async def get_comparison_endpoint(comparison_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  comp = await service.get_comparison_detail(db, comparison_id)
  if not comp:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "comparison is not present")

  from app.modules.process.schemas import ComparisonDiffItem
  diffs = []
  for item in comp.diff_summary.get("items", []):
    ind = await repository.get_indicator(db, uuid.UUID(item["indicator_id"]))
    if ind:
      diffs.append(ComparisonDiffItem(indicator_id=ind.id, indicator_name=ind.name, indicator_unit=ind.unit, baseline_value=Decimal(item["baseline_value"]),
        comparison_value=Decimal(item["comparison_value"]), absolute_diff=Decimal(item["absolute_diff"]), percent_diff=Decimal(item["percent_diff"]),
        is_higher_better=ind.is_higher_better,
      ))

  return ScenarioComparisonDetailRead(id=comp.id, title=comp.title, baseline_run_id=comp.baseline_run_id, comparison_run_id=comp.comparison_run_id,
    diff_summary=comp.diff_summary, created_at=comp.created_at, diffs=diffs,
  )