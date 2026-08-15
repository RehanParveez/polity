from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import  date
from app.modules.policies import repository
from app.modules.policies.models import Policy, PolicyApproval
from app.modules.policies.schemas import (PolicyCreate, PolicyUpdate, PolicyReviewCreate, PolicyApprovalCreate, PolicyApprovalDecide, PolicyIndicatorCreate,
  PolicyIndicatorUpdate, PolicyImplementationCreate, PolicyImplementationUpdate, PolicyEvaluationCreate,
)
from app.core.audit import AuditService, serialize_model

class PolicyError(Exception):
  pass

VALID_STATUSES = {
  "draft", "under_review", "revisions_requested",
  "approved", "implemented", "evaluated", "closed", "rejected",
}

TERMINAL_STATUSES = {"closed", "rejected"}

ALLOWED_TRANSITIONS = {
  "draft": {"under_review"},
  "under_review": {"revisions_requested", "approved", "rejected"},
  "revisions_requested": {"under_review", "rejected"},
  "approved": {"implemented", "rejected"},
  "implemented": {"evaluated"},
  "evaluated": {"closed"},
  "closed": set(),
  "rejected": set(),
}

APPROVAL_PIPELINE = [
  (1, "Ministry Review"),
  (2, "Cabinet Review"),
  (3, "Parliamentary Review"),
]

async def create_policy(db: AsyncSession, payload: PolicyCreate, created_by: uuid.UUID) -> Policy:
  data = payload.model_dump(exclude_unset=True)
  data.update({
    "status": "draft",
    "current_approval_step": 0,
    "version": 1,
    "created_by": created_by,
    "updated_by": created_by,
    "source": "synthetic — illustrative only",
    "as_of_date": date.today(),
    "confidence": "low",
  })
  policy = await repository.create_policy(db, **data)
  await AuditService.log(db, entity_type = "policy", entity_id=policy.id, action = "create", actor_id=created_by,
    after_state={"id": str(policy.id), "title": policy.title, "status": policy.status,
      "ministry_id": str(policy.ministry_id) if policy.ministry_id else None,
    },
      module = "policies",
    )
  await db.commit()
  await db.refresh(policy)
  return policy

async def get_policy_detail(db: AsyncSession, policy_id: uuid.UUID) -> Policy | None:
  return await repository.get_policy(db, policy_id)

async def update_policy_draft(db: AsyncSession, policy: Policy, payload: PolicyUpdate, updated_by: uuid.UUID) -> Policy:
  if policy.status not in {"draft", "revisions_requested"}:
    raise PolicyError("policy can only be edited in draft or revisions_requested state")

  before_state = {"id": str(policy.id), "title": policy.title, "description": policy.description, "status": policy.status,
    "ministry_id": str(policy.ministry_id) if policy.ministry_id else None,
  }
  data = payload.model_dump(exclude_unset=True)
  data["updated_by"] = updated_by
  await repository.update_policy(db, policy, **data)
  
  after_state = {"id": str(policy.id), "title": policy.title, "description": policy.description, "status": policy.status,
    "ministry_id": str(policy.ministry_id) if policy.ministry_id else None,
  }

  await AuditService.log(db, entity_type = "policy", entity_id=policy.id, action = "update", actor_id=updated_by,
    before_state=before_state, after_state=after_state, module = "policies",
  )
  await db.commit()
  await db.refresh(policy)
  return policy

async def delete_policy(db: AsyncSession, policy: Policy) -> None:
  if policy.status not in {"draft", "rejected"}:
    raise PolicyError("only draft or rejected policies can be deleted")

  before_state = {"id": str(policy.id), "title": policy.title, "description": policy.description, "status": policy.status,
    "ministry_id": str(policy.ministry_id) if policy.ministry_id else None,
  }
  await AuditService.log(db, entity_type = "policy",
    entity_id=policy.id, action = "delete", before_state=before_state, module = "policies",
  )
  await repository.delete_policy(db, policy)
  await db.commit()

async def transition_status(db: AsyncSession, policy: Policy, new_status: str, user_id: uuid.UUID, comment: str | None = None,
) -> Policy:
  if new_status not in VALID_STATUSES:
    raise PolicyError(f"invalid status: {new_status}")
  if policy.status in TERMINAL_STATUSES:
    raise PolicyError("terminal status — no further transitions allowed")
  if new_status not in ALLOWED_TRANSITIONS.get(policy.status, set()):
    raise PolicyError(f"cannot transition from {policy.status} to {new_status}")

  if new_status == "under_review" and policy.status in {"draft", "revisions_requested"}:
    existing_steps = await repository.get_approval_steps(db, policy.id)
    if not existing_steps:
      for step_num, step_name in APPROVAL_PIPELINE:
        await repository.add_approval_step(db, policy.id, approval_step=step_num, step_name=step_name)
  
  before_state = {"status": policy.status, "current_approval_step": policy.current_approval_step,
   }
  
  policy.status = new_status
  policy.updated_by = user_id
  if new_status == "approved":
    policy.current_approval_step = len(APPROVAL_PIPELINE)
    
  await db.flush()
  after_state = {"status": policy.status, "current_approval_step": policy.current_approval_step,
  }
  await AuditService.log(db, entity_type = "policy", entity_id=policy.id, action = "transition", actor_id=user_id,
    before_state=before_state, after_state=after_state, event_metadata={
      "comment": comment, "from_status": before_state["status"], "to_status": new_status,
    },
    module = "policies",
   )
  await db.commit()
  await db.refresh(policy)
  return policy

