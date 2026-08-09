from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.geography.models import Province, District
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def list_provinces(db: AsyncSession) -> list[Province]:
  result = await db.execute(select(Province).order_by(Province.name))
  return list(result.scalars().all())

async def get_province(db: AsyncSession, province_id: uuid.UUID) -> Province | None:
  result = await db.execute(select(Province).where(Province.id == province_id))
  return result.scalar_one_or_none()

async def list_districts_by_province(db: AsyncSession, province_id: uuid.UUID) -> list[District]:
  result = await db.execute(select(District).where(District.province_id == province_id).order_by(District.name))
  return list(result.scalars().all())

async def get_district_detail(db: AsyncSession, district_id: uuid.UUID) -> District | None:
  stmt = (
    select(District)
    .options(selectinload(District.tehsils), selectinload(District.demographic_profile))
    .where(District.id == district_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()