from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date
from typing import Optional

class PartyRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  abbreviation: str
  color_hex: str
  founded_year: int | None = None

class ConstituencyRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  code: str
  name: str
  district_id: uuid.UUID
  seat_type: str

class CandidateRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  full_name: str
  party: PartyRead | None = None
  constituency: ConstituencyRead

class ElectionRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)
  id: uuid.UUID
  name: str
  election_date: date
  status: str
  system: str

class ElectionCreate(BaseModel):
  name: str
  election_date: date

class VoteRecordCreate(BaseModel):
  candidate_id: uuid.UUID
  votes_count: int

class ConstituencyResultRead(BaseModel):
  constituency_id: uuid.UUID
  constituency_name: str
  constituency_code: str
  winner_candidate_name: str
  winner_party_name: str
  winner_votes: int
  total_votes_cast: int
  registered_voters: Optional[int] = None

class SeatTally(BaseModel):
  party_name: str
  seats: int

class ElectionResults(BaseModel):
  election_id: uuid.UUID
  total_seats_declared: int
  seats_by_party: list[SeatTally]
  constituency_results: list[ConstituencyResultRead]