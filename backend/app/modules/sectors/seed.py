from datetime import date
from decimal import Decimal
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
import app.core.model_registry
from app.modules.geography.models import District
from app.modules.institutions.models import Ministry
from app.modules.sectors.models import EducationInstitution, HealthcareInstitution, Farm, InfrastructureAsset, LaborRecord, DefenseMinistry, DefenseBranch, MilitaryPersonnel, DefenseBudget, DefenseProcurementProject, DisasterResponseUnit, DefenseIndicator
import asyncio

EDUCATION = [
  ("Government College University", "university", "Lahore", 12500, 890),
  ("Allama Iqbal High School", "secondary_school", "Lahore", 2100, 45),
  ("Fatima Jinnah Girls School", "primary_school", "Karachi Central", 850, 22),
  ("Peshawar Model School", "secondary_school", "Peshawar", 1200, 38),
  ("Quetta Public College", "college", "Quetta", 1800, 52),
]

HEALTHCARE = [
  ("Jinnah Hospital", "hospital", "Lahore", 1200, 450, 800),
  ("Aga Khan University Hospital", "hospital", "Karachi Central", 800, 320, 600),
  ("Lady Reading Hospital", "hospital", "Peshawar", 650, 280, 500),
  ("Civil Hospital Quetta", "hospital", "Quetta", 400, 150, 300),
  ("Model Town Clinic", "clinic", "Lahore", 20, 12, 80),
]

FARMS = [
  ("Greenfield Agri Estate", "Lahore", 450.50, "Wheat", 1200.00, "canal"),
  ("Indus Delta Farms", "Karachi Central", 320.00, "Rice", 950.00, "tube_well"),
  ("Khyber Orchard Collective", "Peshawar", 280.75, "Apple", 420.00, "drip"),
  ("Baloch Highland Farms", "Quetta", 890.00, "Almond", 310.00, "rainfed"),
  ("Chenab Citrus Farms", "Faisalabad", 520.00, "Citrus", 1800.00, "canal"),
]

INFRASTRUCTURE = [
  ("Lahore Ring Road — Southern Loop", "road", "Lahore", "28 km", "good", 2018),
  ("Karachi Port Trust Bridge", "bridge", "Karachi Central", "1.2 km", "fair", 2005),
  ("Tarbela Dam Extension", "power_plant", "Peshawar", "35 MW", "excellent", 2022),
  ("Quetta Water Supply Phase 2", "water_supply", "Quetta", "120 MGD", "good", 2019),
  ("Sukkur Barrage Rehabilitation", "bridge", "Karachi Central", "1.6 km", "poor", 1932),
]

LABOR = [
  ("Lahore", 2850000, 2410000, 440000, 15.4, Decimal("32000.00"), "Textiles, Manufacturing, IT"),
  ("Karachi Central", 1920000, 1580000, 340000, 17.7, Decimal("35000.00"), "Finance, Shipping, Textiles"),
  ("Peshawar", 980000, 760000, 220000, 22.4, Decimal("28000.00"), "Agriculture, Trade, Transport"),
  ("Quetta", 420000, 310000, 110000, 26.2, Decimal("26000.00"), "Mining, Agriculture, Trade"),
  ("Faisalabad", 780000, 650000, 130000, 16.7, Decimal("30000.00"), "Textiles, Agriculture"),
]

DEFENSE_BRANCHES = [
  ("Pakistan Army", 560000, 78.5, 12),
  ("Pakistan Navy", 45000, 82.0, 4),
  ("Pakistan Air Force", 52000, 85.5, 3),
  ("Paramilitary Forces", 185000, 71.0, 8),
]

MILITARY_PERSONNEL = {
  "Pakistan Army": [("officer", 42000, 1800, "trained"), ("junior_commissioned", 68000, 1200, "trained"), ("enlisted", 420000, 8500, "trained"), ("civilian", 30000, 4500, "trained")],
  "Pakistan Navy": [("officer", 5200, 280, "trained"), ("enlisted", 34000, 1200, "trained"), ("civilian", 5800, 450, "trained")],
  "Pakistan Air Force": [("officer", 6800, 320, "trained"), ("enlisted", 38000, 950, "trained"), ("civilian", 7200, 380, "trained")],
  "Paramilitary Forces": [("officer", 12000, 150, "trained"), ("enlisted", 158000, 2200, "trained"), ("civilian", 15000, 800, "trained")],
}

