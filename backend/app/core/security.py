from passlib.context import CryptContext
import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.core.config import get_settings
import secrets

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

def hash_password(password: str) -> str:
  return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
  return pwd_context.verify(plain_password, hashed_password)

def hash_token(token: str) -> str:
  return hashlib.sha256(token.encode()).hexdigest()

def create_access_token(subject: str) -> str:
  expire = datetime.now(timezone.utc) + timedelta(minutes=settings.auth.access_token_expire_minutes)
  payload = {"sub": subject, "exp": expire, "type": "access"}
  return jwt.encode(payload, settings.auth.jwt_secret_key, algorithm=settings.auth.jwt_algorithm)

def create_refresh_token(subject: str) -> tuple[str, datetime]:
  expire = datetime.now(timezone.utc) + timedelta(days=settings.auth.refresh_token_expire_days)
  jti = secrets.token_urlsafe(32)
  payload = {"sub": subject, "exp": expire, "type": "refresh", "jti": jti}
  token = jwt.encode(payload, settings.auth.jwt_secret_key, algorithm=settings.auth.jwt_algorithm)
  return token, expire

def decode_token(token: str) -> dict:
  try:
    return jwt.decode(token, settings.auth.jwt_secret_key, algorithms=[settings.auth.jwt_algorithm])
  except JWTError as exc:
    raise ValueError("invalid token") from exc

def create_password_reset_token(subject: str) -> str:
  expire = datetime.now(timezone.utc) + timedelta(minutes=30)
  payload = {"sub": subject, "exp": expire, "type": "password_reset"}
  return jwt.encode(payload, settings.auth.jwt_secret_key, algorithm=settings.auth.jwt_algorithm)