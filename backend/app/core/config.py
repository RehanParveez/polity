from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class AppSettings(BaseSettings):
  model_config = SettingsConfigDict(extra="ignore")
  app_env: str = "development"
  app_debug: bool = True
  app_secret_key: str
  backend_cors_origins: list[str] = ["http://localhost:5082"]

class DatabaseSettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  postgres_user: str
  postgres_password: str
  postgres_db: str
  postgres_host: str
  postgres_port: int = 5438
  database_url: str

class RedisSettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  redis_url: str

class AuthSettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  jwt_secret_key: str
  jwt_algorithm: str = "HS256"
  access_token_expire_minutes: int = 30
  refresh_token_expire_days: int = 14

class AISettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  ollama_base_url: str
  ollama_model: str
  ai_requests_per_minute: int = 10
  ai_restricted_records_disable_ai: bool = True

class LocalizationSettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  default_locale: str = "en"
  supported_locales: str = "en,ur"

class RateLimitSettings(BaseSettings):
  model_config = SettingsConfigDict(extra = "ignore")
  rate_limit_default: str = "100/minute"

class Settings:
  def __init__(self) -> None:
    self.app = AppSettings()
    self.database = DatabaseSettings()
    self.redis = RedisSettings()
    self.auth = AuthSettings()
    self.ai = AISettings()
    self.localization = LocalizationSettings()
    self.rate_limit = RateLimitSettings()

@lru_cache
def get_settings() -> Settings:
  return Settings()