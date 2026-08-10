from app.core.database import AsyncSessionLocal
from app.modules.institutions.models import Ministry, Department, InstitutionMembership
from app.modules.identity.models import User
from app.modules.authorization.models import UserRole
from sqlalchemy import select
import asyncio

MINISTRIES = [
  ("Ministry of Finance", "FIN"),
  ("Ministry of Education", "EDU"),
  ("Ministry of Health", "HLTH"),
  ("Ministry of Agriculture", "AGR"),
  ("Ministry of Infrastructure", "INFRA"),
  ("Ministry of Labor", "LABOR"),
  ("Ministry of Defense", "DEF"),
]

DEPARTMENTS = {
  "FIN": ["Budget & Expenditure", "Revenue & Taxation", "Public Debt Management"],
  "EDU": ["Primary & Secondary Education", "Higher Education", "Curriculum Development"],
  "HLTH": ["Public Health Programs", "Hospital Administration", "Disease Surveillance"],
  "AGR": ["Crop Production", "Irrigation & Water Management", "Livestock & Fisheries"],
  "INFRA": ["Roads & Highways", "Urban Planning", "Energy & Utilities"],
  "LABOR": ["Employment Services", "Workplace Safety", "Labor Relations"],
  "DEF": ["Administration & Budget", "Personnel & Training", "Procurement"], 
}

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    ministry_by_code = {}
    for name, code in MINISTRIES:
      existing = (await db.execute(select(Ministry).where(Ministry.code == code))).scalar_one_or_none()
      if not existing:
        existing = Ministry(name=name, code=code)
        db.add(existing)
        await db.flush()
      ministry_by_code[code] = existing

    department_by_name = {}
    for code, names in DEPARTMENTS.items():
      for name in names:
        existing = (await db.execute(select(Department).where(Department.name == name))).scalar_one_or_none()
        if not existing:
          existing = Department(name=name, ministry_id=ministry_by_code[code].id)
          db.add(existing)
          await db.flush()
        department_by_name[name] = existing

    test_user = (await db.execute(select(User).where(User.email == "test@example.com"))).scalar_one_or_none()
    if test_user:
      finance_dept = department_by_name["Budget & Expenditure"]
      existing_membership = (
        await db.execute(
          select(InstitutionMembership).where(InstitutionMembership.user_id == test_user.id, InstitutionMembership.ministry_id == ministry_by_code["FIN"].id,)
        )
      ).scalar_one_or_none()
      if not existing_membership:
        db.add(InstitutionMembership(user_id=test_user.id, ministry_id=ministry_by_code["FIN"].id, department_id=finance_dept.id, title = "Secretary",)
      )

    await db.commit()
    print("[seed] institutions seeded")

if __name__ == "__main__":
    asyncio.run(seed())