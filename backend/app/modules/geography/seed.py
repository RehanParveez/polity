import asyncio
from datetime import date
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.geography.models import DemographicProfile, District, Province, Tehsil

PROVINCES = [
  ("Punjab", "PB", "province"),
  ("Sindh", "SD", "province"),
  ("Khyber Pakhtunkhwa", "KP", "province"),
  ("Balochistan", "BA", "province"),
  ("Islamabad Capital Territory", "ICT", "territory"),
  ("Gilgit-Baltistan", "GB", "territory"),
  ("Azad Jammu & Kashmir", "AJK", "territory"),
]

DISTRICTS = {
  "PB": ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala"],
  "SD": ["Karachi Central", "Hyderabad", "Sukkur"],
  "KP": ["Peshawar", "Abbottabad", "Mardan"],
  "BA": ["Quetta", "Gwadar"],
  "ICT": ["Islamabad"],
  "GB": ["Gilgit", "Skardu"],
  "AJK": ["Muzaffarabad", "Mirpur"],
}

TEHSILS = {
  "Lahore": ["Lahore City", "Lahore Cantonment"],
  "Karachi Central": ["Gulberg Town", "Liaquatabad Town"],
  "Peshawar": ["Peshawar City", "Peshawar Cantonment"],
}

DEMOGRAPHICS = {
  "Lahore": (11_000_000, 74.5, 82.0),
  "Faisalabad": (7_800_000, 68.2, 61.0),
  "Karachi Central": (2_900_000, 79.0, 100.0),
  "Peshawar": (4_200_000, 60.5, 55.0),
}

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    province_by_code = {}
    for name, code, unit_type in PROVINCES:
      existing = (await db.execute(select(Province).where(Province.code == code))).scalar_one_or_none()
      if not existing:
        existing = Province(name=name, code=code, unit_type=unit_type)
        db.add(existing)
        await db.flush()
      province_by_code[code] = existing

    district_by_name = {}
    for code, names in DISTRICTS.items():
      for name in names:
        existing = (await db.execute(select(District).where(District.name == name))).scalar_one_or_none()
        if not existing:
          existing = District(name=name, province_id=province_by_code[code].id)
          db.add(existing)
          await db.flush()
        district_by_name[name] = existing

    for district_name, names in TEHSILS.items():
      for name in names:
        existing = (await db.execute(select(Tehsil).where(Tehsil.name == name, Tehsil.district_id == district_by_name[district_name].id))
        ).scalar_one_or_none()
        if not existing:
          db.add(Tehsil(name=name, district_id=district_by_name[district_name].id))

    for district_name, (population, literacy, urban) in DEMOGRAPHICS.items():
      existing = (
                await db.execute(
                    select(DemographicProfile).where(DemographicProfile.district_id == district_by_name[district_name].id)
                )
      ).scalar_one_or_none()
      if not existing:
        db.add(DemographicProfile(
          district_id=district_by_name[district_name].id,
          population=population,
          literacy_rate_pct=literacy,
          urban_pct=urban,
          source = "synthetic — illustrative only",
          as_of_date=date(2026, 1, 1),
          confidence="low",))

    await db.commit()
    print("[seed] geography seeded")

if __name__ == "__main__":
    asyncio.run(seed())