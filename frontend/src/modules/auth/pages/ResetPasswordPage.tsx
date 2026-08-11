import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { authService } from '../../../services/authService'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
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
      setError(t('resetPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <p className="text-sm text-red-400">{t('resetPassword.missingToken')}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t('resetPassword.heading')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('resetPassword.subtitle')}</p>
      </div>
      <TextField label={t('resetPassword.passwordLabel')} icon={Lock} isPassword placeholder={t('resetPassword.passwordPlaceholder')} value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" loading={loading}>{t('resetPassword.submit')}</Button>
      <p className="text-sm text-slate-500 text-center">
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">{t('resetPassword.backToSignIn')}</Link>
      </p>
    </form>
  )
}