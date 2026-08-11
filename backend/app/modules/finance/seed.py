from decimal import Decimal
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.modules.finance.models import RevenueSource, AuditFinding, Budget, BudgetLine, ProcurementProject
from app.modules.institutions.models import Ministry
from datetime import date
import app.core.model_registry 
import asyncio

REVENUE = [
  ("Federal Tax Revenue", "tax", Decimal("850000000000.00"), 2026, "synthetic — illustrative"),
  ("Provincial Grants", "grant", Decimal("320000000000.00"), 2026, "synthetic — illustrative"),
  ("Foreign Aid & Loans", "loan", Decimal("180000000000.00"), 2026, "synthetic — illustrative"),
  ("State Enterprise Dividends", "dividend", Decimal("95000000000.00"), 2026, "synthetic — illustrative"),
]

BUDGETS = [
  ("FIN", 2026, Decimal("245000000000.00"), "approved", "Federal budget for fiscal year 2025-26"),
  ("EDU", 2026, Decimal("180000000000.00"), "approved", "Education sector allocation"),
  ("HLTH", 2026, Decimal("210000000000.00"), "active", "Healthcare and public health programs"),
  ("DEF", 2026, Decimal("320000000000.00"), "approved", "Defense administration and procurement"),
  ("INFRA", 2026, Decimal("150000000000.00"), "draft", "Roads, energy, and urban development"),
]

BUDGET_LINES = {
  "FIN": [
    ("Debt Servicing", Decimal("95000000000.00"), Decimal("42000000000.00")),
    ("Federal Salaries", Decimal("38000000000.00"), Decimal("19000000000.00")),
    ("Development Grants", Decimal("62000000000.00"), Decimal("15000000000.00")),
    ("Social Safety", Decimal("50000000000.00"), Decimal("22000000000.00")),
  ],
  "EDU": [
    ("Primary Education", Decimal("72000000000.00"), Decimal("28000000000.00")),
    ("Higher Education", Decimal("58000000000.00"), Decimal("31000000000.00")),
    ("Curriculum & Standards", Decimal("28000000000.00"), Decimal("9000000000.00")),
    ("Teacher Training", Decimal("22000000000.00"), Decimal("11000000000.00")),
  ],
  "HLTH": [
    ("Hospital Operations", Decimal("85000000000.00"), Decimal("41000000000.00")),
    ("Vaccination Programs", Decimal("42000000000.00"), Decimal("38000000000.00")),
    ("Disease Surveillance", Decimal("48000000000.00"), Decimal("15000000000.00")),
    ("Rural Clinics", Decimal("35000000000.00"), Decimal("12000000000.00")),
  ],
  "DEF": [
    ("Personnel & Pensions", Decimal("140000000000.00"), Decimal("68000000000.00")),
    ("Equipment Maintenance", Decimal("95000000000.00"), Decimal("32000000000.00")),
    ("Training & Exercises", Decimal("45000000000.00"), Decimal("18000000000.00")),
    ("Infrastructure", Decimal("40000000000.00"), Decimal("9000000000.00")),
  ],
}

PROCUREMENT = [
  ("FIN", "National Highway Expansion — Phase 3", Decimal("28000000000.00"), "awarded", "China Road & Bridge Corp"),
  ("EDU", "Public School Digitalization", Decimal("15000000000.00"), "tendered", None),
  ("HLTH", "Vaccine Cold Chain Logistics", Decimal("8200000000.00"), "completed", "UPS Healthcare"),
  ("DEF", "Naval Patrol Vessel Overhaul", Decimal("12000000000.00"), "planned", None),
  ("INFRA", "Solar Grid — Balochistan", Decimal("22000000000.00"), "tendered", None),
  ("AGR", "Irrigation Modernization", Decimal("18000000000.00"), "awarded", "Descon Engineering"),
]

AUDITS = [
  ("budget", None, "medium", "Variance detected in development grants utilization — 18% underspend flagged.", "open"),
  ("procurement", None, "high", "Single-bidder concentration in highway contracts exceeds threshold.", "open"),
]


async def seed() -> None:
  async with AsyncSessionLocal() as db:
    for name, category, amount, year, source in REVENUE:
      existing = (await db.execute(select(RevenueSource).where(RevenueSource.name == name, RevenueSource.fiscal_year == year))).scalar_one_or_none()
      if not existing:
        db.add(RevenueSource(name=name, category=category, amount=amount, fiscal_year=year, source=source, as_of_date=date(2026, 1, 1), confidence="low"))

    ministry_by_code: dict[str, Ministry] = {}
    for code, _, _, _, _ in BUDGETS:
      ministry = (await db.execute(select(Ministry).where(Ministry.code == code))).scalar_one_or_none()
      if ministry:
        ministry_by_code[code] = ministry

    budget_by_code: dict[str, Budget] = {}
    for code, year, total, status, desc in BUDGETS:
      ministry = ministry_by_code.get(code)
      if not ministry:
        continue
      existing = (await db.execute(select(Budget).where(Budget.ministry_id == ministry.id, Budget.fiscal_year == year))).scalar_one_or_none()
      if not existing:
        existing = Budget(ministry_id=ministry.id, fiscal_year=year, total_amount=total, status=status, description=desc)
        db.add(existing)
        await db.flush()
      budget_by_code[code] = existing

    for code, lines in BUDGET_LINES.items():
      budget = budget_by_code.get(code)
      if not budget:
        continue
      for category, allocated, spent in lines:
        existing = (await db.execute(select(BudgetLine).where(BudgetLine.budget_id == budget.id, BudgetLine.category == category))).scalar_one_or_none()
        if not existing:
          db.add(BudgetLine(budget_id=budget.id, category=category, allocated_amount=allocated, spent_amount=spent))

    for code, title, estimate, status, vendor in PROCUREMENT:
      ministry = ministry_by_code.get(code)
      if not ministry:
        continue
      existing = (await db.execute(select(ProcurementProject).where(ProcurementProject.title == title))).scalar_one_or_none()
      if not existing:
        db.add(ProcurementProject(ministry_id=ministry.id, title=title, budget_estimate=estimate, status=status, vendor_name=vendor))

    for entity_type, entity_id, severity, description, status in AUDITS:
      existing = (await db.execute(select(AuditFinding).where(AuditFinding.description == description))).scalar_one_or_none()
      if not existing:
        db.add(AuditFinding(entity_type=entity_type, entity_id=entity_id or budget_by_code.get("FIN").id, severity=severity, description=description, status=status))

    await db.commit()
    print("[seed] finance seeded")


if __name__ == "__main__":
  asyncio.run(seed())