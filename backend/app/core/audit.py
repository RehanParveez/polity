from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.audits.repository import create_audit_event
from typing import Callable, Any
import functools

class AuditService:
  @staticmethod
  async def log(
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
  ) -> None:
    await create_audit_event(db,
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
    await db.flush()

def audit_action(action: str, entity_type: str, *, module: str | None = None, entity_id_attr: str = "id"):
  """
  Service-layer decorator that captures before/after state automatically.

  Requirements for the decorated function:
    - First positional arg must be db: AsyncSession
    - Second positional arg must be the entity object being modified
    - Must have a keyword arg named 'actor_id' or 'updated_by' or 'created_by' or 'user_id' or 'current_user_id'

  The decorator:
    1. Reads the entity's current __dict__ (excluding SQLAlchemy internals) as before_state
    2. Calls the original function
    3. Refreshes the entity from DB
    4. Reads the new __dict__ as after_state
    5. Writes an AuditEvent row
    6. Commits (the caller still controls the outer commit)
  """
  def decorator(func: Callable) -> Callable:
    @functools.wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
      if len(args) < 2:
        return await func(*args, **kwargs)
      db: AsyncSession = args[0]
      entity = args[1]
      actor_id = None
      for key in ("actor_id", "updated_by", "created_by", "user_id", "current_user_id", "triggered_by"):
        if key in kwargs and kwargs[key] is not None:
          val = kwargs[key]
          actor_id = val.id if hasattr(val, "id") else val
          break
      before = {}
      if hasattr(entity, "__dict__") and action in ("update", "delete"):
        before = {k: _serialize(v) for k, v in entity.__dict__.items() if not k.startswith("_")}

      result = await func(*args, **kwargs)
      after = {}
      entity_id_val = None
      if hasattr(entity, entity_id_attr):
        entity_id_val = getattr(entity, entity_id_attr)
        try:
          await db.refresh(entity)
          after = {k: _serialize(v) for k, v in entity.__dict__.items() if not k.startswith("_")}
        except Exception:
          pass

      if action == "create" and not entity_id_val and result and hasattr(result, entity_id_attr):
        entity = result
        entity_id_val = getattr(result, entity_id_attr)
        after = {k: _serialize(v) for k, v in entity.__dict__.items() if not k.startswith("_")}

      if entity_id_val:
        await create_audit_event(db,
          entity_type=entity_type,
          entity_id=entity_id_val,
          action=action,
          actor_id=actor_id,
          before_state=before if before else None,
          after_state=after if after else None,
          module=module,
        )
        await db.flush()

      return result
    return wrapper
  return decorator

def _serialize(value: Any) -> Any:
  if isinstance(value, uuid.UUID):
    return str(value)
  if hasattr(value, "isoformat"):
    return value.isoformat()
  if isinstance(value, (list, dict, str, int, float, bool, type(None))):
    return value
  return str(value)

def attach_session_listener():
  from sqlalchemy import event
  from sqlalchemy.orm import Session
  from app.modules.audits.models import AuditEvent

  @event.listens_for(Session, "before_flush")
  def _before_flush(session, flush_context, instances):
    if not hasattr(session, "_pending_audit_events"):
      session._pending_audit_events = []

    for obj in session.new:
      if hasattr(obj, "__tablename__") and obj.__tablename__ != "audit_events":
        state = {c.name: _serialize(getattr(obj, c.name)) for c in obj.__table__.columns}
        session._pending_audit_events.append({
          "entity_type": obj.__tablename__,
          "entity_id": getattr(obj, "id", None),
          "action": "create",
          "after_state": state,
          "module": obj.__tablename__,
        })

    for obj in session.dirty:
      if hasattr(obj, "__tablename__") and obj.__tablename__ != "audit_events":
        state = session.object_state(obj)
        if state.has_changes:
          before = {c.name: _serialize(getattr(obj, c.name)) for c in obj.__table__.columns}
          session._pending_audit_events.append({
            "entity_type": obj.__tablename__,
            "entity_id": getattr(obj, "id", None),
            "action": "update",
            "before_state": before,
            "module": obj.__tablename__,
          })

    for obj in session.deleted:
      if hasattr(obj, "__tablename__") and obj.__tablename__ != "audit_events":
        before = {c.name: _serialize(getattr(obj, c.name)) for c in obj.__table__.columns}
        session._pending_audit_events.append({
          "entity_type": obj.__tablename__,
          "entity_id": getattr(obj, "id", None),
          "action": "delete",
          "before_state": before,
          "module": obj.__tablename__,
        })

  @event.listens_for(Session, "after_flush")
  def _after_flush(session, flush_context):
    if hasattr(session, "_pending_audit_events"):
      for evt in session._pending_audit_events:
        if evt.get("entity_id"):
          audit = AuditEvent(**evt)
          session.add(audit)
      session._pending_audit_events = []