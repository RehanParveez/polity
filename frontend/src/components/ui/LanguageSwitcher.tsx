import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="inline-flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-md p-0.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors" ${
            i18n.language === lang.code ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}