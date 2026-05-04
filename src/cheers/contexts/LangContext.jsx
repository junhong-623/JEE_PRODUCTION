import React, { createContext, useContext, useState, useCallback } from 'react'
import zh from '../i18n/zh'
import en from '../i18n/en'

const translations = { zh, en }
const LangContext = createContext(null)

function get(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('cheers_lang') || 'zh')

  const switchLang = useCallback((l) => {
    setLang(l)
    localStorage.setItem('cheers_lang', l)
  }, [])

  const t = useCallback((key) => get(translations[lang], key), [lang])

  return (
    <LangContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
