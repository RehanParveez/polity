from app.modules.assistant.agents import policy_analyst, budget_analyst, citizen_assistant, translation_assistant, report_generator, legislative_assistant, process_explainer
from app.modules.assistant.schemas import AIOutputContract
from typing import Callable
import time
from app.modules.assistant import ollama_client, fallback
import json

AGENT_REGISTRY: dict[str, dict] = {
  "policy_analyst": {"system_prompt": policy_analyst.SYSTEM_PROMPT, "build_prompt": policy_analyst.build_prompt,
  },
  "budget_analyst": {"system_prompt": budget_analyst.SYSTEM_PROMPT, "build_prompt": budget_analyst.build_prompt,
  },
  "citizen_assistant": {"system_prompt": citizen_assistant.SYSTEM_PROMPT, "build_prompt": citizen_assistant.build_prompt,
  },
  "translation_assistant": {"system_prompt": translation_assistant.SYSTEM_PROMPT, "build_prompt": translation_assistant.build_prompt,
  },
  "report_generator": {"system_prompt": report_generator.SYSTEM_PROMPT, "build_prompt": report_generator.build_prompt,
  },
  "legislative_assistant": {"system_prompt": legislative_assistant.SYSTEM_PROMPT, "build_prompt": legislative_assistant.build_prompt,
  },
  "simulation_explainer": {"system_prompt": process_explainer.SYSTEM_PROMPT, "build_prompt": process_explainer.build_prompt,
  },
}

class OrchestratorError(Exception):
  pass

async def run_agent(agent_name: str, build_args: dict, model: str | None = None) -> tuple[AIOutputContract, bool, int]:
  agent = AGENT_REGISTRY.get(agent_name)
  if not agent:
    raise OrchestratorError(f"unknown agent: {agent_name}")

  system = agent["system_prompt"]
  prompt_builder: Callable = agent["build_prompt"]
  user_prompt = prompt_builder(**build_args)

  start = time.perf_counter()

  try:
    raw = await ollama_client.generate_json(user_prompt, system=system, model=model)
    parsed = _parse_and_validate(raw)
    latency = int((time.perf_counter() - start) * 1000)
    return parsed, False, latency
  except (ollama_client.OllamaError, json.JSONDecodeError, OrchestratorError):
    pass

  try:
    retry_prompt = user_prompt + "\n\nIMPORTANT: Your previous response was malformed. Respond ONLY with valid JSON."
    raw = await ollama_client.generate_json(retry_prompt, system=system, model=model)
    parsed = _parse_and_validate(raw)
    latency = int((time.perf_counter() - start) * 1000)
    return parsed, False, latency
  except Exception:
    pass

  latency = int((time.perf_counter() - start) * 1000)
  language = build_args.get("language", build_args.get("target_language", "en"))
  fb = fallback.get_fallback(agent_name, language)
  return fb, True, latency

def _parse_and_validate(raw: str) -> AIOutputContract:
  cleaned = raw.strip()
  if cleaned.startswith("```json"):
    cleaned = cleaned[7:]
  if cleaned.startswith("```"):
    cleaned = cleaned[3:]
  if cleaned.endswith("```"):
    cleaned = cleaned[:-3]
  cleaned = cleaned.strip()

  data = json.loads(cleaned)
  return AIOutputContract.model_validate(data)