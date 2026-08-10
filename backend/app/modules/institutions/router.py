from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
from app.modules.institutions.schemas import MinistryDetailRead, MinistryRead
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.institutions import repository
from app.core.database import get_db
import uuid
from app.modules.identity.models import User

router = APIRouter(prefix="/institutions", tags=["institutions"], dependencies=[Depends(get_current_user)])

@router.get("/ministries", response_model=list[MinistryRead])
async def list_ministries_endpoint(db: AsyncSession = Depends(get_db)):
  return await(repository.list_ministries(db))

@router.get("/ministries/{ministry_id}", response_model=MinistryDetailRead)
async def get_ministry_endpoint(ministry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  ministry = await repository.get_ministry_detail(db, ministry_id)
  if not ministry:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the ministry is not present")
  return ministry

@router.get("/ministries/{ministry_id}/admin-ping")
async def ministry_admin_ping(ministry_id: uuid.UUID, current_user: User = Depends(require_permission("institution.manage", institution_scope=True)),
):
  return {"status": "ok", "ministry_id": str(ministry_id), "user": str(current_user.id)}