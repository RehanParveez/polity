import app.core.model_registry
from datetime import date
from app.core.database import AsyncSessionLocal
from app.modules.elections.models import Constituency, Party, Candidate, Election, VoteRecord
from app.modules.geography.models import District
import asyncio
from sqlalchemy import select

PARTIES = [
  ("National Unity Party", "NUP", "#14b8a6", 1998),
  ("Progressive Alliance", "PA", "#f59e0b", 2004),
  ("People's Justice Movement", "PJM", "#ef4444", 2011),
  ("Green Pakistan Front", "GPF", "#22c55e", 2015),
  ("Democratic Front", "DF", "#3b82f6", 2001),
]

CONSTITUENCIES = [
  ("NA-1", "Lahore-I", "Lahore"),
  ("NA-2", "Lahore-II", "Lahore"),
  ("NA-3", "Karachi Central-I", "Karachi Central"),
  ("NA-4", "Karachi Central-II", "Karachi Central"),
  ("NA-5", "Peshawar-I", "Peshawar"),
  ("NA-6", "Quetta-I", "Quetta"),
  ("NA-7", "Faisalabad-I", "Faisalabad"),
  ("NA-8", "Rawalpindi-I", "Rawalpindi"),
  ("NA-9", "Multan-I", "Multan"),
  ("NA-10", "Islamabad-I", "Islamabad"),
]

CANDIDATES = [
  ("NA-1", "Ahmed Raza", "NUP", 48250), ("NA-1", "Fazal Chaudhry", "PA", 39120),
  ("NA-2", "Sana Aslam", "PJM", 41870), ("NA-2", "Kamran Iqbal", "NUP", 44310),
  ("NA-3", "Fatima Siddiqui", "GPF", 36540), ("NA-3", "Hassan Malik", "DF", 40220),
  ("NA-4", "Nadia Farooq", "NUP", 45680), ("NA-4", "Haris Butt", "PA", 38900),
  ("NA-5", "Imran Wazir", "PJM", 33450), ("NA-5", "Shabana Gul", "NUP", 37210),
  ("NA-6", "Naseer Bugti", "DF", 29870), ("NA-6", "Rukhsana Marri", "GPF", 31200),
  ("NA-7", "Waqas Anjum", "PA", 42600), ("NA-7", "Mehwish Tariq", "NUP", 43950),
  ("NA-8", "Junaid Sethi", "NUP", 46200), ("NA-8", "Jaam Noor", "PJM", 40100),
  ("NA-9", "Farrukh Leghari", "DF", 35600), ("NA-9", "Samina Joyo", "PA", 34200),
  ("NA-10", "Tariq Fazal", "NUP", 39800), ("NA-10", "Rabia Chaudhry", "GPF", 37650),
]

ELECTIONS = [("General Election 2026 (Simulated)", date(2026, 2, 15), "results_declared"), ("By-Election — NA-3 (Simulated)", date(2026, 9, 1), "scheduled"),]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    party_by_abbr = {}
    for name, abbr, color, founded in PARTIES:
      existing = (await db.execute(select(Party).where(Party.abbreviation == abbr))).scalar_one_or_none()
      if not existing:
        existing = Party(name=name, abbreviation=abbr, color_hex=color, founded_year=founded)
        db.add(existing)
        await db.flush()
      party_by_abbr[abbr] = existing

    constituency_by_code = {}
    for code, name, district_name in CONSTITUENCIES:
      existing = (await db.execute(select(Constituency).where(Constituency.code == code))).scalar_one_or_none()
      if not existing:
        district = (await db.execute(select(District).where(District.name == district_name))).scalar_one_or_none()
        if not district:
          print(f"[seed] skipping {code} — district '{district_name}' not present, run geography seed first")
          continue
        existing = Constituency(code=code, name=name, district_id=district.id)
        db.add(existing)
        await db.flush()
      constituency_by_code[code] = existing

    elections = {}
    for name, edate, estatus in ELECTIONS:
      existing = (await db.execute(select(Election).where(Election.name == name))).scalar_one_or_none()
      if not existing:
        existing = Election(name=name, election_date=edate, status=estatus)
        db.add(existing)
        await db.flush()
      elections[name] = existing
    election1 = elections[ELECTIONS[0][0]]

    for constituency_code, full_name, party_abbr, votes in CANDIDATES:
      constituency = constituency_by_code.get(constituency_code)
      if not constituency:
        continue
      candidate = (await db.execute(
        select(Candidate).where(Candidate.full_name == full_name, Candidate.constituency_id == constituency.id)
      )
      ).scalar_one_or_none()
      if not candidate:
        candidate = Candidate(full_name=full_name, constituency_id=constituency.id, party_id=party_by_abbr[party_abbr].id if party_abbr else None,
        )
        db.add(candidate)
        await db.flush()

      existing_vote = (
        await db.execute(
         select(VoteRecord).where(VoteRecord.election_id == election1.id, VoteRecord.candidate_id == candidate.id)
        )
      ).scalar_one_or_none()
      if not existing_vote:
        db.add(VoteRecord(election_id=election1.id, candidate_id=candidate.id, votes_count=votes))

    await db.commit()
    print("[seed] elections seeded")

if __name__ == "__main__":
    asyncio.run(seed())