from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.institutions.models import Ministry, Department, InstitutionMembership
from sqlalchemy import select
import uuid 
from sqlalchemy.orm import selectinload

async def list_ministries(db: AsyncSession) -> list[Ministry]:
  result = await db.execute(select(Ministry).order_by(Ministry.name))
  return list(result.scalars().all())

async def get_ministry_detail(db: AsyncSession, ministry_id: uuid.UUID) -> Ministry | None:
  stmt = (select(Ministry)
    .options(
      selectinload(Ministry.departments)
      .selectinload(Department.memberships)
      .selectinload(InstitutionMembership.user)
    )
      .where(Ministry.id == ministry_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()