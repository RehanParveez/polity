from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.sessions.models import SavedSession, SessionShare
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def list_sessions(db: AsyncSession, owner_id: uuid.UUID | None = None, visibility: str | None = None) -> list[SavedSession]:
  stmt = select(SavedSession).order_by(SavedSession.updated_at.desc())
  if owner_id:
    stmt = stmt.where(SavedSession.owner_id == owner_id)
  if visibility:
    stmt = stmt.where(SavedSession.visibility == visibility)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_session(db: AsyncSession, session_id: uuid.UUID) -> SavedSession | None:
  stmt = (
    select(SavedSession)
    .options(selectinload(SavedSession.shares).selectinload(SessionShare.shared_user))
    .where(SavedSession.id == session_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_session(db: AsyncSession, **kwargs) -> SavedSession:
  sess = SavedSession(**kwargs)
  db.add(sess)
  await db.flush()
  return sess

async def update_session(db: AsyncSession, sess: SavedSession, **kwargs) -> None:
  for key, value in kwargs.items():
    if value is not None and hasattr(sess, key):
      setattr(sess, key, value)
  await db.flush()

async def delete_session(db: AsyncSession, sess: SavedSession) -> None:
  await db.delete(sess)
  await db.flush()

async def add_share(db: AsyncSession, session_id: uuid.UUID, **kwargs) -> SessionShare:
  share = SessionShare(session_id=session_id, **kwargs)
  db.add(share)
  await db.flush()
  return share

async def get_share(db: AsyncSession, share_id: uuid.UUID) -> SessionShare | None:
  result = await db.execute(select(SessionShare).where(SessionShare.id == share_id))
  return result.scalar_one_or_none()

async def delete_share(db: AsyncSession, share: SessionShare) -> None:
  await db.delete(share)
  await db.flush()

async def list_shares_for_session(db: AsyncSession, session_id: uuid.UUID) -> list[SessionShare]:
  result = await db.execute(
    select(SessionShare).where(SessionShare.session_id == session_id)
  )
  return list(result.scalars().all())