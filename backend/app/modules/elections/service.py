from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.modules.elections import repository
from app.modules.elections.schemas import ElectionResults, ConstituencyResultRead, SeatTally
from collections import defaultdict

async def record_vote(db: AsyncSession, election_id: uuid.UUID, candidate_id: uuid.UUID, votes_count: int) -> None:
  await repository.upsert_vote_record(db, election_id, candidate_id, votes_count)
  await db.commit()
  
async def compute_results(db: AsyncSession, election_id: uuid.UUID) -> ElectionResults:
  records = await repository.get_vote_records(db, election_id)

  by_constituency: dict[uuid.UUID, list] = defaultdict(list)
  for r in records:
    by_constituency[r.candidate.constituency_id].append(r)

  constituency_results = []
  seats_by_party: dict[str, int] = defaultdict(int)

  for recs in by_constituency.values():
    winner = max(recs, key=lambda r: r.votes_count)
    constituency = winner.candidate.constituency
    party_name = winner.candidate.party.name if winner.candidate.party else "Independent"
    constituency_results.append(ConstituencyResultRead(constituency_id=constituency.id, constituency_name=constituency.name, constituency_code=constituency.code,
      winner_candidate_name=winner.candidate.full_name, winner_party_name=party_name, winner_votes=winner.votes_count,
        total_votes_cast=sum(r.votes_count for r in recs),
      )
    )
    seats_by_party[party_name] += 1

  return ElectionResults(election_id=election_id, total_seats_declared=len(constituency_results),
    seats_by_party=[SeatTally(party_name=k, seats=v) for k, v in seats_by_party.items()],
    constituency_results=constituency_results,
  )