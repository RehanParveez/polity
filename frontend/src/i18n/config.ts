import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enFinance from './locales/en/finance.json'
import urCommon from './locales/ur/common.json'
import urAuth from './locales/ur/auth.json'
import urFinance from './locales/ur/finance.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, finance: enFinance },
      ur: { common: urCommon, auth: urAuth, finance: urFinance },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ur'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'finance'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'civicsphere_lang',
    },
  })

export default i18n