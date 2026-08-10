from fastapi import APIRouter, Depends, status, HTTPException
from app.shared.dependencies import get_current_user, require_permission
from app.modules.elections.schemas import PartyRead, ConstituencyRead, CandidateRead, ElectionRead, ElectionCreate, ElectionResults, VoteRecordCreate
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
import uuid
from app.modules.elections import repository, service

router = APIRouter(prefix="/elections", tags=["elections"], dependencies=[Depends(get_current_user)])

@router.get("/parties", response_model=list[PartyRead])
async def list_parties_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_parties(db)

@router.get("/constituencies", response_model=list[ConstituencyRead])
async def list_constituencies_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_constituencies(db)

@router.get("/candidates", response_model=list[CandidateRead])
async def list_candidates_endpoint(constituency_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
  return await repository.list_candidates(db, constituency_id)

@router.get("", response_model=list[ElectionRead])
async def list_elections_endpoint(db: AsyncSession = Depends(get_db)):
  return await repository.list_elections(db)

@router.post("", response_model=ElectionRead, status_code=status.HTTP_201_CREATED)
async def create_election_endpoint(payload: ElectionCreate, _: object = Depends(require_permission("election.manage")),
  db: AsyncSession = Depends(get_db),
):
  return await repository.create_election(db, payload.name, payload.election_date)

@router.get("/{election_id}", response_model=ElectionRead)
async def get_election_endpoint(election_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  election = await repository.get_election(db, election_id)
  if not election:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="election not found")
  return election

@router.get("/{election_id}/results", response_model=ElectionResults)
async def get_results_endpoint(election_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
  if not await repository.get_election(db, election_id):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "election is not present")
  return await service.compute_results(db, election_id)

@router.post("/{election_id}/votes", status_code=status.HTTP_204_NO_CONTENT)
async def record_vote_endpoint(election_id: uuid.UUID, payload: VoteRecordCreate, _: object = Depends(require_permission("election.manage")),
  db: AsyncSession = Depends(get_db),
):
  await service.record_vote(db, election_id, payload.candidate_id, payload.votes_count)