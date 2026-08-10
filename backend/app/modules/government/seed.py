import app.core.model_registry
from datetime import date
from app.core.database import AsyncSessionLocal
from app.modules.elections.models import Election
from app.modules.government.models import Government, CabinetMember
from app.modules.identity.models import User
from app.modules.institutions.models import Ministry
import asyncio
from sqlalchemy import select

GOVERNMENT = {
  "name": "Government of National Unity 2026",
  "election_name": "General Election 2026 (Simulated)",
  "formed_date": date(2026, 2, 20),
  "status": "active",
  "head_of_state_name": "President of Pakistan",
  "head_of_government_name": "Prime Minister of Pakistan",
}

HEADS = [
  ("ayesha.khan@example.com", "head_of_state_user_id"),
  ("sana.malik@example.com", "head_of_government_user_id"),
]

CABINET = [
  ("usman.tariq@example.com", "HLTH", "Federal Minister for Health"),
  ("fahad.sheikh@example.com", "AGR", "Federal Minister for Agriculture"),
  ("mariam.baig@example.com", "INFRA", "Federal Minister for Infrastructure"),
  ("zainab.qureshi@example.com", "DEF", "Federal Minister for Defense"),
  ("hina.raza@example.com", "EDU", "Federal Minister for Education"),
  ("ali.hassan@example.com", "LABOR", "Federal Minister for Labor"),
  ("bilal.ahmed@example.com", "FIN", "Federal Minister for Finance"),
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    election = (
      await db.execute(
        select(Election).where(Election.name == GOVERNMENT["election_name"])
      )
    ).scalar_one_or_none()

    existing = (
      await db.execute(
        select(Government).where(Government.name == GOVERNMENT["name"])
      )
    ).scalar_one_or_none()
    if existing:
      print("[seed] government already exists")
      return

    gov = Government(
      election_id=election.id if election else None,
      name=GOVERNMENT["name"],
      formed_date=GOVERNMENT["formed_date"],
      status=GOVERNMENT["status"],
      head_of_state_name=GOVERNMENT["head_of_state_name"],
      head_of_government_name=GOVERNMENT["head_of_government_name"],
    )
    db.add(gov)
    await db.flush()

    user_by_email: dict[str, User] = {}
    for email, _ in HEADS:
      user = (
        await db.execute(select(User).where(User.email == email))
      ).scalar_one_or_none()
      if user:
        user_by_email[email] = user

    for email, _, _ in CABINET:
      if email not in user_by_email:
        user = (
          await db.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if user:
          user_by_email[email] = user

    for email, field in HEADS:
      user = user_by_email.get(email)
      if user:
        setattr(gov, field, user.id)

    ministry_by_code: dict[str, Ministry] = {}
    for _, code, _ in CABINET:
      ministry = (
        await db.execute(select(Ministry).where(Ministry.code == code))
      ).scalar_one_or_none()
      if ministry:
        ministry_by_code[code] = ministry

    for email, ministry_code, portfolio in CABINET:
      user = user_by_email.get(email)
      ministry = ministry_by_code.get(ministry_code)
      if user and ministry:
        db.add(CabinetMember(government_id=gov.id, user_id=user.id, ministry_id=ministry.id,
         portfolio=portfolio, oath_taken=True, is_active=True, sort_order=list(ministry_by_code.keys()).index(ministry_code),)
        )

    await db.commit()
    print("[seed] government and cabinet seeded")

if __name__ == "__main__":
  asyncio.run(seed())