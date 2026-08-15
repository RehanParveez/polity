from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.audits.repository import create_audit_event
from typing import Callable, Any
import functools
import inspect

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
    event_metadata: dict | None = None,
    module: str | None = None,
  ) -> None:

    await create_audit_event(
      db,
      entity_type=entity_type,
      entity_id=entity_id,
      action=action,
      actor_id=actor_id,
      actor_name=actor_name,
      before_state=before_state,
      after_state=after_state,
      event_metadata=event_metadata or {},
      module=module,
    )

def audit_action(action: str, entity_type: str, *, module: str | None = None, entity_id_attr: str = "id"):
  """
  Service-layer audit decorator.

  The decorated service must have AsyncSession as its first argument.

  The decorator supports service functions where:
    - an existing ORM entity is passed as the second argument
    - the created entity is returned by the service
    - the entity ID is available on the returned object

  Actor information can be supplied through:
    actor_id
    updated_by
    created_by
    user_id
    current_user_id
    triggered_by
    owner_id
  """

  def decorator(func: Callable) -> Callable:

    @functools.wraps(func)
    async def wrapper(*args, **kwargs) -> Any:

      if not args:
        return await func(*args, **kwargs)
      db = args[0]
      if not isinstance(db, AsyncSession):
        return await func(*args, **kwargs)
      actor_id = None
      actor_name = None

      actor_keys = (
        "actor_id",
        "updated_by",
        "created_by",
        "user_id",
        "current_user_id",
        "triggered_by",
        "owner_id",
      )

      signature = inspect.signature(func)
      bound = signature.bind_partial(*args, **kwargs)

      signature = inspect.signature(func)
      bound = signature.bind_partial(*args, **kwargs)

      for key in actor_keys:
        actor = bound.arguments.get(key)
        if actor is None:
          continue
        if hasattr(actor, "id"):
          actor_id = actor.id
          actor_name = (
            getattr(actor, "full_name", None)
            or getattr(actor, "name", None)
          )
        else:
          actor_id = actor

        break
      entity = None

      if len(args) >= 2:
        candidate = args[1]
        if hasattr(candidate, "__table__"):
          entity = candidate
      before_state = None

      if entity is not None and action in {
        "update",
        "delete",
        "transition",
        "approve",
        "reject",
        "publish",
        "archive",
      }:
        before_state = serialize_model(entity)

      result = await func(*args, **kwargs)
      result_entity = None
      if hasattr(result, "__table__"):
        result_entity = result
      if result_entity is not None:
        entity = result_entity
      entity_id = None

      if entity is not None and hasattr(entity, entity_id_attr):
        entity_id = getattr(entity, entity_id_attr)
      after_state = None
      if entity is not None and action != "delete":
        after_state = serialize_model(entity)
      if entity_id is not None:

        await AuditService.log(db, entity_type=entity_type, entity_id=entity_id, action=action, actor_id=actor_id,
          actor_name=actor_name, before_state=before_state, after_state=after_state, module=module,
        )

      return result

    return wrapper

  return decorator

def serialize_model(entity: Any) -> dict:
  """
  Serialize only SQLAlchemy column values.

  This intentionally avoids serializing relationships,
  internal SQLAlchemy state, methods, etc.
  """

  if not hasattr(entity, "__table__"):
    return {}
  result = {}
  for column in entity.__table__.columns:
    value = getattr(entity, column.name, None)
    result[column.name] = _serialize(value)

  return result

def _serialize(value: Any) -> Any:
  if isinstance(value, uuid.UUID):
    return str(value)
  if isinstance(value, dict):
    return {
      str(key): _serialize(item)
      for key, item in value.items()
    }
  if isinstance(value, (list, tuple)):
    return [_serialize(item) for item in value]
  if isinstance(value, (str, int, float, bool)) or value is None:
    return value
  if hasattr(value, "isoformat"):
    return value.isoformat()

  return str(value)