import app.core.model_registry
from app.core.database import AsyncSessionLocal
from app.modules.authorization.models import Permission, Role, RolePermission
import asyncio
from sqlalchemy import select

SEED_PERMISSIONS = [
  ("identity.user.manage", "Create, update, deactivate user accounts"),
  ("authorization.role.manage", "Assign roles and permissions"),
  ("institution.manage", "Manage ministries, departments, and institution membership"),
  ("election.manage", "Create elections and record votes"),
  ("government.manage", "Form governments and assign cabinet members"),
]

SEED_ROLES = [
  ("superadmin", "Full system access", [c for c, _ in SEED_PERMISSIONS]),
  ("ministry_secretary", "Ministry administrative access", ["institution.manage"]),
  ("election_officer", "Election management", ["election.manage"]),
  ("citizen", "General citizen access", []),
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    perm_by_code = {}
    for code, description in SEED_PERMISSIONS:
      existing = (await db.execute(select(Permission).where(Permission.code == code))
      ).scalar_one_or_none()
      if not existing:
        existing = Permission(code=code, description=description)
        db.add(existing)
        await db.flush()
      perm_by_code[code] = existing

    for name, description, codes in SEED_ROLES:
      role = (await db.execute(select(Role).where(Role.name == name))
      ).scalar_one_or_none()
      if not role:
        role = Role(name=name, description=description)
        db.add(role)
        await db.flush()
      for code in codes:
        link = (
          await db.execute(
            select(RolePermission).where(RolePermission.role_id == role.id, RolePermission.permission_id == perm_by_code[code].id,)
          )
        ).scalar_one_or_none()
        if not link:
          db.add(RolePermission(
            role_id=role.id, permission_id=perm_by_code[code].id
            )
          )

    await db.commit()
    print("[seed] roles/permissions seeded")


if __name__ == "__main__":
  asyncio.run(seed())