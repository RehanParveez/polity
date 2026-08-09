import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../app/store'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { access_token, refresh_token } = await authService.login(email, password)
      localStorage.setItem('refresh_token', refresh_token)
      const user = await authService.me(access_token)
      setAuth(user, access_token)
      navigate('/')
    } catch {
      setError('wrong email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="border border-slate-300 rounded px-3 py-2" required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500" required />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-teal-500 text-slate-950 font-medium rounded px-3 py-2 hover:bg-teal-400 disabled:opacity-50 transition-colors">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-slate-500 text-center">
        No account? <Link to="/register" className="text-slate-800 underline">Register</Link>
      </p>
    </form>
  )
}