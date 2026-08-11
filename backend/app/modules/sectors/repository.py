from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.modules.sectors.models import EducationInstitution, HealthcareInstitution, Farm, InfrastructureAsset, LaborRecord, DefenseMinistry, DefenseBranch, DisasterResponseUnit
from sqlalchemy import func
from decimal import Decimal

async def list_education(db: AsyncSession) -> list[EducationInstitution]:
  stmt = select(EducationInstitution).options(selectinload(EducationInstitution.district)).order_by(EducationInstitution.name)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_healthcare(db: AsyncSession) -> list[HealthcareInstitution]:
  stmt = select(HealthcareInstitution).options(selectinload(HealthcareInstitution.district)).order_by(HealthcareInstitution.name)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_farms(db: AsyncSession) -> list[Farm]:
  stmt = select(Farm).options(selectinload(Farm.district)).order_by(Farm.name)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_infrastructure(db: AsyncSession) -> list[InfrastructureAsset]:
  stmt = select(InfrastructureAsset).options(selectinload(InfrastructureAsset.district)).order_by(InfrastructureAsset.name)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_labor(db: AsyncSession) -> list[LaborRecord]:
  stmt = select(LaborRecord).options(selectinload(LaborRecord.district)).order_by(LaborRecord.as_of_date.desc())
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_defense_ministry(db: AsyncSession) -> DefenseMinistry | None:
  stmt = (
    select(DefenseMinistry)
    .options(
      selectinload(DefenseMinistry.branches).selectinload(DefenseBranch.personnel),
      selectinload(DefenseMinistry.budgets),
      selectinload(DefenseMinistry.procurements),
      selectinload(DefenseMinistry.disaster_units).selectinload(DisasterResponseUnit.district),
      selectinload(DefenseMinistry.indicators),
      selectinload(DefenseMinistry.ministry),
    )
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def get_sector_summary(db: AsyncSession) -> dict:
  edu_count = await db.execute(select(func.count(EducationInstitution.id)))
  total_enrollment = await db.execute(select(func.coalesce(func.sum(EducationInstitution.enrollment_count), 0)))

  health_count = await db.execute(select(func.count(HealthcareInstitution.id)))
  total_beds = await db.execute(select(func.coalesce(func.sum(HealthcareInstitution.bed_count), 0)))

  farm_count = await db.execute(select(func.count(Farm.id)))
  total_farm_area = await db.execute(select(func.coalesce(func.sum(Farm.area_hectares), Decimal("0.00"))))

  infra_count = await db.execute(select(func.count(InfrastructureAsset.id)))

  labor_count = await db.execute(select(func.count(LaborRecord.id)))
  total_workforce = await db.execute(select(func.coalesce(func.sum(LaborRecord.total_workforce), 0)))

  defense_count = await db.execute(select(func.count(DefenseMinistry.id)))
  total_defense_personnel = await db.execute(select(func.coalesce(func.sum(DefenseMinistry.total_personnel_summary), 0)))

  return {
    "education_institutions": edu_count.scalar_one(),
    "total_enrollment": total_enrollment.scalar_one(),
    "healthcare_institutions": health_count.scalar_one(),
    "total_beds": total_beds.scalar_one(),
    "farms": farm_count.scalar_one(),
    "total_farm_area": total_farm_area.scalar_one(),
    "infrastructure_assets": infra_count.scalar_one(),
    "labor_records": labor_count.scalar_one(),
    "total_workforce": total_workforce.scalar_one(),
    "defense_ministries": defense_count.scalar_one(),
    "total_defense_personnel": total_defense_personnel.scalar_one(),
  }