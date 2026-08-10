from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.elections.models import Candidate, Constituency, Election, Party, VoteRecord
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def list_parties(db: AsyncSession) -> list[Party]:
  result = await db.execute(select(Party).order_by(Party.name))
  return list(result.scalars().all())

async def list_constituencies(db: AsyncSession) -> list[Constituency]:
  result = await db.execute(select(Constituency).order_by(Constituency.code))
  return list(result.scalars().all())

async def list_candidates(db: AsyncSession, constituency_id: uuid.UUID | None) -> list[Candidate]:
  stmt = select(Candidate).options(selectinload(Candidate.party), selectinload(Candidate.constituency))
  if constituency_id:
    stmt = stmt.where(Candidate.constituency_id == constituency_id)
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def list_elections(db: AsyncSession) -> list[Election]:
  result = await db.execute(select(Election).order_by(Election.election_date.desc()))
  return list(result.scalars().all())

async def get_election(db: AsyncSession, election_id: uuid.UUID) -> Election | None:
  result = await db.execute(select(Election).where(Election.id == election_id))
  return result.scalar_one_or_none()

async def create_election(db: AsyncSession, name: str, election_date) -> Election:
  election = Election(name=name, election_date=election_date)
  db.add(election)
  await db.commit()
  await db.refresh(election)
  return election

async def get_vote_records(db: AsyncSession, election_id: uuid.UUID) -> list[VoteRecord]:
  stmt = (select(VoteRecord)
    .options(selectinload(VoteRecord.candidate).selectinload(Candidate.party),
      selectinload(VoteRecord.candidate).selectinload(Candidate.constituency),
    )
    .where(VoteRecord.election_id == election_id)
  )
  result = await db.execute(stmt)
  return list(result.scalars().all())

async def get_vote_record(db: AsyncSession, election_id: uuid.UUID, candidate_id: uuid.UUID) -> VoteRecord | None:
  stmt = select(VoteRecord).where(VoteRecord.election_id == election_id, VoteRecord.candidate_id == candidate_id)
  result = await db.execute(stmt)
  return result.scalar_one_or_none()

async def upsert_vote_record(db: AsyncSession, election_id: uuid.UUID, candidate_id: uuid.UUID, votes_count: int) -> VoteRecord:
  existing = await get_vote_record(db, election_id, candidate_id)
  if existing:
    existing.votes_count = votes_count
    await db.flush()
    return existing
  row = VoteRecord(election_id=election_id, candidate_id=candidate_id, votes_count=votes_count)
  db.add(row)
  await db.flush()
  return row