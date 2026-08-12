from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.policies.models import Policy, PolicyReview, PolicyApproval, PolicyIndicator, PolicyImplementation, PolicyEvaluation
from sqlalchemy import select
import uuid
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

async def list_policies(db: AsyncSession, status: str | None = None, ministry_id: uuid.UUID | None = None) -> list[Policy]:
  stmt = select(Policy).order_by(Policy.created_at.desc())
  if status:
    stmt = stmt.where(Policy.status == status)
  if ministry_id:
    stmt = stmt.where(Policy.ministry_id == ministry_id)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_policy(db: AsyncSession, policy_id: uuid.UUID) -> Policy | None:
  stmt = (
    select(Policy)
    .options(
      selectinload(Policy.reviews).selectinload(PolicyReview.reviewer),
      selectinload(Policy.approvals).selectinload(PolicyApproval.approver),
      selectinload(Policy.indicators),
      selectinload(Policy.implementations),
      selectinload(Policy.evaluations).selectinload(PolicyEvaluation.evaluator),
      selectinload(Policy.ministry),
    )
    .where(Policy.id == policy_id)
  )
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def create_policy(db: AsyncSession, **kwargs) -> Policy:
  policy = Policy(**kwargs)
  db.add(policy)
  await db.flush()
  return policy

async def update_policy(db: AsyncSession, policy: Policy, **kwargs) -> None:
  for key, value in kwargs.items():
    if value is not None and hasattr(policy, key):
      setattr(policy, key, value)
  policy.version += 1
  await db.flush()

async def delete_policy(db: AsyncSession, policy: Policy) -> None:
  await db.delete(policy)
  await db.flush()

async def add_review(db: AsyncSession, policy_id: uuid.UUID, **kwargs) -> PolicyReview:
  review = PolicyReview(policy_id=policy_id, **kwargs)
  db.add(review)
  await db.flush()
  return review

async def get_reviews_for_policy(db: AsyncSession, policy_id: uuid.UUID) -> list[PolicyReview]:
  result = await db.execute(
    select(PolicyReview).where(PolicyReview.policy_id == policy_id).order_by(PolicyReview.review_round.desc())
  )
  return list(result.scalars().all())

async def add_approval_step(db: AsyncSession, policy_id: uuid.UUID, **kwargs) -> PolicyApproval:
  step = PolicyApproval(policy_id=policy_id, **kwargs)
  db.add(step)
  await db.flush()
  return step

async def get_approval_steps(db: AsyncSession, policy_id: uuid.UUID) -> list[PolicyApproval]:
  result = await db.execute(select(PolicyApproval).where(PolicyApproval.policy_id == policy_id).order_by(PolicyApproval.approval_step))
  return list(result.scalars().all())

async def get_approval_step(db: AsyncSession, step_id: uuid.UUID) -> PolicyApproval | None:
  result = await db.execute(select(PolicyApproval).where(PolicyApproval.id == step_id))
  return result.scalar_one_or_none()

async def decide_approval(db: AsyncSession, step: PolicyApproval, approver_id: uuid.UUID, status: str, comments: str | None) -> None:
  step.approver_id = approver_id
  step.status = status
  step.comments = comments
  step.decided_at = datetime.now(timezone.utc)
  await db.flush()

async def add_indicator(db: AsyncSession, policy_id: uuid.UUID, **kwargs) -> PolicyIndicator:
  ind = PolicyIndicator(policy_id=policy_id, **kwargs)
  db.add(ind)
  await db.flush()
  return ind

async def get_indicator(db: AsyncSession, indicator_id: uuid.UUID) -> PolicyIndicator | None:
  result = await db.execute(select(PolicyIndicator).where(PolicyIndicator.id == indicator_id))
  return result.scalar_one_or_none()


async def update_indicator(db: AsyncSession, indicator: PolicyIndicator, **kwargs) -> None:
  for key, value in kwargs.items():
    if value is not None and hasattr(indicator, key):
      setattr(indicator, key, value)
  await db.flush()

async def add_implementation(db: AsyncSession, policy_id: uuid.UUID, **kwargs) -> PolicyImplementation:
  impl = PolicyImplementation(policy_id=policy_id, **kwargs)
  db.add(impl)
  await db.flush()
  return impl

async def get_implementation(db: AsyncSession, impl_id: uuid.UUID) -> PolicyImplementation | None:
  result = await db.execute(select(PolicyImplementation).where(PolicyImplementation.id == impl_id))
  return result.scalar_one_or_none()

async def update_implementation(db: AsyncSession, impl: PolicyImplementation, **kwargs) -> None:
  for key, value in kwargs.items():
    if value is not None and hasattr(impl, key):
      setattr(impl, key, value)
  await db.flush()

async def add_evaluation(db: AsyncSession, policy_id: uuid.UUID, **kwargs) -> PolicyEvaluation:
  ev = PolicyEvaluation(policy_id=policy_id, **kwargs)
  db.add(ev)
  await db.flush()
  return ev

async def get_evaluation(db: AsyncSession, eval_id: uuid.UUID) -> PolicyEvaluation | None:
  result = await db.execute(select(PolicyEvaluation).where(PolicyEvaluation.id == eval_id))
  return result.scalar_one_or_none()