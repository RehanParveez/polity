from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.identity.models import User, RefreshToken
from sqlalchemy import select
import uuid
from datetime import datetime

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
  result = await db.execute(select(User).where(User.email == email))
  return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
  result = await db.execute(select(User).where(User.id == user_id))
  return result.scalar_one_or_none()

async def create_user(db: AsyncSession, email: str, hashed_password: str, full_name: str) -> User:
  user = User(email=email, hashed_password=hashed_password, full_name=full_name)
  db.add(user)
  await db.flush()
  return user

async def store_refresh_token(
  db: AsyncSession, user_id: uuid.UUID, token_hash: str, expires_at: datetime
) -> RefreshToken:
  row = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
  db.add(row)
  await db.flush()
  return row

async def get_refresh_token(db: AsyncSession, token_hash: str) -> RefreshToken | None:
  result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
  return result.scalar_one_or_none()

async def revoke_refresh_token(db: AsyncSession, token_row: RefreshToken) -> None:
  token_row.revoked = True
  await db.flush()