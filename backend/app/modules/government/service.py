from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.government.schemas import GovernmentCreate, CabinetMemberCreate
from app.modules.government import repository
import uuid

async def create_government(db: AsyncSession, payload: GovernmentCreate) -> ...:
  data = payload.model_dump(exclude_unset=True)
  gov = await repository.create_government(db, **data)
  await db.commit()
  await db.refresh(gov)
  return gov

async def get_government_detail(db: AsyncSession, gov_id: uuid.UUID):
  return await repository.get_government(db, gov_id)

async def add_cabinet_member(db: AsyncSession, government_id: uuid.UUID, payload: CabinetMemberCreate):
  data = payload.model_dump(exclude_unset=True)
  member = await repository.add_cabinet_member(db, government_id, **data)
  await db.commit()
  await db.refresh(member)
  return member

async def remove_cabinet_member(db: AsyncSession, member_id: uuid.UUID) -> None:
  member = await repository.get_cabinet_member(db, member_id)
  if not member:
    raise ValueError("cabinet member is not present")
  await repository.delete_cabinet_member(db, member)
  await db.commit()