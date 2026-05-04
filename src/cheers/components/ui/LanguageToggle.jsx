import React from 'react'
import { useLang } from '../../contexts/LangContext'

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className={`text-xs font-medium border border-cheers-brown/30 rounded-full px-3 py-1 hover:border-cheers-brown hover:text-cheers-brown transition-colors ${className}`}
      title="切换语言 / Switch Language"
    >
      {lang === 'zh' ? 'EN' : '中文'}
    </button>
  )
}
