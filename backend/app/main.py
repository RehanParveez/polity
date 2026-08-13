from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import get_db
from app.modules.authorization.router import router as authorization_router
from app.modules.identity.router import router as identity_router
from app.modules.geography.router import router as geography_router
from app.modules.institutions.router import router as institutions_router
from app.modules.elections.router import router as elections_router
from app.modules.government.router import router as government_router
from app.modules.finance.router import router as finance_router
from app.modules.sectors.router import router as sectors_router
from app.modules.policies.router import router as policies_router
from app.modules.process.router import router as process_router

settings = get_settings()

def create_app() -> FastAPI:
  app = FastAPI(
    title = "Polity API",
    description = "Governance simulator for Pakistan — identity, geography, institutions, and elections.",
    version="0.4.0",
    openapi_tags=[
      {"name": "auth", "description": "Registration, login, token refresh, password reset"},
      {"name": "authorization", "description": "Permission-check demo endpoint"},
      {"name": "geography", "description": "Provinces, districts, tehsils, demographics"},
      {"name": "institutions", "description": "Ministries, departments, institution membership"},
      {"name": "elections", "description": "Parties, constituencies, candidates, elections, results"},
      {"name": "governments", "description": "Cabinet formation and government administration"},
      {"name": "finance", "description": "Revenue, budgets, procurement, and audit findings"},
      {"name": "sectors", "description": "Education, healthcare, agriculture, infrastructure, labor, and defense sector data"},
    ],
  )
  
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
  app.include_router(geography_router)
  app.include_router(institutions_router)
  app.include_router(elections_router)
  app.include_router(government_router)
  app.include_router(finance_router)
  app.include_router(sectors_router)
  app.include_router(policies_router)
  app.include_router(process_router)
  return app

app = create_app()