from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.identity.models import User
from fastapi import Depends, HTTPException, status
import uuid
from app.core.database import get_db
from app.modules.authorization.models import Permission, Role, RolePermission, UserRole
from sqlalchemy import select
from app.core.security import decode_token
from app.modules.identity.repository import get_user_by_id
from app.modules.institutions.models import InstitutionMembership

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
  token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
  try:
    payload = decode_token(token)
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "wrong token") from exc
  if payload.get("type") != "access":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "wrong token type")

  user = await get_user_by_id(db, uuid.UUID(payload["sub"]))
  if not user or not user.is_active:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "user is not present or inactive")
  return user

async def _check_role_permission(db: AsyncSession, user_id: uuid.UUID, permission_code: str) -> None:
  stmt = (
    select(Permission.code)
    .join(RolePermission, RolePermission.permission_id == Permission.id)
    .join(Role, Role.id == RolePermission.role_id)
    .join(UserRole, UserRole.role_id == Role.id)
    .where(UserRole.user_id == user_id, Permission.code == permission_code)
  )
  if (await db.execute(stmt)).scalar_one_or_none() is None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="permission denied")

def require_permission(permission_code: str, *, institution_scope: bool = False):
  if institution_scope:

    async def dependency(
      ministry_id: uuid.UUID,
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_db),
    ) -> User:
      await _check_role_permission(db, current_user.id, permission_code)
      stmt = select(InstitutionMembership).where(InstitutionMembership.user_id == current_user.id, InstitutionMembership.ministry_id == ministry_id,)
      if (await db.execute(stmt)).scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="institution scope denied")
      return current_user

    return dependency

  async def dependency(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
  ) -> User:
    await _check_role_permission(db, current_user.id, permission_code)
    return current_user

  return dependency 