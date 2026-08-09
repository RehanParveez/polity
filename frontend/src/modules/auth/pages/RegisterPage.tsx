import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../../services/authService'

export function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.register(email, password, fullName)
      navigate('/login')
    } catch {
      setError('Could not register — email may already be in use')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
        className="border border-slate-300 rounded px-3 py-2" required />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="border border-slate-300 rounded px-3 py-2" required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="border border-slate-300 rounded px-3 py-2" required minLength={8} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-slate-800 text-white rounded px-3 py-2 disabled:opacity-50">
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-sm text-slate-500 text-center">
        Already have an account? <Link to="/login" className="text-slate-800 underline">Sign in</Link>
      </p>
    </form>
  )
}