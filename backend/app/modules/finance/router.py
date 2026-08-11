from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
from app.modules.finance.schemas import FinanceSummary, AuditFindingRead, BudgetCreate, BudgetLineCreate, BudgetLineRead, BudgetRead, ProcurementCreate, ProcurementRead, RevenueSourceRead
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.finance import service, repository
import uuid

router = APIRouter(prefix="/finance", tags=["finance"], dependencies=[Depends(get_current_user)])

@router.get("/summary", response_model=FinanceSummary)
async def finance_summary(db: AsyncSession = Depends(get_db)):
  data = await service.get_summary(db)
  return FinanceSummary(**data)

@router.get("/revenue", response_model=list[RevenueSourceRead])
async def list_revenue(fiscal_year: int | None = None, db: AsyncSession = Depends(get_db)):
  return await repository.list_revenue_sources(db, fiscal_year)

@router.get("/budgets", response_model=list[BudgetRead])
async def list_budgets(db: AsyncSession = Depends(get_db)):
  budgets = await repository.list_budgets(db)
  return [service._enrich_budget(b) for b in budgets]

@router.post("/budgets", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
async def create_budget_endpoint(
  payload: BudgetCreate,
  _: object = Depends(require_permission("finance.manage")),
  db: AsyncSession = Depends(get_db),
):
  return await service.create_budget(db, payload)

@router.get("/budgets/{budget_id}", response_model=BudgetRead)
async def get_budget_endpoint(budget_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  try:
    return await service.get_budget_detail(db, budget_id)
  except service.FinanceError as exc:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

@router.post("/budgets/{budget_id}/lines", response_model=BudgetLineRead, status_code=status.HTTP_201_CREATED)
async def add_line_endpoint(
  budget_id: uuid.UUID,
  payload: BudgetLineCreate,
  _: object = Depends(require_permission("finance.manage")),
  db: AsyncSession = Depends(get_db),
):
  try:
    return await service.add_budget_line(db, budget_id, payload)
  except service.FinanceError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.delete("/budgets/{budget_id}/lines/{line_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_line_endpoint(
  budget_id: uuid.UUID,
  line_id: uuid.UUID,
  _: object = Depends(require_permission("finance.manage")),
  db: AsyncSession = Depends(get_db),
):
  try:
    await service.remove_budget_line(db, line_id)
  except service.FinanceError as exc:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

@router.get("/procurement", response_model=list[ProcurementRead])
async def list_procurement(db: AsyncSession = Depends(get_db)):
  projects = await repository.list_procurement(db)
  return [
    ProcurementRead(
      id=p.id,
      ministry_id=p.ministry_id,
      ministry_name=p.ministry.name if p.ministry else None,
      title=p.title,
      description=p.description,
      budget_estimate=p.budget_estimate,
      status=p.status,
      vendor_name=p.vendor_name,
    )
    for p in projects
  ]

@router.post("/procurement", response_model=ProcurementRead, status_code=status.HTTP_201_CREATED)
async def create_procurement_endpoint(
  payload: ProcurementCreate,
  _: object = Depends(require_permission("finance.manage")),
  db: AsyncSession = Depends(get_db),
):
  proj = await service.create_procurement(db, payload)
  return ProcurementRead(
    id=proj.id,
    ministry_id=proj.ministry_id,
    ministry_name=proj.ministry.name if proj.ministry else None,
    title=proj.title,
    description=proj.description,
    budget_estimate=proj.budget_estimate,
    status=proj.status,
    vendor_name=proj.vendor_name,
  )

@router.get("/audit", response_model=list[AuditFindingRead])
async def list_audits(db: AsyncSession = Depends(get_db)):
  return await repository.list_audit_findings(db)