from decimal import Decimal
from datetime import date
from app.modules.institutions.models import Ministry
from app.modules.identity.models import User
from app.modules.policies.models import Policy, PolicyIndicator, PolicyImplementation, PolicyApproval
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.modules.policies.models import PolicyReview
import asyncio
import app.core.model_registry

POLICIES = [
  {
    "title": "National Digital Literacy Program 2026",
    "description": "A nationwide initiative to equip 5 million citizens with basic digital skills by 2028, targeting rural districts and women-headed households.",
    "ministry_code": "EDU",
    "status": "approved",
    "indicators": [
      ("Citizens Trained (millions)", Decimal("5.00"), Decimal("1.20"), "persons"),
      ("Districts Covered", Decimal("150.00"), Decimal("42.00"), "districts"),
      ("Women Participation Rate", Decimal("60.00"), Decimal("35.00"), "%"),
    ],
    "implementations": [
      ("Establish 500 Digital Learning Centers", date(2026, 6, 1), "in_progress", Decimal("450000000.00")),
      ("Train 10,000 Master Trainers", date(2026, 9, 1), "not_started", Decimal("200000000.00")),
      ("Launch National Digital Portal", date(2026, 12, 1), "not_started", Decimal("150000000.00")),
    ],
  },
  {
    "title": "Sindh Water Conservation & Drip Irrigation Act",
    "description": "Mandates drip irrigation for all farms above 10 hectares in water-stressed districts; subsidizes 70% equipment cost for smallholders.",
    "ministry_code": "AGR",
    "status": "under_review",
    "indicators": [
      ("Farm Area Under Drip (hectares)", Decimal("250000.00"), Decimal("0.00"), "hectares"),
      ("Water Saved Annually (MAF)", Decimal("3.50"), Decimal("0.00"), "million acre-feet"),
      ("Smallholder Subsidy Disbursed", Decimal("12000000000.00"), Decimal("0.00"), "PKR"),
    ],
    "implementations": [],
  },
  {
    "title": "Universal Health Coverage Expansion — Khyber Pakhtunkhwa",
    "description": "Extends Sehat Card Plus coverage to 8 million additional families in KP, including tertiary care and mental health services.",
    "ministry_code": "HLTH",
    "status": "implemented",
    "indicators": [
      ("Families Enrolled (millions)", Decimal("8.00"), Decimal("6.40"), "families"),
      ("Hospitals Empaneled", Decimal("120.00"), Decimal("98.00"), "hospitals"),
      ("Claims Processed (millions)", Decimal("4.50"), Decimal("2.80"), "claims"),
    ],
    "implementations": [
      ("Empanel 120 Tertiary Hospitals", date(2025, 12, 1), "completed", Decimal("2800000000.00")),
      ("Issue Sehat Cards to 8M Families", date(2026, 3, 1), "completed", Decimal("450000000.00")),
      ("Mental Health Helpline Launch", date(2026, 6, 1), "in_progress", Decimal("120000000.00")),
    ],
  },
  {
    "title": "Balochistan Coastal Highway & Gwadar Port Link",
    "description": "Construction of 180 km dual-carriageway connecting Gwadar Port to the Makran Coastal Highway with integrated freight corridors.",
    "ministry_code": "INFRA",
    "status": "draft",
    "indicators": [
      ("Highway Length Completed (km)", Decimal("180.00"), Decimal("0.00"), "km"),
      ("Freight Volume Capacity (tons/day)", Decimal("50000.00"), Decimal("0.00"), "tons"),
      ("Travel Time Reduction (hours)", Decimal("4.50"), Decimal("0.00"), "hours"),
    ],
    "implementations": [],
  },
  {
    "title": "Federal Minimum Wage Enforcement & Digital Payroll Tracking",
    "description": "Mandates digital payroll registration for all firms with 10+ employees; real-time compliance monitoring via NADRA-linked database.",
    "ministry_code": "LABOR",
    "status": "revisions_requested",
    "indicators": [
      ("Firms Registered", Decimal("500000.00"), Decimal("0.00"), "firms"),
      ("Workers Covered (millions)", Decimal("12.00"), Decimal("0.00"), "workers"),
      ("Compliance Rate", Decimal("95.00"), Decimal("0.00"), "%"),
    ],
    "implementations": [],
  },
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    ministry_by_code: dict[str, Ministry] = {}
    for code in ["EDU", "AGR", "HLTH", "INFRA", "LABOR"]:
      m = (await db.execute(select(Ministry).where(Ministry.code == code))).scalar_one_or_none()
      if m:
        ministry_by_code[code] = m

    creator = (await db.execute(select(User).order_by(User.created_at))).scalars().first()
    creator_id = creator.id if creator else None

    for p in POLICIES:
      ministry = ministry_by_code.get(p["ministry_code"])
      if not ministry:
        print(f"[seed] skipping '{p['title']}' — ministry not found")
        continue

      existing = (
        await db.execute(select(Policy).where(Policy.title == p["title"]))
      ).scalar_one_or_none()
      if existing:
        continue

      policy = Policy(
        title=p["title"],
        description=p["description"],
        ministry_id=ministry.id,
        status=p["status"],
        current_approval_step=0 if p["status"] in {"draft", "revisions_requested"} else (3 if p["status"] == "approved" else 0),
        version=1,
        created_by=creator_id,
        updated_by=creator_id,
        source="synthetic — illustrative only",
        as_of_date=date(2026, 1, 1),
        confidence="low",
      )
      db.add(policy)
      await db.flush()

      for name, target, current, unit in p["indicators"]:
        db.add(PolicyIndicator(
          policy_id=policy.id,
          indicator_name=name,
          target_value=target,
          current_value=current,
          unit=unit,
          as_of_date=date(2026, 6, 1),
          source="synthetic — illustrative only",
          confidence="low",
        ))

      for milestone, target_date, mstatus, budget in p["implementations"]:
        db.add(PolicyImplementation(
          policy_id=policy.id,
          milestone=milestone,
          target_date=target_date,
          status=mstatus,
          budget_utilized=budget,
        ))

      if p["status"] in {"under_review", "approved", "implemented", "evaluated", "closed"}:
        steps = [
          (1, "Ministry Review", "approved" if p["status"] in {"approved", "implemented", "evaluated", "closed"} else "pending"),
          (2, "Cabinet Review", "approved" if p["status"] in {"approved", "implemented", "evaluated", "closed"} else "pending"),
          (3, "Parliamentary Review", "approved" if p["status"] in {"approved", "implemented", "evaluated", "closed"} else "pending"),
        ]
        for step_num, step_name, step_status in steps:
          db.add(PolicyApproval(
            policy_id=policy.id,
            approval_step=step_num,
            step_name=step_name,
            status=step_status,
          ))
        if p["status"] in {"approved", "implemented", "evaluated", "closed"}:
          policy.current_approval_step = 3

      if p["status"] == "revisions_requested":
        db.add(PolicyReview(
          policy_id=policy.id,
          reviewer_id=creator_id,
          review_round=1,
          status = "changes_requested",
          comments = "Requires clearer enforcement mechanism for firms with seasonal labor.",
        ))

    await db.commit()
    print("[seed] policies seeded")

if __name__ == "__main__":
  asyncio.run(seed())