from decimal import Decimal
from app.core.database import AsyncSessionLocal
from app.modules.process.models import Indicator, IndicatorValue, SimulationRule, Scenario, ScenarioInput
from sqlalchemy import select
from datetime import date
from app.modules.identity.models import User
import asyncio
import app.core.model_registry

INDICATORS = [
  ("Literacy Rate", "literacy_rate", "education", "%", "Percentage of population aged 15+ that can read and write", True),
  ("Total Enrollment", "total_enrollment", "education", "students", "Combined enrollment across all education levels", True),
  ("Teacher Count", "teacher_count", "education", "teachers", "Total number of teaching staff", True),
  
  ("Hospital Bed Count", "bed_count", "health", "beds", "Total hospital beds nationwide", True),
  ("Healthcare Staff", "staff_count", "health", "staff", "Total doctors, nurses, and allied health professionals", True),
  ("Daily Patient Capacity", "patient_capacity", "health", "patients/day", "Maximum patients that can be served daily", True),
  
  ("Road Condition Index", "road_condition_index", "infrastructure", "index (0-100)", "Composite score of major road conditions", True),
  ("Connectivity Score", "connectivity_score", "infrastructure", "index (0-100)", "Measure of district-to-district transport connectivity", True),
  ("Travel Time Reduction", "travel_time_reduction_pct", "infrastructure", "%", "Percentage reduction in average inter-city travel time", True),
 
  ("Yield per Hectare", "yield_per_hectare", "agriculture", "tons/ha", "Average crop yield across all major crops", True),
  ("Farm Productivity Index", "farm_productivity_index", "agriculture", "index (0-100)", "Composite measure of agricultural output efficiency", True),
  ("Water Efficiency Score", "water_efficiency_score", "agriculture", "index (0-100)", "Measure of irrigation water use efficiency", True),
  
  ("Unemployment Rate", "unemployment_rate", "labor", "%", "Percentage of labor force without work", False), 
  ("Employed Count", "employed_count", "labor", "workers", "Total number of employed persons", True),
  ("Workforce Participation", "workforce_participation", "labor", "%", "Percentage of working-age population in the labor force", True),
]

BASELINE_VALUES = {
  "literacy_rate": Decimal("62.80"),
  "total_enrollment": Decimal("42000000.00"),
  "teacher_count": Decimal("1850000.00"),
  "bed_count": Decimal("145000.00"),
  "staff_count": Decimal("280000.00"),
  "patient_capacity": Decimal("450000.00"),
  "road_condition_index": Decimal("58.50"),
  "connectivity_score": Decimal("44.20"),
  "travel_time_reduction_pct": Decimal("12.50"),
  "yield_per_hectare": Decimal("2.85"),
  "farm_productivity_index": Decimal("52.00"),
  "water_efficiency_score": Decimal("38.00"),
  "unemployment_rate": Decimal("8.50"),
  "employed_count": Decimal("67500000.00"),
  "workforce_participation": Decimal("44.50"),
}

RULES = [
  {
    "rule_name": "education_investment",
    "description": "Models the impact of education budget increases and teacher training on literacy, enrollment, and teacher supply.",
    "version": 1,
    "is_active": True,
    "rule_config": {
      "literacy_elasticity_per_10pct_budget": 0.30,
      "literacy_elasticity_per_100hrs_training": 0.05,
      "enrollment_elasticity_per_10pct_budget": 0.20,
      "teacher_elasticity_per_10pct_budget": 0.15,
      "teacher_elasticity_per_100hrs_training": 0.005,
      "max_literacy_cap": 100.0,
    },
    "affected_indicator_codes": ["literacy_rate", "total_enrollment", "teacher_count"],
  },
  {
    "rule_name": "health_expansion",
    "description": "Models hospital bed expansion, staff hiring, and capacity growth from budget increases and physical infrastructure additions.",
    "version": 1,
    "is_active": True,
    "rule_config": {
      "beds_per_budget_pct": 0.10,
      "staff_per_new_bed": 0.40,
      "capacity_per_new_bed": 1.20,
      "staff_budget_elasticity": 0.08,
      "capacity_budget_elasticity": 0.05,
    },
    "affected_indicator_codes": ["bed_count", "staff_count", "patient_capacity"],
  },
  {
    "rule_name": "infrastructure_build",
    "description": "Models road investment impacts on road quality, connectivity, and travel time reduction.",
    "version": 1,
    "is_active": True,
    "rule_config": {
      "road_index_per_billion": 2.0,
      "connectivity_per_billion": 1.5,
      "travel_reduction_per_billion": 0.8,
      "max_road_index": 100.0,
      "max_connectivity": 100.0,
    },
    "affected_indicator_codes": ["road_condition_index", "connectivity_score", "travel_time_reduction_pct"],
  },
  {
    "rule_name": "agriculture_modernization",
    "description": "Models drip irrigation adoption and subsidy impacts on yield, productivity, and water efficiency.",
    "version": 1,
    "is_active": True,
    "rule_config": {
      "yield_elasticity_per_1000ha_drip": 0.05,
      "yield_subsidy_coeff": 0.50,
      "productivity_per_billion_subsidy": 3.0,
      "productivity_per_1000ha_drip": 1.5,
      "water_eff_per_1000ha_drip": 2.0,
      "water_eff_subsidy_coeff": 0.8,
    },
    "affected_indicator_codes": ["yield_per_hectare", "farm_productivity_index", "water_efficiency_score"],
  },
  {
    "rule_name": "labor_reform",
    "description": "Models minimum wage increases and job creation targets on unemployment, employment, and participation.",
    "version": 1,
    "is_active": True,
    "rule_config": {
      "unemployment_reduction_per_1000_jobs": 0.50,
      "unemployment_increase_per_10pct_wage": 0.20,
      "participation_per_1000_jobs": 0.30,
    },
    "affected_indicator_codes": ["unemployment_rate", "employed_count", "workforce_participation"],
  },
]

