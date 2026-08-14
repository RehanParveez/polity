from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
import uuid
from datetime import datetime, timedelta
from collections import defaultdict
from app.modules.identity.models import User
from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.assistant.schemas import ( PolicyExplainRequest, BudgetExplainRequest, ChatRequest, TranslateRequest, ReportGenerateRequest, SimulationExplainRequest,
  AIExplainResponse, AIChatResponse, AITranslateResponse, AIReportResponse, AISimulationExplainResponse, AIRequestRead
)
from app.modules.assistant import service
from app.modules.assistant.permissions import AI_POLICY_EXPLAIN, AI_BUDGET_EXPLAIN, AI_CHAT, AI_TRANSLATE, AI_REPORT_GENERATE, AI_SIMULATION_EXPLAIN

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(get_current_user)])

_rate_limit_store: dict[uuid.UUID, list[datetime]] = defaultdict(list)

async def _rate_limit_ai(current_user: User) -> None:
 
  settings = get_settings()
  limit = settings.ai.ai_requests_per_minute
  now = datetime.now()
  window = [t for t in _rate_limit_store[current_user.id] if now - t < timedelta(minutes=1)]
  _rate_limit_store[current_user.id] = window
  if len(window) >= limit:
    raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail = "AI rate limit exceeded, try again in a minute")
  _rate_limit_store[current_user.id].append(now)

@router.post("/policy/explain", response_model=AIExplainResponse)
async def explain_policy_endpoint(payload: PolicyExplainRequest, current_user: User = Depends(require_permission(AI_POLICY_EXPLAIN)),
  db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    output, used_fallback, latency = await service.explain_policy(db, payload.policy_id, payload.query, payload.language, current_user.id)
    return AIExplainResponse(request_id=uuid.UUID(int=0), output=output, used_fallback=used_fallback, latency_ms=latency)
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/budget/explain", response_model=AIExplainResponse)
async def explain_budget_endpoint(payload: BudgetExplainRequest, current_user: User = Depends(require_permission(AI_BUDGET_EXPLAIN)),
  db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    output, used_fallback, latency = await service.explain_budget(db, payload.budget_id, payload.query, payload.language, current_user.id)
    return AIExplainResponse(request_id=uuid.UUID(int=0), output=output, used_fallback=used_fallback, latency_ms=latency)
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/chat", response_model=AIChatResponse)
async def chat_endpoint(
  payload: ChatRequest,
  current_user: User = Depends(require_permission(AI_CHAT)),
  db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    output, used_fallback, latency = await service.chat_citizen(db, payload.message, payload.language, payload.context_indicator_codes, current_user.id)
    return AIChatResponse(request_id=uuid.UUID(int=0), output=output, used_fallback=used_fallback, latency_ms=latency)
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/translate", response_model=AITranslateResponse)
async def translate_endpoint(
  payload: TranslateRequest,
  current_user: User = Depends(require_permission(AI_TRANSLATE)),
  db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    translated, used_fallback, latency = await service.translate(db, payload.text, payload.target_language, current_user.id)
    source = "ur" if payload.target_language == "en" else "en"
    return AITranslateResponse(request_id=uuid.UUID(int=0), translated_text=translated, source_language=source,
      target_language=payload.target_language, used_fallback=used_fallback, latency_ms=latency,
    )
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/report/generate", response_model=AIReportResponse)
async def generate_report_endpoint(
  payload: ReportGenerateRequest, current_user: User = Depends(require_permission(AI_REPORT_GENERATE)), db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    output, used_fallback, latency = await service.generate_report(db, payload.ministry_id, payload.report_type, payload.fiscal_year, payload.language, current_user.id)
    return AIReportResponse(request_id=uuid.UUID(int=0), output=output, used_fallback=used_fallback, latency_ms=latency)
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/simulation/explain", response_model=AISimulationExplainResponse)
async def explain_simulation_endpoint(
  payload: SimulationExplainRequest,
  current_user: User = Depends(require_permission(AI_SIMULATION_EXPLAIN)),
  db: AsyncSession = Depends(get_db),
):
  await _rate_limit_ai(current_user)
  try:
    output, used_fallback, latency = await service.explain_simulation(db, payload.run_id, payload.language, current_user.id)
    return AISimulationExplainResponse(request_id=uuid.UUID(int=0), output=output, used_fallback=used_fallback, latency_ms=latency)
  except service.AIError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.get("/history", response_model=list[AIRequestRead])
async def list_history_endpoint(limit: int = 50, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
  return await service.list_history(db, current_user.id, limit)