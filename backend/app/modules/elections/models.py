from typing import TYPE_CHECKING
from app.core.database import Base
from app.shared.mixins import TimestampMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy import Uuid, String, Date, ForeignKey, Integer, UniqueConstraint
from datetime import date

if TYPE_CHECKING:
  from app.modules.geography.models import District

class Party(Base, TimestampMixin):
  __tablename__ = "parties"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
  abbreviation: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
  color_hex: Mapped[str] = mapped_column(String(7), nullable=False)
  founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

class Constituency(Base, TimestampMixin):
  __tablename__ = "constituencies"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
  name: Mapped[str] = mapped_column(String(150), nullable=False)
  district_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("districts.id"), nullable=False)
  seat_type: Mapped[str] = mapped_column(String(30), default="national_assembly", nullable=False)
  district: Mapped["District"] = relationship()

class Candidate(Base, TimestampMixin):
  __tablename__ = "candidates"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  full_name: Mapped[str] = mapped_column(String(150), nullable=False)
  party_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("parties.id"), nullable=True)
  constituency_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("constituencies.id"), nullable=False)
  party: Mapped["Party | None"] = relationship()
  constituency: Mapped["Constituency"] = relationship()

class Election(Base, TimestampMixin):
  __tablename__ = "elections"

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  election_date: Mapped[date] = mapped_column(Date, nullable=False)
  status: Mapped[str] = mapped_column(String(30), default = "scheduled", nullable=False)
  system: Mapped[str] = mapped_column(String(20), default = "FPTP", nullable=False)

class VoteRecord(Base, TimestampMixin):
  __tablename__ = "vote_records"
  __table_args__ = (UniqueConstraint("election_id", "candidate_id", name="uq_election_candidate"),)

  id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
  election_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("elections.id"), nullable=False)
  candidate_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("candidates.id"), nullable=False)
  votes_count: Mapped[int] = mapped_column(Integer, nullable=False)
  candidate: Mapped["Candidate"] = relationship()