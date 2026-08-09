from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy import select
from app.modules.authorization.models import Permission, RolePermission, UserRole

async def get_permission_codes_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[str]:
  stmt = (
    select(Permission.code)
    .join(RolePermission, RolePermission.permission_id == Permission.id)
    .join(UserRole, UserRole.role_id == RolePermission.role_id)
    .where(UserRole.user_id == user_id)
  )
  result = await db.execute(stmt)
  return [row[0] for row in result.all()]