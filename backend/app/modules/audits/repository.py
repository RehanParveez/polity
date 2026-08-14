from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.audits.models import AuditEvent
from datetime import datetime
from sqlalchemy import select, func

async def create_audit_event(
  db: AsyncSession,
  *,
  entity_type: str,
  entity_id: uuid.UUID,
  action: str,
  actor_id: uuid.UUID | None = None,
  actor_name: str | None = None,
  before_state: dict | None = None,
  after_state: dict | None = None,
  metadata: dict | None = None,
  module: str | None = None,
) -> AuditEvent:
  evt = AuditEvent(
    entity_type=entity_type,
    entity_id=entity_id,
    action=action,
    actor_id=actor_id,
    actor_name=actor_name,
    before_state=before_state,
    after_state=after_state,
    metadata=metadata or {},
    module=module,
  )
  db.add(evt)
  await db.flush()
  return evt

async def list_audit_events(
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
) -> tuple[list[AuditEvent], int]:
  stmt = select(AuditEvent).order_by(AuditEvent.created_at.desc())
  count_stmt = select(func.count(AuditEvent.id))

  if entity_type:
    stmt = stmt.where(AuditEvent.entity_type == entity_type)
    count_stmt = count_stmt.where(AuditEvent.entity_type == entity_type)
  if entity_id:
    stmt = stmt.where(AuditEvent.entity_id == entity_id)
    count_stmt = count_stmt.where(AuditEvent.entity_id == entity_id)
  if action:
    stmt = stmt.where(AuditEvent.action == action)
    count_stmt = count_stmt.where(AuditEvent.action == action)
  if actor_id:
    stmt = stmt.where(AuditEvent.actor_id == actor_id)
    count_stmt = count_stmt.where(AuditEvent.actor_id == actor_id)
  if module:
    stmt = stmt.where(AuditEvent.module == module)
    count_stmt = count_stmt.where(AuditEvent.module == module)
  if start_date:
    stmt = stmt.where(AuditEvent.created_at >= start_date)
    count_stmt = count_stmt.where(AuditEvent.created_at >= start_date)
  if end_date:
    stmt = stmt.where(AuditEvent.created_at <= end_date)
    count_stmt = count_stmt.where(AuditEvent.created_at <= end_date)

  total = (await db.execute(count_stmt)).scalar_one()
  result = await db.execute(stmt.offset(offset).limit(limit))
  return list(result.scalars().all()), total

async def get_audit_event(db: AsyncSession, event_id: uuid.UUID) -> AuditEvent | None:
  result = await db.execute(select(AuditEvent).where(AuditEvent.id == event_id))
  return result.scalar_one_or_none()