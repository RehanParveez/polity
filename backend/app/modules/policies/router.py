from fastapi import APIRouter, Depends, HTTPException, status
from app.shared.dependencies import get_current_user, require_permission
from app.modules.policies.schemas import (PolicyListRead, PolicyCreate, PolicyDetailRead, PolicyRead, PolicyReviewCreate, PolicyReviewRead, PolicyApprovalCreate, PolicyApprovalDecide, PolicyApprovalRead,
  PolicyIndicatorCreate, PolicyIndicatorRead, PolicyIndicatorUpdate, PolicyImplementationCreate, PolicyImplementationRead, PolicyImplementationUpdate,
  PolicyEvaluationCreate, PolicyEvaluationRead, PolicyStatusTransition, PolicyUpdate,
)
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.policies import repository, service
from app.modules.identity.models import User
from app.modules.policies.permissions import POLICY_CREATE, POLICY_REVIEW, POLICY_APPROVE, POLICY_IMPLEMENT, POLICY_EVALUATE, POLICY_MANAGE

router = APIRouter(prefix="/policies", tags=["policies"], dependencies=[Depends(get_current_user)])

@router.get("", response_model=list[PolicyListRead])
async def list_policies_endpoint(
  status: str | None = None,
  ministry_id: uuid.UUID | None = None,
  db: AsyncSession = Depends(get_db),
):
  return await repository.list_policies(db, status=status, ministry_id=ministry_id)

@router.post("", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
async def create_policy_endpoint(
  payload: PolicyCreate,
  current_user: User = Depends(require_permission(POLICY_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  return await service.create_policy(db, payload, current_user.id)

@router.get("/{policy_id}", response_model=PolicyDetailRead)
async def get_policy_endpoint(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  return policy

@router.patch("/{policy_id}", response_model=PolicyRead)
async def update_policy_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyUpdate,
  current_user: User = Depends(require_permission(POLICY_CREATE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    return await service.update_policy_draft(db, policy, payload, current_user.id)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy_endpoint(
  policy_id: uuid.UUID,
  current_user: User = Depends(require_permission(POLICY_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    await service.delete_policy(db, policy)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/{policy_id}/transition", response_model=PolicyRead)
async def transition_policy_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyStatusTransition,
  current_user: User = Depends(require_permission(POLICY_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    return await service.transition_status(db, policy, payload.new_status, current_user.id, payload.comment)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/{policy_id}/reviews", response_model=PolicyReviewRead, status_code=status.HTTP_201_CREATED)
async def submit_review_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyReviewCreate,
  current_user: User = Depends(require_permission(POLICY_REVIEW)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    await service.submit_review(db, policy, payload, current_user.id)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  reviews = await repository.get_reviews_for_policy(db, policy_id)
  return reviews[0] if reviews else None

@router.get("/{policy_id}/reviews", response_model=list[PolicyReviewRead])
async def list_reviews_endpoint(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  return await repository.get_reviews_for_policy(db, policy_id)

@router.post("/{policy_id}/approval-steps", response_model=PolicyApprovalRead, status_code=status.HTTP_201_CREATED)
async def add_approval_step_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyApprovalCreate,
  current_user: User = Depends(require_permission(POLICY_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    return await repository.add_approval_step(db, policy_id, **payload.model_dump(exclude_unset=True))
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.get("/{policy_id}/approvals", response_model=list[PolicyApprovalRead])
async def list_approvals_endpoint(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  return await repository.get_approval_steps(db, policy_id)

@router.post("/{policy_id}/approvals/{step_id}/decide", response_model=PolicyRead)
async def decide_approval_endpoint(policy_id: uuid.UUID, step_id: uuid.UUID, payload: PolicyApprovalDecide, current_user: User = Depends(require_permission(POLICY_APPROVE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  step = await repository.get_approval_step(db, step_id)
  if not step or step.policy_id != policy_id:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the approval step is not present")
  try:
    return await service.decide_approval_step(db, policy, step, payload, current_user.id)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

@router.post("/{policy_id}/indicators", response_model=PolicyIndicatorRead, status_code=status.HTTP_201_CREATED)
async def create_indicator_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyIndicatorCreate,
  current_user: User = Depends(require_permission(POLICY_MANAGE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    await service.create_indicator(db, policy, payload)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  return policy.indicators[-1] if policy.indicators else None

@router.patch("/{policy_id}/indicators/{indicator_id}", response_model=PolicyIndicatorRead)
async def update_indicator_endpoint(policy_id: uuid.UUID, indicator_id: uuid.UUID, payload: PolicyIndicatorUpdate,
  current_user: User = Depends(require_permission(POLICY_MANAGE)), db: AsyncSession = Depends(get_db),
):
  try:
    await service.update_indicator(db, indicator_id, payload)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  indicator = await repository.get_indicator(db, indicator_id)
  return indicator

@router.post("/{policy_id}/implementations", response_model=PolicyImplementationRead, status_code=status.HTTP_201_CREATED)
async def create_implementation_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyImplementationCreate,
  current_user: User = Depends(require_permission(POLICY_IMPLEMENT)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail ="the policy is not present")
  try:
    await service.create_implementation(db, policy, payload)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  return policy.implementations[-1] if policy.implementations else None

@router.patch("/{policy_id}/implementations/{impl_id}", response_model=PolicyImplementationRead)
async def update_implementation_endpoint(
  policy_id: uuid.UUID,
  impl_id: uuid.UUID,
  payload: PolicyImplementationUpdate,
  current_user: User = Depends(require_permission(POLICY_IMPLEMENT)),
  db: AsyncSession = Depends(get_db),
):
  try:
    await service.update_implementation(db, impl_id, payload)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  impl = await repository.get_implementation(db, impl_id)
  return impl

@router.post("/{policy_id}/evaluations", response_model=PolicyEvaluationRead, status_code=status.HTTP_201_CREATED)
async def create_evaluation_endpoint(
  policy_id: uuid.UUID,
  payload: PolicyEvaluationCreate,
  current_user: User = Depends(require_permission(POLICY_EVALUATE)),
  db: AsyncSession = Depends(get_db),
):
  policy = await service.get_policy_detail(db, policy_id)
  if not policy:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "the policy is not present")
  try:
    await service.create_evaluation(db, policy, payload, current_user.id)
  except service.PolicyError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  return policy.evaluations[0] if policy.evaluations else None