import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../i18n/en'
import zh from '../i18n/zh'

const translations = { en, zh }
const LangContext = createContext(null)

export function LangProvider({ children, initialLang }) {
  const [lang, setLang] = useState(
    () => initialLang || localStorage.getItem('jsave-lang') || 'en'
  )

  const setLanguage = useCallback((nextLanguage) => setLang(nextLanguage), [])
  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key

  useEffect(() => {
    localStorage.setItem('jsave-lang', lang)
  }, [lang])

  useEffect(() => {
    if (initialLang && translations[initialLang]) setLang(initialLang)
  }, [initialLang])

  return (
    <LangContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
