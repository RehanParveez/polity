import { apiClient } from './apiClient'

export type Party = { id: string; name: string; abbreviation: string; color_hex: string; founded_year: number | null }
export type Constituency = { id: string; code: string; name: string; district_id: string; seat_type: string }
export type Candidate = { id: string; full_name: string; party: Party | null; constituency: Constituency }
export type Election = { id: string; name: string; election_date: string; status: string; system: string }
export type ConstituencyResult = {
  constituency_id: string
  constituency_name: string
  constituency_code: string
  winner_candidate_name: string
  winner_party_name: string
  winner_votes: number
  total_votes_cast: number
  registered_voters?: number | null
}
export type SeatTally = { party_name: string; seats: number }
export type ElectionResults = {
  election_id: string
  total_seats_declared: number
  seats_by_party: SeatTally[]
  constituency_results: ConstituencyResult[]
}

export const electionsService = {
  listElections: async (): Promise<Election[]> => (await apiClient.get('/elections')).data,
  getElection: async (id: string): Promise<Election> => (await apiClient.get(`/elections/${id}`)).data,
  getResults: async (id: string): Promise<ElectionResults> => (await apiClient.get(`/elections/${id}/results`)).data,
  createElection: async (name: string, electionDate: string): Promise<Election> =>
    (await apiClient.post('/elections', { name, election_date: electionDate })).data,
}