DEFENSE_BUDGETS = [
  (2026, Decimal("1850000000000.00"), Decimal("1420000000000.00"), 42.5, 28.0, 18.5, 11.0),
  (2025, Decimal("1680000000000.00"), Decimal("1380000000000.00"), 44.0, 26.5, 19.0, 10.5),
]

DEFENSE_PROCUREMENT = [
  ("Frigate Upgrade Program — Batch 2", "Naval patrol vessel modernization and sensor suite upgrade.", Decimal("85000000000.00"), Decimal("78000000000.00"), "awarded", "STM Turkey", date(2025, 3, 15)),
  ("Main Battle Tank Overhaul", "Refurbishment of Type-85 and Al-Khalid fleet.", Decimal("45000000000.00"), None, "tendered", None, None),
  ("Air Defense Radar Network", "Indigenous radar deployment along eastern corridor.", Decimal("62000000000.00"), None, "planned", None, None),
  ("Disaster Response Vehicle Fleet", "All-terrain ambulances and engineering vehicles.", Decimal("18000000000.00"), Decimal("16500000000.00"), "completed", "Heavy Industries Taxila", date(2024, 8, 20)),
]

DISASTER_UNITS = [
  ("Army Search & Rescue — Lahore", "search_rescue", "Lahore", 450, 85, 92.5, date(2026, 5, 10)),
  ("Navy Medical Unit — Karachi", "medical", "Karachi Central", 120, 40, 88.0, date(2026, 4, 22)),
  ("Engineering Corps — Peshawar", "engineering", "Peshawar", 380, 120, 95.0, date(2026, 6, 5)),
  ("Logistics Battalion — Quetta", "logistics", "Quetta", 220, 65, 79.5, date(2025, 11, 18)),
]

