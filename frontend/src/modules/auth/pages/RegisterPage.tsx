import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Mail, Lock } from 'lucide-react'
import { authService } from '../../../services/authService'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function RegisterPage() {
  const { t } = useTranslation('auth')
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
      setError(t('register.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t('register.heading')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('register.subtitle')}</p>
      </div>
      <TextField label={t('register.fullNameLabel')} icon={User} placeholder={t('register.fullNamePlaceholder')} value={fullName}
        onChange={(e) => setFullName(e.target.value)} required autoFocus />
      <TextField label={t('register.emailLabel')} icon={Mail} type="email" placeholder={t('register.emailPlaceholder')} value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <TextField label={t('register.passwordLabel')} icon={Lock} isPassword placeholder={t('register.passwordPlaceholder')} value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" loading={loading}>{t('register.submit')}</Button>
      <p className="text-sm text-slate-500 text-center">
        {t('register.haveAccount')} <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">{t('register.signInLink')}</Link>
      </p>
    </form>
  )
}