import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'

export default function Footer() {
  const { t } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-cheers-dark-brown text-cheers-cream/80 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-serif text-cheers-cream text-lg font-medium">Cheers.co</p>
            <p className="text-xs text-cheers-cream/50 mt-1">{t('footer.tagline')}</p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/tos" className="hover:text-cheers-cream transition-colors">{t('footer.tos')}</Link>
            <Link to="/privacy" className="hover:text-cheers-cream transition-colors">{t('footer.privacy')}</Link>
            <Link to="/refund" className="hover:text-cheers-cream transition-colors">{t('footer.refund')}</Link>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-cheers-cream/10 text-center text-[11px] text-cheers-cream/30">
          © {year} Cheers.co · {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