DEFENSE_INDICATORS = [
  ("Training Completion Rate", 78.5, "%", date(2026, 6, 1), "synthetic — illustrative", "medium"),
  ("Equipment Availability Rate", 84.2, "%", date(2026, 6, 1), "synthetic — illustrative", "medium"),
  ("Disaster Response Readiness", 88.5, "%", date(2026, 6, 1), "synthetic — illustrative", "medium"),
  ("Civilian Oversight Compliance", 96.0, "%", date(2026, 6, 1), "synthetic — illustrative", "high"),
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    district_by_name: dict[str, District] = {}
    for name in ["Lahore", "Karachi Central", "Peshawar", "Quetta", "Faisalabad"]:
      d = (await db.execute(select(District).where(District.name == name))).scalar_one_or_none()
      if d:
        district_by_name[name] = d

    for name, itype, dname, enroll, teachers in EDUCATION:
      d = district_by_name.get(dname)
      if not d:
        continue
      existing = (await db.execute(select(EducationInstitution).where(EducationInstitution.name == name))).scalar_one_or_none()
      if not existing:
        db.add(EducationInstitution(
          name=name, institution_type=itype, district_id=d.id,
          enrollment_count=enroll, teacher_count=teachers,
          source="synthetic — illustrative only", as_of_date=date(2026, 1, 1), confidence="low",
        ))

    for name, ftype, dname, beds, staff, capacity in HEALTHCARE:
      d = district_by_name.get(dname)
      if not d:
        continue
      existing = (await db.execute(select(HealthcareInstitution).where(HealthcareInstitution.name == name))).scalar_one_or_none()
      if not existing:
        db.add(HealthcareInstitution(
          name=name, facility_type=ftype, district_id=d.id,
          bed_count=beds, staff_count=staff, daily_patient_capacity=capacity,
          source="synthetic — illustrative only", as_of_date=date(2026, 1, 1), confidence="low",
        ))

    for name, dname, area, crop, yield_, irrigation in FARMS:
      d = district_by_name.get(dname)
      if not d:
        continue
      existing = (await db.execute(select(Farm).where(Farm.name == name))).scalar_one_or_none()
      if not existing:
        db.add(Farm(
          name=name, district_id=d.id, area_hectares=Decimal(str(area)),
          primary_crop=crop, annual_yield_tons=Decimal(str(yield_)), irrigation_type=irrigation,
          source="synthetic — illustrative only", as_of_date=date(2026, 1, 1), confidence="low",
        ))

    for name, atype, dname, length, condition, year in INFRASTRUCTURE:
      d = district_by_name.get(dname)
      if not d:
        continue
      existing = (await db.execute(select(InfrastructureAsset).where(InfrastructureAsset.name == name))).scalar_one_or_none()
      if not existing:
        db.add(InfrastructureAsset(
          name=name, asset_type=atype, district_id=d.id,
          length_km_or_capacity=length, condition_rating=condition, year_constructed=year,
          source="synthetic — illustrative only", as_of_date=date(2026, 1, 1), confidence="low",
        ))

    for dname, workforce, employed, unemployed, rate, wage, sectors in LABOR:
      d = district_by_name.get(dname)
      if not d:
        continue
      existing = (await db.execute(select(LaborRecord).where(LaborRecord.district_id == d.id))).scalar_one_or_none()
      if not existing:
        db.add(LaborRecord(
          district_id=d.id, total_workforce=workforce, employed_count=employed,
          unemployed_count=unemployed, unemployment_rate_pct=Decimal(str(rate)),
          minimum_wage_pkr=wage, dominant_sectors=sectors,
          source="synthetic — illustrative only", as_of_date=date(2026, 1, 1), confidence="low",
        ))

    def_ministry = (await db.execute(select(Ministry).where(Ministry.code == "DEF"))).scalar_one_or_none()
    if def_ministry:
      existing_dm = (await db.execute(select(DefenseMinistry).where(DefenseMinistry.ministry_id == def_ministry.id))).scalar_one_or_none()
      if not existing_dm:
        dm = DefenseMinistry(
          ministry_id=def_ministry.id,
          total_personnel_summary=842000,
          annual_budget_summary=Decimal("1850000000000.00"),
          training_completion_pct=Decimal("78.50"),
          civilian_oversight_status="active",
        )
        db.add(dm)
        await db.flush()

        branch_by_name: dict[str, DefenseBranch] = {}
        for bname, personnel, training, ops in DEFENSE_BRANCHES:
          db.add(DefenseBranch(
            defense_ministry_id=dm.id, branch_name=bname,
            personnel_count=personnel, training_completion_pct=Decimal(str(training)),
            active_operations_count=ops,
          ))
        await db.flush()

        for b in (await db.execute(select(DefenseBranch).where(DefenseBranch.defense_ministry_id == dm.id))).scalars().all():
          branch_by_name[b.branch_name] = b

        for bname, personnel_list in MILITARY_PERSONNEL.items():
          branch = branch_by_name.get(bname)
          if branch:
            for rank, count, women, training in personnel_list:
              db.add(MilitaryPersonnel(
                defense_branch_id=branch.id, rank_category=rank,
                count=count, women_count=women, training_status=training,
              ))

        for year, allocated, spent, pers, equip, infra, research in DEFENSE_BUDGETS:
          db.add(DefenseBudget(
            defense_ministry_id=dm.id, fiscal_year=year,
            total_allocated=allocated, total_spent=spent,
            personnel_allocation_pct=Decimal(str(pers)),
            equipment_allocation_pct=Decimal(str(equip)),
            infrastructure_allocation_pct=Decimal(str(infra)),
            research_allocation_pct=Decimal(str(research)),
          ))

        for title, desc, estimate, contract, status, vendor, adate in DEFENSE_PROCUREMENT:
          db.add(DefenseProcurementProject(
            defense_ministry_id=dm.id, title=title, description=desc,
            budget_estimate=estimate, contract_value=contract,
            status=status, vendor_name=vendor, approval_date=adate,
          ))

        for uname, utype, dname, personnel, equip, readiness, exercise in DISASTER_UNITS:
          d = district_by_name.get(dname)
          if d:
            db.add(DisasterResponseUnit(
              defense_ministry_id=dm.id, unit_name=uname, unit_type=utype,
              district_id=d.id, personnel_count=personnel, equipment_count=equip,
              readiness_pct=Decimal(str(readiness)), last_exercise_date=exercise,
            ))

        for iname, value, unit, adate, source, confidence in DEFENSE_INDICATORS:
          db.add(DefenseIndicator(
            defense_ministry_id=dm.id, indicator_name=iname,
            value=Decimal(str(value)), unit=unit, as_of_date=adate,
            source=source, confidence=confidence,
          ))

    await db.commit()
    print("[seed] sectors seeded")

if __name__ == "__main__":
  asyncio.run(seed())