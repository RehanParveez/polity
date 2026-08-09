import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { authService } from '../../../services/authService'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.forgotPassword(email)
      setMessage(res.message)
      setDevToken(res.dev_reset_token ?? null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Reset your password</h2>
        <p className="text-sm text-slate-500 mt-0.5">Enter your email and we'll send a reset link.</p>
      </div>
      {!message ? (
        <>
          <TextField label="Email" icon={Mail} type="email" placeholder="you@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" loading={loading}>Send reset link</Button>
        </>
      ) : (
        <div className="text-sm text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
          {message}
          {devToken && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-xs text-amber-400 mb-1">Dev mode, no email service wired up yet:</p>
              <Link to={`/reset-password?token=${devToken}`} className="text-teal-400 underline text-xs break-all">
                Continue to reset password
              </Link>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-slate-500 text-center">
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Back to sign in</Link>
      </p>
    </form>
  )
}