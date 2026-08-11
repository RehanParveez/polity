from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.finance.schemas import BudgetCreate, BudgetLineCreate, ProcurementCreate
from app.modules.finance import repository
import uuid
from app.modules.finance.schemas import BudgetRead

class FinanceError(Exception):
  pass

async def create_budget(db: AsyncSession, payload: BudgetCreate):
  data = payload.model_dump(exclude_unset=True)
  budget = await repository.create_budget(db, **data)
  await db.commit()
  await db.refresh(budget)
  return _enrich_budget(budget)

async def get_budget_detail(db: AsyncSession, budget_id: uuid.UUID):
  budget = await repository.get_budget(db, budget_id)
  if not budget:
    raise FinanceError("budget is not present")
  return _enrich_budget(budget)

async def add_budget_line(db: AsyncSession, budget_id: uuid.UUID, payload: BudgetLineCreate):
  budget = await repository.get_budget(db, budget_id)
  if not budget:
    raise FinanceError("budget is not present")

  current_allocated = sum(line.allocated_amount for line in budget.lines)
  if current_allocated + payload.allocated_amount > budget.total_amount:
    raise FinanceError("allocation exceeds budget total")

  data = payload.model_dump(exclude_unset=True)
  line = await repository.add_budget_line(db, budget_id, **data)
  await db.commit()
  await db.refresh(line)
  return line

async def remove_budget_line(db: AsyncSession, line_id: uuid.UUID):
  line = await repository.get_budget_line(db, line_id)
  if not line:
    raise FinanceError("budget line is not present")
  await repository.delete_budget_line(db, line)
  await db.commit()

async def create_procurement(db: AsyncSession, payload: ProcurementCreate):
  data = payload.model_dump(exclude_unset=True)
  proj = await repository.create_procurement(db, **data)
  await db.commit()
  await db.refresh(proj)
  return proj

async def get_summary(db: AsyncSession):
  return await repository.get_finance_summary(db)

def _enrich_budget(budget):
  
  total_allocated = sum(line.allocated_amount for line in budget.lines)
  total_spent = sum(line.spent_amount for line in budget.lines)
  remaining = budget.total_amount - total_allocated

  return BudgetRead(id=budget.id, ministry_id=budget.ministry_id, ministry_name=budget.ministry.name if budget.ministry else None,
    government_id=budget.government_id, fiscal_year=budget.fiscal_year, total_amount=budget.total_amount, status=budget.status,
    description=budget.description, total_allocated=total_allocated, total_spent=total_spent, remaining=remaining,
    lines=budget.lines,
  )