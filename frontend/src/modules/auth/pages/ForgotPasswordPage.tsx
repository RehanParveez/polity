import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { authService } from '../../../services/authService'
import { TextField } from '../../../components/ui/TextField'
import { Button } from '../../../components/ui/Button'

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.forgotPassword(email)
      setSubmitted(true)
      setDevToken(res.dev_reset_token ?? null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t('forgotPassword.heading')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('forgotPassword.subtitle')}</p>
      </div>
      {!submitted ? (
        <>
          <TextField label={t('forgotPassword.emailLabel')} icon={Mail} type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" loading={loading}>{t('forgotPassword.submit')}</Button>
        </>
      ) : (
        <div className="text-sm text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
          {t('forgotPassword.confirmation')}
          {devToken && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-xs text-amber-400 mb-1">{t('forgotPassword.devModeNotice')}</p>
              <Link to={`/reset-password?token=${devToken}`} className="text-teal-400 underline text-xs break-all">
                {t('forgotPassword.continueLink')}
              </Link>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-slate-500 text-center">
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">{t('forgotPassword.backToSignIn')}</Link>
      </p>
    </form>
  )
}