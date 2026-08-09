from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user
import uuid
from app.modules.geography.schemas import ProvinceRead, DistrictDetailRead, DistrictRead
from app.modules.geography import repository
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter(prefix = "/geography", tags = ["geography"], dependencies=[Depends(get_current_user)])

@router.get("/provinces", response_model=list[ProvinceRead])
async def list_provinces_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_provinces(db)

@router.get("/provinces/{province_id}/districts", response_model=list[DistrictRead])
async def list_districts_endpoint(province_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  if not await repository.get_province(db, province_id):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "province not found")
  return await repository.list_districts_by_province(db, province_id)

@router.get("/districts/{district_id}", response_model=DistrictDetailRead)
async def get_district_endpoint(district_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  district = await repository.get_district_detail(db, district_id)
  if not district:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "district not found")
  return district