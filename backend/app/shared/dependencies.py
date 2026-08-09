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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
  token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
  try:
    payload = decode_token(token)
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "invalid token") from exc
  if payload.get("type") != "access":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "invalid token type")

  user = await get_user_by_id(db, uuid.UUID(payload["sub"]))
  if not user or not user.is_active:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "user is not present or inactive")
  return user

def require_permission(permission_code: str):
  async def dependency(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
  ) -> User:
    stmt = (
      select(Permission.code)
      .join(RolePermission, RolePermission.permission_id == Permission.id)
      .join(Role, Role.id == RolePermission.role_id)
      .join(UserRole, UserRole.role_id == Role.id)
      .where(UserRole.user_id == current_user.id, Permission.code == permission_code)
    )
    if (await db.execute(stmt)).scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "permission denied")
    return current_user

  return dependency