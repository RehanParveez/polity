import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../app/store'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Sign in</h2>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back, enter your credentials to continue.</p>
      </div>
      <TextField label="Email" icon={Mail} type="email" placeholder="you@gmail.com" value={email}
        onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <div>
        <TextField label="Password" icon={Lock} isPassword placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <div className="text-right mt-1.5">
          <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300">Forgot password?</Link>
        </div>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" loading={loading}>Sign in</Button>
      <p className="text-sm text-slate-500 text-center">
        No account? <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">Register</Link>
      </p>
    </form>
  )
}