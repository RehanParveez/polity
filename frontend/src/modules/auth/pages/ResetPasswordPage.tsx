import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { authService } from '../../../services/authService'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      navigate('/login')
    } catch {
      setError('That reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <p className="text-sm text-red-400">Missing reset token. Use the link from the forgot-password step.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Set a new password</h2>
        <p className="text-sm text-slate-500 mt-0.5">Choose a new password for your account.</p>
      </div>
      <TextField label="New password" icon={Lock} isPassword placeholder="At least 8 characters" value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" loading={loading}>Update password</Button>
      <p className="text-sm text-slate-500 text-center">
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Back to sign in</Link>
      </p>
    </form>
  )
}