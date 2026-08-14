from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.assistant.models import AIRequest, AIResponse
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def create_request(db: AsyncSession, **kwargs) -> AIRequest:
  req = AIRequest(**kwargs)
  db.add(req)
  await db.flush()
  return req

async def update_request_status(db: AsyncSession, req: AIRequest, status: str, latency_ms: int | None = None, error_message: str | None = None) -> None:
  req.status = status
  if latency_ms is not None:
    req.latency_ms = latency_ms
  if error_message is not None:
    req.error_message = error_message
  await db.flush()

async def create_response(db: AsyncSession, **kwargs) -> AIResponse:
  resp = AIResponse(**kwargs)
  db.add(resp)
  await db.flush()
  return resp

async def list_requests(db: AsyncSession, user_id: uuid.UUID | None = None, limit: int = 50) -> list[AIRequest]:
  stmt = select(AIRequest).options(selectinload(AIRequest.response)).order_by(AIRequest.created_at.desc()).limit(limit)
  if user_id:
    stmt = stmt.where(AIRequest.user_id == user_id)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_request(db: AsyncSession, request_id: uuid.UUID) -> AIRequest | None:
  stmt = select(AIRequest).options(selectinload(AIRequest.response)).where(AIRequest.id == request_id)
  result = await db.execute(stmt)
  return result.scalar_one_or_none()