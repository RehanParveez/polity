from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.modules.identity.models import User
from app.modules.process.models import Scenario
from sqlalchemy.orm import selectinload
from app.modules.sessions.models import SavedSession, SessionShare
from datetime import datetime, timezone
import asyncio
import app.core.model_registry

EXAMPLE_SESSIONS = [
    {
        "title": "Education Surge — Saved Snapshot",
        "description": "Saved session for the education investment scenario with 25% budget increase and teacher training.",
        "scenario_title_match": "Education Surge",
        "visibility": "private",
        "snapshot": {
            "scenario": {
                "id": None, 
                "title": "Education Surge — 25% Budget Increase + Teacher Training",
                "description": "Aggressive education investment scenario: 25% budget increase and 500 hours of teacher training per educator.",
                "inputs": [
                    {"rule_name": "education_investment", "parameter_name": "budget_increase_pct", "parameter_value": "25"},
                    {"rule_name": "education_investment", "parameter_name": "teacher_training_hours", "parameter_value": "500"},
                ],
            },
            "run": {
                "id": None,
                "status": "completed",
                "created_at": None,
            },
            "results": [
                {
                    "indicator_name": "Literacy Rate",
                    "indicator_code": "literacy_rate",
                    "category": "education",
                    "unit": "%",
                    "baseline_value": "62.80",
                    "simulated_value": "67.10",
                    "absolute_change": "4.30",
                    "percent_change": "6.85",
                },
                {
                    "indicator_name": "Total Enrollment",
                    "indicator_code": "total_enrollment",
                    "category": "education",
                    "unit": "students",
                    "baseline_value": "42000000.00",
                    "simulated_value": "50400000.00",
                    "absolute_change": "8400000.00",
                    "percent_change": "20.00",
                },
                {
                    "indicator_name": "Teacher Count",
                    "indicator_code": "teacher_count",
                    "category": "education",
                    "unit": "teachers",
                    "baseline_value": "1850000.00",
                    "simulated_value": "2127500.00",
                    "absolute_change": "277500.00",
                    "percent_change": "15.00",
                },
            ],
            "saved_at": None,
        },
    },
    {
        "title": "Health & Infrastructure Combo — Shared",
        "description": "Shared session for health expansion and road infrastructure investment scenario.",
        "scenario_title_match": "Health & Infrastructure",
        "visibility": "shared",
        "snapshot": {
            "scenario": {
                "id": None,
                "title": "Health & Infrastructure Combo",
                "description": "Dual investment in health expansion (15% budget + 5,000 new beds) and road infrastructure (PKR 120 billion).",
                "inputs": [
                    {"rule_name": "health_expansion", "parameter_name": "budget_increase_pct", "parameter_value": "15"},
                    {"rule_name": "health_expansion", "parameter_name": "new_beds_target", "parameter_value": "5000"},
                    {"rule_name": "infrastructure_build", "parameter_name": "road_investment_billion_pkr", "parameter_value": "120"},
                ],
            },
            "run": {
                "id": None,
                "status": "completed",
                "created_at": None,
            },
            "results": [
                {
                    "indicator_name": "Hospital Bed Count",
                    "indicator_code": "bed_count",
                    "category": "health",
                    "unit": "beds",
                    "baseline_value": "145000.00",
                    "simulated_value": "152500.00",
                    "absolute_change": "7500.00",
                    "percent_change": "5.17",
                },
                {
                    "indicator_name": "Road Condition Index",
                    "indicator_code": "road_condition_index",
                    "category": "infrastructure",
                    "unit": "index (0-100)",
                    "baseline_value": "58.50",
                    "simulated_value": "62.50",
                    "absolute_change": "4.00",
                    "percent_change": "6.84",
                },
            ],
            "saved_at": None,
        },
    },
]

async def seed() -> None:
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).order_by(User.created_at))).scalars().first()
        if not user:
            print("[seed] No user found in DB; create at least one user before seeding sessions.")
            return

        stmt = select(Scenario).options(selectinload(Scenario.simulation_runs))
        all_scenarios = (await db.execute(stmt)).scalars().all()
        scenario_by_title: dict[str, Scenario] = {s.title: s for s in all_scenarios}

        for ex in EXAMPLE_SESSIONS:
            matched_scenario: Scenario | None = None
            for title, scenario in scenario_by_title.items():
                if ex["scenario_title_match"] in title:
                    matched_scenario = scenario
                    break
            existing = (
                await db.execute(
                    select(SavedSession).where(
                        SavedSession.owner_id == user.id,
                        SavedSession.title == ex["title"],
                    )
                )
            ).scalars().first()
            if existing:
                continue

            snapshot = dict(ex["snapshot"])
            if matched_scenario:
                snapshot["scenario"]["id"] = str(matched_scenario.id)
                completed_runs = [r for r in matched_scenario.simulation_runs if r.status == "completed"]
                if completed_runs:
                    latest_run = completed_runs[0]
                    snapshot["run"]["id"] = str(latest_run.id)
                    snapshot["run"]["created_at"] = latest_run.created_at.isoformat() if latest_run.created_at else None
                else:
                    snapshot["run"] = None
            else:
                snapshot["scenario"]["id"] = None

            snapshot["saved_at"] = datetime.now(timezone.utc).isoformat()

            sess = SavedSession(
                owner_id=user.id,
                title=ex["title"],
                description=ex["description"],
                scenario_id=matched_scenario.id if matched_scenario else None,
                visibility=ex["visibility"],
                snapshot=snapshot,
            )
            db.add(sess)
            await db.flush()

            if ex["visibility"] == "shared":
                share = SessionShare(
                    session_id=sess.id,
                    shared_with_user_id=user.id,
                    shared_with_institution_id=None,
                    permission="view",
                )
                db.add(share)

        await db.commit()
        print(f"[seed] {len(EXAMPLE_SESSIONS)} example saved sessions seeded for user {user.email}")

if __name__ == "__main__":
    asyncio.run(seed())