SCENARIOS = [
  {
    "title": "Education Surge — 25% Budget Increase + Teacher Training",
    "description": "Aggressive education investment scenario: 25% budget increase and 500 hours of teacher training per educator.",
    "inputs": [
      ("education_investment", "budget_increase_pct", "25"),
      ("education_investment", "teacher_training_hours", "500"),
    ],
  },
  {
    "title": "Health & Infrastructure Combo",
    "description": "Dual investment in health expansion (15% budget + 5,000 new beds) and road infrastructure (PKR 120 billion).",
    "inputs": [
      ("health_expansion", "budget_increase_pct", "15"),
      ("health_expansion", "new_beds_target", "5000"),
      ("infrastructure_build", "road_investment_billion_pkr", "120"),
    ],
  },
  {
    "title": "Agriculture Modernization — Drip + Subsidy",
    "description": "Large-scale drip irrigation rollout (50,000 hectares) with PKR 45 billion in farmer subsidies.",
    "inputs": [
      ("agriculture_modernization", "drip_irrigation_hectares", "50000"),
      ("agriculture_modernization", "subsidy_budget_billion_pkr", "45"),
    ],
  },
]

async def seed() -> None:
  async with AsyncSessionLocal() as db:
    indicator_by_code: dict[str, Indicator] = {}
    for name, code, category, unit, description, is_higher in INDICATORS:
      existing = (await db.execute(select(Indicator).where(Indicator.code == code))).scalar_one_or_none()
      if not existing:
        existing = Indicator(
          name=name, code=code, category=category, unit=unit,
          description=description, is_higher_better=is_higher,
        )
        db.add(existing)
        await db.flush()
      indicator_by_code[code] = existing
      
    for code, value in BASELINE_VALUES.items():
      ind = indicator_by_code.get(code)
      if not ind:
        continue
      existing = (
        await db.execute(
          select(IndicatorValue).where(IndicatorValue.indicator_id == ind.id, IndicatorValue.district_id.is_(None), IndicatorValue.as_of_date == date(2026, 1, 1),
          )
        )
      ).scalar_one_or_none()
      if not existing:
        db.add(IndicatorValue(indicator_id=ind.id, district_id=None, value=value, as_of_date=date(2026, 1, 1), source = "synthetic, illustrative only",
          confidence = "low",
        ))

    for r in RULES:
      existing = (await db.execute(select(SimulationRule).where(SimulationRule.rule_name == r["rule_name"]))).scalar_one_or_none()
      if not existing:
        db.add(SimulationRule(**r))
        
    creator = (await db.execute(select(User).order_by(User.created_at))).scalars().first()
    creator_id = creator.id if creator else None

    for s in SCENARIOS:
      existing = (await db.execute(select(Scenario).where(Scenario.title == s["title"]))).scalar_one_or_none()
      if existing:
        continue

      scenario = Scenario(
        title=s["title"],
        description=s["description"],
        owner_id=creator_id,
        status="ready",
        visibility="shared",
        created_by=creator_id,
        updated_by=creator_id,
      )
      db.add(scenario)
      await db.flush()

      for rule_name, param_name, param_value in s["inputs"]:
        db.add(ScenarioInput(scenario_id=scenario.id, rule_name=rule_name, parameter_name=param_name, parameter_value=param_value,
        ))

    await db.commit()
    print(f"[seed] {len(INDICATORS)} indicators, {len(BASELINE_VALUES)} baselines, {len(RULES)} rules, {len(SCENARIOS)} demo scenarios seeded")

if __name__ == "__main__":
  asyncio.run(seed())