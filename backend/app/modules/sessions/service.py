from app.modules.sessions.models import SavedSession, SessionShare
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.process.repository import get_scenario
from datetime import datetime, timezone
from app.modules.sessions import repository
from app.modules.sessions.schemas import SavedSessionCreate, SavedSessionUpdate, SessionShareCreate

class SessionError(Exception):
  pass

def _is_owner(sess: SavedSession, user_id: uuid.UUID) -> bool:
  return sess.owner_id == user_id

def _can_view(sess: SavedSession, user_id: uuid.UUID, user_institution_ids: list[uuid.UUID]) -> bool:
  if _is_owner(sess, user_id):
    return True
  if sess.visibility == "shared":
    for share in sess.shares:
      if share.shared_with_user_id == user_id:
        return True
      if share.shared_with_institution_id in user_institution_ids:
        return True
  if sess.visibility == "institutional":
    for share in sess.shares:
      if share.shared_with_institution_id in user_institution_ids:
        return True
  return False

def _can_edit(sess: SavedSession, user_id: uuid.UUID, user_institution_ids: list[uuid.UUID]) -> bool:
  if _is_owner(sess, user_id):
    return True
  for share in sess.shares:
    if share.permission == "edit":
      if share.shared_with_user_id == user_id:
        return True
      if share.shared_with_institution_id in user_institution_ids:
        return True
  return False

async def create_session(
  db: AsyncSession,
  payload: SavedSessionCreate,
  owner_id: uuid.UUID,
) -> SavedSession:
  data = payload.model_dump(exclude_unset=True)
  data["owner_id"] = owner_id
  
  snapshot = {}
  if payload.scenario_id:
    scenario = await get_scenario(db, payload.scenario_id)
    if scenario:
      snapshot["scenario"] = {
        "id": str(scenario.id),
        "title": scenario.title,
        "description": scenario.description,
        "inputs": [{"rule_name": i.rule_name, "parameter_name": i.parameter_name, "parameter_value": i.parameter_value} for i in scenario.inputs],
      }
      completed_runs = [r for r in scenario.simulation_runs if r.status == "completed"]
      if completed_runs:
        latest_run = completed_runs[0]
        snapshot["run"] = {
          "id": str(latest_run.id),
          "status": latest_run.status,
          "created_at": latest_run.created_at.isoformat() if latest_run.created_at else None,
        }
        snapshot["results"] = [
          {
            "indicator_name": res.indicator.name if res.indicator else "Unknown",
            "indicator_code": res.indicator.code if res.indicator else "",
            "category": res.indicator.category if res.indicator else "",
            "unit": res.indicator.unit if res.indicator else "",
            "baseline_value": str(res.baseline_value),
            "simulated_value": str(res.simulated_value),
            "absolute_change": str(res.absolute_change),
            "percent_change": str(res.percent_change),
          }
          for res in latest_run.results
        ]
      else:
        snapshot["run"] = None
        snapshot["results"] = []
    else:
      snapshot["scenario"] = None
      snapshot["run"] = None
      snapshot["results"] = []
  else:
    snapshot["scenario"] = None
    snapshot["run"] = None
    snapshot["results"] = []

  snapshot["saved_at"] = datetime.now(timezone.utc).isoformat()
  data["snapshot"] = snapshot

  sess = await repository.create_session(db, **data)
  await db.commit()
  await db.refresh(sess)
  return sess

async def get_session_detail(db: AsyncSession, session_id: uuid.UUID) -> SavedSession | None:
  return await repository.get_session(db, session_id)

async def update_session(
  db: AsyncSession,
  sess: SavedSession,
  payload: SavedSessionUpdate,
) -> SavedSession:
  data = payload.model_dump(exclude_unset=True)
  await repository.update_session(db, sess, **data)
  await db.commit()
  await db.refresh(sess)
  return sess

async def delete_session(db: AsyncSession, sess: SavedSession) -> None:
  await repository.delete_session(db, sess)
  await db.commit()

async def duplicate_session(db: AsyncSession, sess: SavedSession, new_owner_id: uuid.UUID) -> SavedSession:
  new_data = {"owner_id": new_owner_id, "title": f"{sess.title} (Copy)", "description": sess.description,
    "scenario_id": sess.scenario_id, "snapshot": sess.snapshot, "visibility": "private",
  }
  new_sess = await repository.create_session(db, **new_data)
  await db.commit()
  await db.refresh(new_sess)
  return new_sess

async def resume_session(db: AsyncSession, sess: SavedSession) -> SavedSession:
  return sess

async def rerun_session(db: AsyncSession, sess: SavedSession, user_id: uuid.UUID) -> uuid.UUID:
  if not sess.scenario_id:
    raise SessionError("session has no linked scenario to re-run")

  from app.modules.process.service import trigger_simulation_run
  new_run = await trigger_simulation_run(db, sess.scenario_id, user_id)

  snapshot = dict(sess.snapshot) if sess.snapshot else {}
  snapshot["run"] = {
    "id": str(new_run.id),
    "status": new_run.status,
    "created_at": new_run.created_at.isoformat() if new_run.created_at else None,
  }
  snapshot["results"] = [
    {
      "indicator_name": res.indicator.name if res.indicator else "Unknown",
      "indicator_code": res.indicator.code if res.indicator else "",
      "category": res.indicator.category if res.indicator else "",
      "unit": res.indicator.unit if res.indicator else "",
      "baseline_value": str(res.baseline_value),
      "simulated_value": str(res.simulated_value),
      "absolute_change": str(res.absolute_change),
      "percent_change": str(res.percent_change),
    }
    for res in new_run.results
  ]
  snapshot["saved_at"] = datetime.now(timezone.utc).isoformat()

  await repository.update_session(db, sess, snapshot=snapshot)
  await db.commit()
  await db.refresh(sess)
  return new_run.id

async def share_session(
  db: AsyncSession,
  sess: SavedSession,
  payload: SessionShareCreate,
) -> SessionShare:
  if not payload.shared_with_user_id and not payload.shared_with_institution_id:
    raise SessionError("must specify shared_with_user_id or shared_with_institution_id")
  if payload.shared_with_user_id and payload.shared_with_institution_id:
    raise SessionError("cannot share with both a user and an institution in one share record")

  data = payload.model_dump(exclude_unset=True)
  share = await repository.add_share(db, sess.id, **data)
  await db.commit()
  await db.refresh(share)
  return share

async def remove_share(db: AsyncSession, share: SessionShare) -> None:
  await repository.delete_share(db, share)
  await db.commit()