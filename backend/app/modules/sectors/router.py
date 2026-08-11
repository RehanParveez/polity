from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.sectors import repository
from app.modules.sectors.schemas import SectorSummary, DefenseMinistryRead, EducationInstitutionRead, FarmRead, HealthcareInstitutionRead, InfrastructureAssetRead, LaborRecordRead

router = APIRouter(prefix="/sectors", tags=["sectors"], dependencies=[Depends(get_current_user)])

@router.get("/summary", response_model=SectorSummary)
async def sector_summary(db: AsyncSession = Depends(get_db)):
    data = await repository.get_sector_summary(db)
    return SectorSummary(**data)

@router.get("/education", response_model=list[EducationInstitutionRead])
async def list_education_endpoint(db: AsyncSession = Depends(get_db)):
    return await repository.list_education(db)

@router.get("/healthcare", response_model=list[HealthcareInstitutionRead])
async def list_healthcare_endpoint(db: AsyncSession = Depends(get_db)):
    return await repository.list_healthcare(db)

@router.get("/agriculture", response_model=list[FarmRead])
async def list_farms_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_farms(db)

@router.get("/infrastructure", response_model=list[InfrastructureAssetRead])
async def list_infrastructure_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_infrastructure(db)

@router.get("/labor", response_model=list[LaborRecordRead])
async def list_labor_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_labor(db)

@router.get("/defense", response_model=DefenseMinistryRead)
async def get_defense_endpoint(db: AsyncSession = Depends(get_db)):
  ministry = await repository.get_defense_ministry(db)
  if not ministry:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "defense ministry record not found")
  return ministry