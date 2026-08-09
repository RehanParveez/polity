from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.identity.models import User
from app.modules.identity import repository
from app.modules.identity.schemas import TokenPair
from app.core.security import hash_password, create_access_token, create_refresh_token, decode_token, hash_token, verify_password, create_password_reset_token
from datetime import datetime, timezone, timedelta
from app.modules.identity.schemas import TokenPair

class AuthError(Exception):
  pass

async def register_user(db: AsyncSession, email: str, password: str, full_name: str) -> User:
  if await repository.get_user_by_email(db, email):
    raise AuthError("email already registered")
  user = await repository.create_user(db, email, hash_password(password), full_name)
  await db.commit()
  await db.refresh(user)
  return user

async def issue_token_pair(db: AsyncSession, user: User) -> TokenPair:
  access_token = create_access_token(subject=str(user.id))
  refresh_token, expires_at = create_refresh_token(subject=str(user.id))
  await repository.store_refresh_token(db, user.id, hash_token(refresh_token), expires_at)
  await db.commit()
  return TokenPair(access_token=access_token, refresh_token=refresh_token)

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
  user = await repository.get_user_by_email(db, email)
  if not user or not verify_password(password, user.hashed_password):
    raise AuthError("wrong credentials")
  if not user.is_active:
    raise AuthError("account disabled")
  return user

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenPair:
  try:
    payload = decode_token(refresh_token)
  except ValueError as exc:
    raise AuthError("wrong refresh token") from exc
  if payload.get("type") != "refresh":
    raise AuthError("wrong token type")

  token_row = await repository.get_refresh_token(db, hash_token(refresh_token))
  if not token_row or token_row.revoked:
    raise AuthError("refresh token revoked or unknown")
  if token_row.expires_at < datetime.now(timezone.utc):
    raise AuthError("refresh token expired")

  user = await repository.get_user_by_id(db, token_row.user_id)
  if not user or not user.is_active:
    raise AuthError("user is not present or inactive")

  await repository.revoke_refresh_token(db, token_row) 
  return await issue_token_pair(db, user)


class AuthError(Exception):
  pass

async def register_user(db: AsyncSession, email: str, password: str, full_name: str) -> User:
  if await repository.get_user_by_email(db, email):
    raise AuthError("email already registered")
  user = await repository.create_user(db, email, hash_password(password), full_name)
  await db.commit()
  await db.refresh(user)
  return user

async def issue_token_pair(db: AsyncSession, user: User) -> TokenPair:
  access_token = create_access_token(subject=str(user.id))
  refresh_token, expires_at = create_refresh_token(subject=str(user.id))
  await repository.store_refresh_token(db, user.id, hash_token(refresh_token), expires_at)
  await db.commit()
  return TokenPair(access_token=access_token, refresh_token=refresh_token)

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
  user = await repository.get_user_by_email(db, email)
  if not user or not verify_password(password, user.hashed_password):
    raise AuthError("wrong credentials")
  if not user.is_active:
    raise AuthError("account disabled")
  return user

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenPair:
  try:
    payload = decode_token(refresh_token)
  except ValueError as exc:
    raise AuthError("wrong refresh token") from exc
  if payload.get("type") != "refresh":
    raise AuthError("wrong token type")

  token_row = await repository.get_refresh_token(db, hash_token(refresh_token))
  if not token_row or token_row.revoked:
    raise AuthError("refresh token revoked or unknown")
  if token_row.expires_at < datetime.now(timezone.utc):
    raise AuthError("refresh token expired")
  user = await repository.get_user_by_id(db, token_row.user_id)
  if not user or not user.is_active:
    raise AuthError("user is not present or inactive")

  await repository.revoke_refresh_token(db, token_row) 
  return await issue_token_pair(db, user)

async def request_password_reset(db: AsyncSession, email: str) -> str | None:
  user = await repository.get_user_by_email(db, email)
  if not user:
    return None
  token = create_password_reset_token(subject=str(user.id))
  expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
  await repository.store_password_reset_token(db, user.id, hash_token(token), expires_at)
  await db.commit()
  print(f"[password-reset] DEV ONLY — token for {email}: {token}")
  return token

async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
  try:
    payload = decode_token(token)
  except ValueError as exc:
    raise AuthError("wrong or expired reset link") from exc
  if payload.get("type") != "password_reset":
    raise AuthError("wrong token type")

  token_row = await repository.get_password_reset_token(db, hash_token(token))
  if not token_row or token_row.used:
    raise AuthError("reset link already used or invalid")
  if token_row.expires_at < datetime.now(timezone.utc):
    raise AuthError("reset link expired")
  user = await repository.get_user_by_id(db, token_row.user_id)
  if not user:
    raise AuthError("user not found")

  await repository.update_user_password(db, user, hash_password(new_password))
  await repository.mark_password_reset_token_used(db, token_row)
  await db.commit()