import httpx
from app.core.config import get_settings
settings = get_settings()

class OllamaError(Exception):
  pass

async def generate_json(prompt: str, system: str | None = None, model: str | None = None, timeout: float = 120.0) -> str:
  model = model or settings.ai.ollama_model
  url = f"{settings.ai.ollama_base_url}/api/generate"

  payload = {"model": model, "prompt": prompt, "stream": False, "format": "json",
  }
  if system:
    payload["system"] = system
  try:
    async with httpx.AsyncClient(timeout=timeout) as client:
      response = await client.post(url, json=payload)
      response.raise_for_status()
      data = response.json()
      return data.get("response", "")
  except httpx.HTTPStatusError as exc:
    raise OllamaError(f"Ollama HTTP {exc.response.status_code}: {exc.response.text}") from exc
  except httpx.ConnectError as exc:
    raise OllamaError("Ollama unreachable, is the container running?") from exc
  except Exception as exc:
    raise OllamaError(f"Ollama request failed: {exc}") from exc