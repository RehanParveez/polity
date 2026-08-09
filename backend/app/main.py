from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import get_db
from app.modules.authorization.router import router as authorization_router
from app.modules.identity.router import router as identity_router

settings = get_settings()

def create_app() -> FastAPI:
  app = FastAPI(title = "Polity API", version="0.1.0")
  
  app.add_middleware(CORSMiddleware, allow_origins=settings.app.backend_cors_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)
  
  @app.get('/health')
  def health() -> dict:
    return {"status": "ok", "service": "polity-backend"}
  
  @app.get("/health/ready")
  async def health_ready(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "reachable"}
  
  app.include_router(identity_router)
  app.include_router(authorization_router)
  return app

app = create_app()


    