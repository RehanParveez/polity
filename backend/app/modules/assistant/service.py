from app.core.config import get_settings
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.assistant.schemas import AIOutputContract
from app.modules.assistant import repository
from app.modules.assistant.orchestrator import run_agent
from app.modules.policies.repository import get_policy
from app.modules.institutions.repository import get_ministry_detail
from app.modules.finance.repository import get_budget
from app.modules.process.repository import get_indicator_by_code, get_latest_indicator_value, get_run
from app.modules.assistant.models import AIRequest

settings = get_settings()

class AIError(Exception):
  pass

def _check_restricted(entity_type: str | None, entity_id: uuid.UUID | None) -> None:
  if not settings.ai.ai_restricted_records_disable_ai:
    return
  if entity_type in {"defense_procurement", "defense_budget", "military_personnel"}:
    raise AIError("AI access disabled for restricted defense records")

async def _log_and_run(db: AsyncSession, user_id: uuid.UUID, agent_name: str, prompt_text: str, entity_type: str | None,
  entity_id: uuid.UUID | None, build_args: dict,
) -> tuple[AIOutputContract, bool, int]:

  req = await repository.create_request(db, user_id=user_id, agent_name=agent_name, prompt_text=prompt_text, model_used=settings.ai.ollama_model,
    status = "pending", entity_type=entity_type, entity_id=entity_id,
  )
  await db.commit()

  try:
    output, used_fallback, latency = await run_agent(agent_name, build_args)
    status = "fallback" if used_fallback else "success"
    await repository.update_request_status(db, req, status, latency_ms=latency)
    await repository.create_response(db, request_id=req.id, raw_output=output.model_dump_json(), parsed_output=output.model_dump(), is_valid=True,
      used_fallback=used_fallback,
    )
    await db.commit()
    return output, used_fallback, latency

  except Exception as exc:
    await repository.update_request_status(db, req, "failed", error_message=str(exc))
    await db.commit()
    raise AIError(f"AI processing failed: {exc}") from exc

async def explain_policy(db: AsyncSession, policy_id: uuid.UUID, query: str | None, language: str, user_id: uuid.UUID) -> tuple[AIOutputContract, bool, int]:
 
  policy = await get_policy(db, policy_id)
  if not policy:
    raise AIError("the policy is not present")

  _check_restricted("policy", policy_id)

  build_args = {"policy_title": policy.title, "policy_description": policy.description, "policy_status": policy.status, "query": query,
    "language": language,
  }
  prompt_text = f"Explain policy: {policy.title} (status: {policy.status})"
  if query:
    prompt_text += f" | Query: {query}"

  return await _log_and_run(db, user_id, "policy_analyst", prompt_text, "policy", policy_id, build_args)

async def explain_budget(db: AsyncSession, budget_id: uuid.UUID, query: str | None, language: str, user_id: uuid.UUID) -> tuple[AIOutputContract, bool, int]:
  budget = await get_budget(db, budget_id)
  if not budget:
    raise AIError("budget is not present")

  lines = [{"category": l.category, "allocated_amount": str(l.allocated_amount), "spent_amount": str(l.spent_amount)} for l in budget.lines]
  build_args = {"ministry_name": budget.ministry.name if budget.ministry else "Unknown", "fiscal_year": budget.fiscal_year,
    "total_amount": str(budget.total_amount), "total_allocated": str(sum(l.allocated_amount for l in budget.lines)), "total_spent": str(sum(l.spent_amount for l in budget.lines)),
    "lines": lines, "query": query, "language": language,
  }
  prompt_text = f"Explain budget: {budget.fiscal_year} | Ministry: {build_args['ministry_name']}"
  return await _log_and_run(db, user_id, "budget_analyst", prompt_text, "budget", budget_id, build_args)

async def chat_citizen(db: AsyncSession, message: str, language: str, indicator_codes: list[str], user_id: uuid.UUID) -> tuple[AIOutputContract, bool, int]:
  
  indicator_context = []
  for code in indicator_codes:
    ind = await get_indicator_by_code(db, code)
    if ind:
      iv = await get_latest_indicator_value(db, code)
      indicator_context.append({"name": ind.name, "category": ind.category, "value": str(iv.value) if iv else "N/A", "unit": ind.unit,
        "as_of_date": str(iv.as_of_date) if iv else "N/A", "confidence": iv.confidence if iv else "N/A",
      })

  build_args = {"user_message": message, "indicator_context": indicator_context, "language": language}
  prompt_text = f"Citizen question: {message} | Language: {language}"
  return await _log_and_run(db, user_id, "citizen_assistant", prompt_text, None, None, build_args)

async def translate(db: AsyncSession, text: str, target_language: str, user_id: uuid.UUID) -> tuple[str, bool, int]:
  build_args = {"text": text, "target_language": target_language}
  prompt_text = f"Translate: {text[:100]}... -> {target_language}"

  output, used_fallback, latency = await _log_and_run(db, user_id, "translation_assistant", prompt_text, None, None, build_args)
  return output.summary, used_fallback, latency

async def generate_report(db: AsyncSession, ministry_id: uuid.UUID | None, report_type: str, fiscal_year: int | None, language: str, user_id: uuid.UUID) -> tuple[AIOutputContract, bool, int]:
  context_data = {"report_type": report_type, "fiscal_year": fiscal_year}
  if ministry_id:
    ministry = await get_ministry_detail(db, ministry_id)
    if ministry:
      context_data["ministry"] = ministry.name

  build_args = {"report_type": report_type, "context_data": context_data, "language": language}
  prompt_text = f"Generate {report_type} report | Language: {language}"
  return await _log_and_run(db, user_id, "report_generator", prompt_text, "report", None, build_args)

async def explain_simulation(db: AsyncSession, run_id: uuid.UUID, language: str, user_id: uuid.UUID) -> tuple[AIOutputContract, bool, int]:
  run = await get_run(db, run_id)
  if not run:
    raise AIError("the simulation run is not present")
  if run.status != "completed":
    raise AIError("the simulation run is not completed")

  scenario = run.scenario
  results = []
  for res in run.results:
    if res.indicator:
      results.append({"indicator_name": res.indicator.name, "baseline": str(res.baseline_value), "simulated": str(res.simulated_value), "change_pct": str(res.percent_change),
        "unit": res.indicator.unit,
      })

  build_args = {
    "scenario_title": scenario.title if scenario else "Unknown Scenario", "results": results, "language": language,
  }
  prompt_text = f"Explain simulation run: {run_id} | Scenario: {build_args['scenario_title']}"

  return await _log_and_run(db, user_id, "process_explainer", prompt_text, "simulation", run_id, build_args)

async def list_history(db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> list[AIRequest]:
  return await repository.list_requests(db, user_id=user_id, limit=limit)
