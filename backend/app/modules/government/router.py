import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.government import repository, service
from app.modules.government.schemas import CabinetMemberCreate, CabinetMemberRead, GovernmentCreate, GovernmentListRead, GovernmentRead
from app.shared.dependencies import get_current_user, require_permission

router = APIRouter(
  prefix="/governments", tags=["governments"], dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=list[GovernmentListRead])
async def list_governments_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_governments(db)


@router.post("", response_model=GovernmentRead, status_code=status.HTTP_201_CREATED)
async def create_government_endpoint(payload: GovernmentCreate,
  _: object = Depends(require_permission("government.manage")),
  db: AsyncSession = Depends(get_db),
):
  return await service.create_government(db, payload)

@router.get("/{government_id}", response_model=GovernmentRead)
async def get_government_endpoint(government_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
  gov = await service.get_government_detail(db, government_id)
  if not gov:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "government is not present")
  return gov

@router.post("/{government_id}/cabinet", response_model=CabinetMemberRead, status_code=status.HTTP_201_CREATED,)
async def add_cabinet_member_endpoint(government_id: uuid.UUID, payload: CabinetMemberCreate,
  _: object = Depends(require_permission("government.manage")),
  db: AsyncSession = Depends(get_db),
):
  return await service.add_cabinet_member(db, government_id, payload)

@router.delete(
  "/{government_id}/cabinet/{member_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_cabinet_member_endpoint(government_id: uuid.UUID, member_id: uuid.UUID,
  _: object = Depends(require_permission("government.manage")),
  db: AsyncSession = Depends(get_db),
):
  try:
    await service.remove_cabinet_member(db, member_id)
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
    ) from exc