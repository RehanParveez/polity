from fastapi import APIRouter, Depends
from app.modules.identity.models import User
from app.shared.dependencies import require_permission

router = APIRouter(prefix = "/authorization", tags=["authorization"])

@router.get("/ping")
async def ping(current_user: User = Depends(require_permission("authorization.role.manage"))):
  return {"status": "ok", "user": str(current_user.id)}