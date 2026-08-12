import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enGeography from './locales/en/geography.json'
import enInstitutions from './locales/en/institutions.json'
import enElections from './locales/en/elections.json'
import enGovernment from './locales/en/government.json'
import enSectors from './locales/en/sectors.json'
import enFinance from './locales/en/finance.json'
import urCommon from './locales/ur/common.json'
import urDashboard from './locales/ur/dashboard.json'
import urGeography from './locales/ur/geography.json'
import urInstitutions from './locales/ur/institutions.json'
import urElections from './locales/ur/elections.json'
import urGovernment from './locales/ur/government.json'
import urSectors from './locales/ur/sectors.json'
import urFinance from './locales/ur/finance.json'

export const defaultNS = 'common'

export const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    geography: enGeography,
    institutions: enInstitutions,
    elections: enElections,
    government: enGovernment,
    sectors: enSectors,
    finance: enFinance,
  },
  ur: {
    common: urCommon,
    dashboard: urDashboard,
    geography: urGeography,
    institutions: urInstitutions,
    elections: urElections,
    government: urGovernment,
    sectors: urSectors,
    finance: urFinance,
  },
} as const

const storedLang = localStorage.getItem('i18n_lang') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang,
    fallbackLng: 'en',
    defaultNS,
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18n_lang', lng)
  document.documentElement.dir = lng === 'ur' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
})

export default i18n