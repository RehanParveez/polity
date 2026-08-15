from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.shared.dependencies import get_current_user, require_permission
from app.modules.audits.schemas import AuditEventList, AuditEventRead, AuditSummaryByModule, AuditSummaryByAction
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.identity.models import User
from app.core.database import get_db
from app.modules.audits import service

router = APIRouter(prefix="/audit", tags=["audit"], dependencies=[Depends(get_current_user)])

@router.get("/events", response_model=AuditEventList)
async def list_events_endpoint(
  entity_type: str | None = None,
  entity_id: uuid.UUID | None = None,
  action: str | None = None,
  actor_id: uuid.UUID | None = None,
  module: str | None = None,
  start_date: datetime | None = None,
  end_date: datetime | None = None,
  limit: int = Query(default=100, ge=1, le=500),
  offset: int = Query(default=0, ge=0),
  current_user: User = Depends(require_permission("audit.read")),
  db: AsyncSession = Depends(get_db),
):
  return await service.query_events(
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

@router.get("/events/{event_id}", response_model=AuditEventRead)
async def get_event_endpoint(
  event_id: uuid.UUID,
  current_user: User = Depends(require_permission("audit.read")),
  db: AsyncSession = Depends(get_db),
):
  evt = await service.get_event_detail(db, event_id)
  if not evt:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "audit event is not present")
  return evt

@router.get("/summary/modules", response_model=list[AuditSummaryByModule])
async def summary_by_module_endpoint(
  start_date: datetime | None = None,
  end_date: datetime | None = None,
  current_user: User = Depends(require_permission("audit.read")),
  db: AsyncSession = Depends(get_db),
):
  return await service.get_summary_by_module(db, start_date, end_date)

@router.get("/summary/actions", response_model=list[AuditSummaryByAction])
async def summary_by_action_endpoint(
  start_date: datetime | None = None,
  end_date: datetime | None = None,
  current_user: User = Depends(require_permission("audit.read")),
  db: AsyncSession = Depends(get_db),
):
  return await service.get_summary_by_action(db, start_date, end_date)