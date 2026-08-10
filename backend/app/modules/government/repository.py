from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.government.models import Government, CabinetMember
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def list_governments(db: AsyncSession) -> list[Government]:
  result = await db.execute(select(Government).order_by(Government.formed_date.desc()))
  return list(result.scalars().all())

async def get_government(db: AsyncSession, gov_id: uuid.UUID) -> Government | None:
  stmt = (
    select(Government)
    .options(
      selectinload(Government.election),
      selectinload(Government.cabinet_members).selectinload(CabinetMember.user),
      selectinload(Government.cabinet_members).selectinload(CabinetMember.ministry),
    )
    .where(Government.id == gov_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_government(db: AsyncSession, **kwargs) -> Government:
  gov = Government(**kwargs)
  db.add(gov)
  await db.flush()
  return gov

async def add_cabinet_member(db: AsyncSession, government_id: uuid.UUID, **kwargs) -> CabinetMember:
  member = CabinetMember(government_id=government_id, **kwargs)
  db.add(member)
  await db.flush()
  return member

async def get_cabinet_member(db: AsyncSession, member_id: uuid.UUID) -> CabinetMember | None:
  result = await db.execute(select(CabinetMember).where(CabinetMember.id == member_id))
  return result.scalar_one_or_none()

async def delete_cabinet_member(db: AsyncSession, member: CabinetMember) -> None:
  await db.delete(member)
  await db.flush()