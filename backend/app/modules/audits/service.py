from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.audits.schemas import AuditEventList, AuditSummaryByModule, AuditSummaryByAction
from app.modules.audits import repository
from datetime import datetime

async def query_events(
  db: AsyncSession,
  *,
  entity_type: str | None = None,
  entity_id: uuid.UUID | None = None,
  action: str | None = None,
  actor_id: uuid.UUID | None = None,
  module: str | None = None,
  start_date: datetime | None = None,
  end_date: datetime | None = None,
  limit: int = 100,
  offset: int = 0,
) -> AuditEventList:
  events, total = await repository.list_audit_events(
    db,
    entity_type=entity_type,
    entity_id=entity_id,
    action=action,
    actor_id=actor_id,
    module=module,
    start_date=start_date,
    end_date=end_date,
    limit=limit,
    offset=offset,
  )
  return AuditEventList(data=events, total=total, limit=limit, offset=offset)

async def get_event_detail(db: AsyncSession, event_id: uuid.UUID):
  return await repository.get_audit_event(db, event_id)

async def get_summary_by_module(db: AsyncSession, start_date: datetime | None = None, end_date: datetime | None = None) -> list[AuditSummaryByModule]:
  from sqlalchemy import select, func
  from app.modules.audits.models import AuditEvent
  stmt = (
    select(AuditEvent.module, func.count(AuditEvent.id))
    .group_by(AuditEvent.module)
    .order_by(func.count(AuditEvent.id).desc())
  )
  if start_date:
    stmt = stmt.where(AuditEvent.created_at >= start_date)
  if end_date:
    stmt = stmt.where(AuditEvent.created_at <= end_date)
  result = await db.execute(stmt)
  return [AuditSummaryByModule(module=row[0], event_count=row[1]) for row in result.all()]


async def get_summary_by_action(db: AsyncSession, start_date: datetime | None = None, end_date: datetime | None = None) -> list[AuditSummaryByAction]:
  from sqlalchemy import select, func
  from app.modules.audits.models import AuditEvent
  stmt = (
    select(AuditEvent.action, func.count(AuditEvent.id))
    .group_by(AuditEvent.action)
    .order_by(func.count(AuditEvent.id).desc())
  )
  if start_date:
    stmt = stmt.where(AuditEvent.created_at >= start_date)
  if end_date:
    stmt = stmt.where(AuditEvent.created_at <= end_date)
  result = await db.execute(stmt)
  return [AuditSummaryByAction(action=row[0], event_count=row[1]) for row in result.all()]