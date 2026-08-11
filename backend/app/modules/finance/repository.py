from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.finance.models import RevenueSource, AuditFinding, Budget, BudgetLine, ProcurementProject
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import uuid
from decimal import Decimal

async def list_revenue_sources(db: AsyncSession, fiscal_year: int | None) -> list[RevenueSource]:
  stmt = select(RevenueSource).order_by(RevenueSource.amount.desc())
  if fiscal_year:
    stmt = stmt.where(RevenueSource.fiscal_year == fiscal_year)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_budgets(db: AsyncSession) -> list[Budget]:
  stmt = select(Budget).options(selectinload(Budget.lines), selectinload(Budget.ministry)).order_by(Budget.fiscal_year.desc())
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_budget(db: AsyncSession, budget_id: uuid.UUID) -> Budget | None:
  stmt = (
    select(Budget)
    .options(selectinload(Budget.lines), selectinload(Budget.ministry))
    .where(Budget.id == budget_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_budget(db: AsyncSession, **kwargs) -> Budget:
  budget = Budget(**kwargs)
  db.add(budget)
  await db.flush()
  return budget

async def add_budget_line(db: AsyncSession, budget_id: uuid.UUID, **kwargs) -> BudgetLine:
  line = BudgetLine(budget_id=budget_id, **kwargs)
  db.add(line)
  await db.flush()
  return line

async def delete_budget_line(db: AsyncSession, line: BudgetLine) -> None:
  await db.delete(line)
  await db.flush()

async def get_budget_line(db: AsyncSession, line_id: uuid.UUID) -> BudgetLine | None:
  result = await db.execute(select(BudgetLine).where(BudgetLine.id == line_id))
  return result.scalar_one_or_none()

async def list_procurement(db: AsyncSession) -> list[ProcurementProject]:
  stmt = select(ProcurementProject).options(selectinload(ProcurementProject.ministry)).order_by(ProcurementProject.status)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def create_procurement(db: AsyncSession, **kwargs) -> ProcurementProject:
  proj = ProcurementProject(**kwargs)
  db.add(proj)
  await db.flush()
  return proj

async def list_audit_findings(db: AsyncSession) -> list[AuditFinding]:
  result = await db.execute(select(AuditFinding).order_by(AuditFinding.created_at.desc()))
  return list(result.scalars().all())

async def get_finance_summary(db: AsyncSession) -> dict:
  revenue = await db.execute(select(func.coalesce(func.sum(RevenueSource.amount), Decimal("0.00"))))
  total_revenue = revenue.scalar_one()

  budget = await db.execute(select(func.coalesce(func.sum(Budget.total_amount), Decimal("0.00"))))
  total_budget = budget.scalar_one()

  procurement = await db.execute(select(func.coalesce(func.sum(ProcurementProject.budget_estimate), Decimal("0.00"))))
  total_procurement = procurement.scalar_one()

  audits = await db.execute(select(func.count(AuditFinding.id)).where(AuditFinding.status == "open"))
  open_audits = audits.scalar_one()

  return {"total_revenue": total_revenue, "total_budget": total_budget, "total_procurement": total_procurement,
    "open_audits": open_audits,
  }