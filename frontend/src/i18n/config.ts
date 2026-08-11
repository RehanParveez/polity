import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import urCommon from './locales/ur/common.json'
import urAuth from './locales/ur/auth.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth },
      ur: { common: urCommon, auth: urAuth },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ur'],
    defaultNS: 'common',
    ns: ['common', 'auth'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'civicsphere_lang',
    },
  })

export default i18n