from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.identity import service
from app.modules.identity.models import User
from app.modules.identity.schemas import LoginRequest, RefreshRequest, TokenPair, UserCreate, UserRead, UserRead, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest
from app.modules.identity.service import AuthError
from app.shared.dependencies import get_current_user
from app.modules.authorization.repository import get_permission_codes_for_user
from app.core.config import get_settings


router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
  try:
    return await service.register_user(db, payload.email, payload.password, payload.full_name)
  except AuthError as exc:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
  try:
    user = await service.authenticate_user(db, payload.email, payload.password)
    return await service.issue_token_pair(db, user)
  except AuthError as exc:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
  try:
    return await service.refresh_tokens(db, payload.refresh_token)
  except AuthError as exc:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
  permissions = await get_permission_codes_for_user(db, current_user.id)
  return UserRead(id=current_user.id, email=current_user.email, full_name=current_user.full_name,
    is_active=current_user.is_active, permissions=permissions,)
  
settings = get_settings()

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
  token = await service.request_password_reset(db, payload.email)
  response = ForgotPasswordResponse(message = "If that email is registered, a reset link has been sent.")
  if settings.app.app_env == "development" and token:
    response.dev_reset_token = token
  return response

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
  try:
    await service.reset_password(db, payload.token, payload.new_password)
  except AuthError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
  return {"status": "ok", "message": "Password updated — you can now sign in."}