import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../app/store'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function LoginPage() {
  const { t } = useTranslation('auth')
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
      setError(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t('login.heading')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('login.subtitle')}</p>
      </div>
      <TextField label={t('login.emailLabel')} icon={Mail} type="email" placeholder={t('login.emailPlaceholder')} value={email}
        onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <div>
        <TextField label={t('login.passwordLabel')} icon={Lock} isPassword placeholder={t('login.passwordPlaceholder')} value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <div className="text-end mt-1.5">
          <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300">{t('login.forgotPassword')}</Link>
        </div>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" loading={loading}>{t('login.submit')}</Button>
      <p className="text-sm text-slate-500 text-center">
        {t('login.noAccount')} <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">{t('login.registerLink')}</Link>
      </p>
    </form>
  )
}