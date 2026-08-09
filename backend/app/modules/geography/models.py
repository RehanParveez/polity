from app.core.database import Base
from app.shared.mixins import TimestampMixin
import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid, ForeignKey, Date, String, Numeric
from datetime import date

class Province(Base, TimestampMixin):
  __tablename__ = "provinces"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
  code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
  unit_type: Mapped[str] = mapped_column(String(30), nullable=False)
  districts: Mapped[list["District"]] = relationship(back_populates = "province")

class District(Base, TimestampMixin):
  __tablename__ = "districts"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  province_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("provinces.id"), nullable=False)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  province: Mapped["Province"] = relationship(back_populates = "districts")
  tehsils: Mapped[list["Tehsil"]] = relationship(back_populates = "district")
  demographic_profile: Mapped["DemographicProfile | None"] = relationship(back_populates = "district", uselist=False)

class Tehsil(Base, TimestampMixin):
  __tablename__ = "tehsils"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  district: Mapped["District"] = relationship(back_populates = "tehsils")

class DemographicProfile(Base, TimestampMixin):
  __tablename__ = "demographic_profiles"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), unique=True, nullable=False)
  population: Mapped[int] = mapped_column(nullable=False)
  literacy_rate_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
  urban_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
  source: Mapped[str] = mapped_column(String(255), nullable=False)
  as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
  confidence: Mapped[str] = mapped_column(String(20), nullable=False)
  district: Mapped["District"] = relationship(back_populates = "demographic_profile")