async def submit_review(db: AsyncSession, policy: Policy, payload: PolicyReviewCreate, reviewer_id: uuid.UUID,
) -> None:
  if policy.status not in {"under_review", "revisions_requested"}:
    raise PolicyError("reviews can only be submitted when policy is under review")
  data = payload.model_dump(exclude_unset=True)
  data["reviewer_id"] = reviewer_id
  await repository.add_review(db, policy.id, **data)
  await db.commit()

async def add_custom_approval_step(db: AsyncSession, policy: Policy, payload: PolicyApprovalCreate, added_by: uuid.UUID,
) -> None:
  if policy.status != "draft":
    raise PolicyError("approval steps can only be added to draft policies")
  data = payload.model_dump(exclude_unset=True)
  
  step = await repository.add_approval_step(db, policy.id, **data,
  )
  await AuditService.log(db, entity_type = "policy_approval", entity_id=step.id, action = "create",
    actor_id=added_by, after_state=serialize_model(step), module = "policies",
  )
  await db.commit()
  return step

async def decide_approval_step(db: AsyncSession, policy: Policy, step: PolicyApproval, payload: PolicyApprovalDecide, approver_id: uuid.UUID,
) -> Policy:
  if policy.status not in {"under_review", "revisions_requested"}:
    raise PolicyError("approvals can only be decided while policy is under review")
  if step.status != "pending":
    raise PolicyError("this step has already been decided")

  prior_steps = [s for s in policy.approvals if s.approval_step < step.approval_step]
  for prior in prior_steps:
    if prior.status != "approved":
      raise PolicyError(f"step {prior.approval_step} must be approved first")

  data = payload.model_dump(exclude_unset=True)
  await repository.decide_approval(db, step, approver_id, data["status"], data.get("comments"))

  if data["status"] == "rejected":
    policy.status = "rejected"
    policy.updated_by = approver_id
    await db.flush()
    await db.commit()
    await db.refresh(policy)
    return policy

  remaining_pending = [s for s in policy.approvals if s.status == "pending" and s.id != step.id]
  if not remaining_pending:
    policy.status = "approved"
    policy.current_approval_step = len(policy.approvals)
  else:
    policy.current_approval_step = step.approval_step

  policy.updated_by = approver_id
  await db.flush()
  await db.commit()
  await db.refresh(policy)
  return policy

async def create_indicator(db: AsyncSession, policy: Policy, payload: PolicyIndicatorCreate) -> None:
  if policy.status in TERMINAL_STATUSES:
    raise PolicyError("cannot add indicators to terminal policies")
  data = payload.model_dump(exclude_unset=True)
  await repository.add_indicator(db, policy.id, **data)
  await db.commit()

async def update_indicator(db: AsyncSession, indicator_id: uuid.UUID, payload: PolicyIndicatorUpdate) -> None:
  indicator = await repository.get_indicator(db, indicator_id)
  if not indicator:
    raise PolicyError("the indicator is not present")
  data = payload.model_dump(exclude_unset=True)
  await repository.update_indicator(db, indicator, **data)
  await db.commit()

async def create_implementation(db: AsyncSession, policy: Policy, payload: PolicyImplementationCreate) -> None:
  if policy.status not in {"approved", "implemented"}:
    raise PolicyError("implementation milestones can only be added to approved or implemented policies")
  data = payload.model_dump(exclude_unset=True)
  await repository.add_implementation(db, policy.id, **data)
  await db.commit()

async def update_implementation(db: AsyncSession, impl_id: uuid.UUID, payload: PolicyImplementationUpdate) -> None:
  impl = await repository.get_implementation(db, impl_id)
  if not impl:
    raise PolicyError("implementation milestone not found")
  data = payload.model_dump(exclude_unset=True)
  await repository.update_implementation(db, impl, **data)
  await db.commit()

async def create_evaluation(db: AsyncSession, policy: Policy, payload: PolicyEvaluationCreate, evaluator_id: uuid.UUID) -> None:
  if policy.status != "implemented":
    raise PolicyError("evaluations can only be created for implemented policies")
  data = payload.model_dump(exclude_unset=True)
  data["evaluator_id"] = evaluator_id
  await repository.add_evaluation(db, policy.id, **data)
  await db.commit()