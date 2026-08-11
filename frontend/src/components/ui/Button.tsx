import type { ButtonHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }

export function Button({ children, loading, disabled, className = '', ...props }: ButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`w-full bg-teal-500 text-slate-950 font-semibold rounded-lg px-4 py-2.5 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? 'pleaseWait' : children}
    </button>
  )
}