import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enFinance from './locales/en/finance.json'
import urCommon from './locales/ur/common.json'
import urAuth from './locales/ur/auth.json'
import urFinance from './locales/ur/finance.json'
import enGovernment from './locales/en/government.json'
import urGovernment from './locales/ur/government.json'
import enElections from './locales/en/elections.json'
import urElections from './locales/ur/elections.json'
import enGeography from './locales/en/geography.json'
import urGeography from './locales/ur/geography.json'
import enPolicies from './locales/en/policies.json'
import urPolicies from './locales/ur/policies.json'
import enInstitutions from './locales/en/institutions.json'
import urInstitutions from './locales/ur/institutions.json'
import enDashboard from './locales/en/dashboard.json'
import urDashboard from './locales/ur/dashboard.json'
import enSectors from './locales/en/sectors.json'
import urSectors from './locales/ur/sectors.json'
import enProcess from './locales/en/process.json'
import urProcess from './locales/ur/process.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, finance: enFinance, government: enGovernment, elections: enElections, geography: enGeography, institutions: enInstitutions, dashboard: enDashboard, sectors: enSectors, policies: enPolicies, process: enProcess,},
      ur: { common: urCommon, auth: urAuth, finance: urFinance, government: urGovernment, elections: urElections, geography: urGeography, institutions: urInstitutions, dashboard: urDashboard, sectors: urSectors, policies: urPolicies, process: urProcess, },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ur'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'finance', 'government', 'elections', 'geography', 'instituitions', 'dashboard','sectors', 'policies', 'process'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'civicsphere_lang',
    },
  })

export default i18n