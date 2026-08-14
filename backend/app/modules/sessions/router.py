from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy import select
from app.modules.institutions.models import InstitutionMembership
from app.modules.sessions.schemas import (SavedSessionCreate, SavedSessionDetailRead, SavedSessionListRead, SavedSessionUpdate, SessionShareCreate, SessionShareRead,
  SessionResumeResponse, SessionRerunResponse,
)
from app.core.database import get_db
from app.modules.sessions import repository, service
from app.modules.identity.models import User
from app.modules.sessions.permissions import SESSION_CREATE, SESSION_SHARE

router = APIRouter(prefix="/sessions", tags=["sessions"], dependencies=[Depends(get_current_user)])

async def _user_institution_ids(db: AsyncSession, user_id: uuid.UUID) -> list[uuid.UUID]:

  result = await db.execute(
    select(InstitutionMembership.ministry_id).where(InstitutionMembership.user_id == user_id)
  )
  return [r for r in result.scalars().all() if r is not None]

@router.get("", response_model=list[SavedSessionListRead])
async def list_sessions_endpoint(
  visibility: str | None = None,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_db),
):
  own = await repository.list_sessions(db, owner_id=current_user.id, visibility=visibility)
  all_sessions = await repository.list_sessions(db, visibility=visibility)
  institution_ids = await _user_institution_ids(db, current_user.id)
  visible = []
  for s in all_sessions:
    if s.owner_id == current_user.id:
      continue
    if service._can_view(s, current_user.id, institution_ids):
      visible.append(s)
  return own + visible

@router.post("", response_model=SavedSessionDetailRead, status_code=status.HTTP_201_CREATED)
async def create_session_endpoint(
  payload: SavedSessionCreate,
  current_user: User = Depends(require_permission(SESSION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  return await service.create_session(db, payload, current_user.id)

@router.get("/{session_id}", response_model=SavedSessionDetailRead)
async def get_session_endpoint(
  session_id: uuid.UUID,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  institution_ids = await _user_institution_ids(db, current_user.id)
  if not service._can_view(sess, current_user.id, institution_ids):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "access denied")
  return sess

@router.patch("/{session_id}", response_model=SavedSessionDetailRead)
async def update_session_endpoint(
  session_id: uuid.UUID,
  payload: SavedSessionUpdate,
  current_user: User = Depends(require_permission(SESSION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  if sess.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "only the owner can update")
  try:
    return await service.update_session(db, sess, payload)
  except service.SessionError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session_endpoint(
  session_id: uuid.UUID,
  current_user: User = Depends(require_permission(SESSION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "session is not present")
  if sess.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "only the owner can delete")
  await service.delete_session(db, sess)

@router.post("/{session_id}/duplicate", response_model=SavedSessionDetailRead, status_code=status.HTTP_201_CREATED)
async def duplicate_session_endpoint(
  session_id: uuid.UUID,
  current_user: User = Depends(require_permission(SESSION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  institution_ids = await _user_institution_ids(db, current_user.id)
  if not service._can_view(sess, current_user.id, institution_ids):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "access denied")
  return await service.duplicate_session(db, sess, current_user.id)

@router.post("/{session_id}/resume", response_model=SessionResumeResponse)
async def resume_session_endpoint(
  session_id: uuid.UUID,
  current_user: User = Depends(get_current_user),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  institution_ids = await _user_institution_ids(db, current_user.id)
  if not service._can_view(sess, current_user.id, institution_ids):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "access denied")
  resumed = await service.resume_session(db, sess)
  return SessionResumeResponse(
    session=resumed,
    message = "Session resumed from snapshot. No re-computation needed.",
  )

@router.post("/{session_id}/rerun", response_model=SessionRerunResponse)
async def rerun_session_endpoint(
  session_id: uuid.UUID,
  current_user: User = Depends(require_permission(SESSION_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  if sess.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "only the owner can re-run")
  try:
    new_run_id = await service.rerun_session(db, sess, current_user.id)
    return SessionRerunResponse(new_run_id=new_run_id, message = "Simulation re-run completed. Snapshot updated with latest results.")
  except service.SessionError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/{session_id}/shares", response_model=SessionShareRead, status_code=status.HTTP_201_CREATED)
async def share_session_endpoint(
  session_id: uuid.UUID,
  payload: SessionShareCreate,
  current_user: User = Depends(require_permission(SESSION_SHARE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "session not found")
  if sess.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "only the owner can share")
  try:
    return await service.share_session(db, sess, payload)
  except service.SessionError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.delete("/{session_id}/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_share_endpoint(
  session_id: uuid.UUID,
  share_id: uuid.UUID,
  current_user: User = Depends(require_permission(SESSION_SHARE)),
  db: AsyncSession = Depends(get_db),
):
  sess = await service.get_session_detail(db, session_id)
  if not sess:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the session is not present")
  if sess.owner_id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "only the owner can manage shares")
  share = await repository.get_share(db, share_id)
  if not share or share.session_id != session_id:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the share is not present")
  await service.remove_share(db, share)