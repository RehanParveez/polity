import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Calendar, FileText } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { electionsService } from '../../../services/electionsService'

export function ElectionCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [electionDate, setElectionDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const election = await electionsService.createElection(name, electionDate)
      navigate(`/elections/${election.id}`)
    } catch {
      setError('Could not create election, you may not have permission, or a field is invalid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="New election" subtitle="Set up a new simulated election" />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <TextField label="Election name" icon={FileText} placeholder="General Election 2027 (Simulated)" value={name}
            onChange={(e) => setName(e.target.value)} required autoFocus />
          <TextField label="Election date" icon={Calendar} type="date" value={electionDate}
            onChange={(e) => setElectionDate(e.target.value)} required />
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" loading={loading}>Create election</Button>
          <p className="text-sm text-slate-500 text-center">
            <Link to="/elections" className="text-teal-400 hover:text-teal-300 font-medium">Back to elections</Link>
          </p>
        </form>
      </Card>
    </div>
  )
}