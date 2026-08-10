import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Calendar, Landmark, Crown, UserCheck } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'
import { governmentService } from '../../../services/governmentService'

export function GovernmentCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [formedDate, setFormedDate] = useState('')
  const [headOfState, setHeadOfState] = useState('')
  const [headOfGovt, setHeadOfGovt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const gov = await governmentService.createGovernment({
        name,
        formed_date: formedDate,
        head_of_state_name: headOfState || null,
        head_of_government_name: headOfGovt || null,
      })
      navigate(`/governments/${gov.id}`)
    } catch {
      setError('Could not form government — check permissions and fields.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Form new government"
        subtitle="Create a government administration record"
      />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <TextField
            label="Government name"
            icon={Landmark}
            placeholder="Government of National Unity 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Formed date"
            icon={Calendar}
            type="date"
            value={formedDate}
            onChange={(e) => setFormedDate(e.target.value)}
            required
          />
          <TextField
            label="Head of State title"
            icon={Crown}
            placeholder="President"
            value={headOfState}
            onChange={(e) => setHeadOfState(e.target.value)}
          />
          <TextField
            label="Head of Government title"
            icon={UserCheck}
            placeholder="Prime Minister"
            value={headOfGovt}
            onChange={(e) => setHeadOfGovt(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading}>
            Form government
          </Button>
          <p className="text-sm text-slate-500 text-center">
            <Link to="/governments" className="text-teal-400 hover:text-teal-300 font-medium">
              Back to governments
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}