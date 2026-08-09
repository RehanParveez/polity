from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.identity import service
from app.modules.identity.models import User
from app.modules.identity.schemas import LoginRequest, RefreshRequest, TokenPair, UserCreate, UserRead
from app.modules.identity.service import AuthError
from app.shared.dependencies import get_current_user

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
async def me(current_user: User = Depends(get_current_user)):
  return current_user