from app.core.database import AsyncSessionLocal
from app.modules.audits.models import AuditEvent
from sqlalchemy import select
import asyncio

DEMO_EVENTS = [
  {
    "entity_type": "user",
    "entity_id": "11111111-1111-1111-1111-111111111111",
    "action": "login",
    "actor_id": "11111111-1111-1111-1111-111111111111",
    "actor_name": "Roma",
    "after_state": {"ip": "192.168.1.10", "user_agent": "Mozilla/5.0"},
    "event_metadata": {"ip": "192.168.1.10"},
    "module": "identity",
  },
  {
    "entity_type": "policy",
    "entity_id": "22222222-2222-2222-2222-222222222222",
    "action": "create",
    "actor_id": "11111111-1111-1111-1111-111111111111",
    "actor_name": "Roma",
    "after_state": {"title": "National Digital Literacy Program 2026", "status": "draft"},
    "event_metadata": {},
    "module": "policies",
  },
  {
    "entity_type": "policy",
    "entity_id": "22222222-2222-2222-2222-222222222222",
    "action": "transition",
    "actor_id": "33333333-3333-3333-3333-333333333333",
    "actor_name": "Bilal Ahmed",
    "before_state": {"status": "draft"},
    "after_state": {"status": "under_review"},
    "event_metadata": {"comment": "Submitted for ministry review"},
    "module": "policies",
  },
  {
    "entity_type": "simulation_run",
    "entity_id": "44444444-4444-4444-4444-444444444444",
    "action": "run",
    "actor_id": "55555555-5555-5555-5555-555555555555",
    "actor_name": "Sana Malik",
    "after_state": {"scenario_title": "Education Surge", "status": "completed"},
    "event_metadata": {"rule_count": 3, "indicators_affected": 3},
    "module": "simulations",
  },
  {
    "entity_type": "budget",
    "entity_id": "66666666-6666-6666-6666-666666666666",
    "action": "update",
    "actor_id": "77777777-7777-7777-7777-777777777777",
    "actor_name": "Usman Tariq",
    "before_state": {"total_amount": "500000000000.00", "status": "draft"},
    "after_state": {"total_amount": "520000000000.00", "status": "draft"},
    "event_metadata": {"reason": "Revised revenue projections"},
    "module": "finance",
  },
  {
    "entity_type": "cabinet_member",
    "entity_id": "88888888-8888-8888-8888-888888888888",
    "action": "create",
    "actor_id": "11111111-1111-1111-1111-111111111111",
    "actor_name": "Roma",
    "after_state": {"portfolio": "Federal Minister for Health", "ministry_code": "HLTH", "oath_taken": True},
    "event_metadata": {},
    "module": "government",
  },
  {
    "entity_type": "session_share",
    "entity_id": "99999999-9999-9999-9999-999999999999",
    "action": "share",
    "actor_id": "55555555-5555-5555-5555-555555555555",
    "actor_name": "Sana Malik",
    "after_state": {"session_title": "Health & Infrastructure Combo", "shared_with": "institutional", "permission": "view"},
    "event_metadata": {},
    "module": "sessions",
  },
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    existing = (await db.execute(select(AuditEvent).limit(1))).scalar_one_or_none()
    if existing:
      print("[seed] audit_events already seeded")
      return
    for evt_data in DEMO_EVENTS:
      db.add(AuditEvent(**evt_data))

    await db.commit()
    print(f"[seed] {len(DEMO_EVENTS)} demo audit events seeded")

if __name__ == "__main__":
  asyncio.run(seed())