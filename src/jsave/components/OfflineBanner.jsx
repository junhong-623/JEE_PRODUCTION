import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'

export default function OfflineBanner() {
  const { t } = useLang()
  const { online, syncError } = useJSave()

  if (online && !syncError) return null

  return (
    <div className="jsave-offline-banner">
      <span className="jsave-offline-dot" />
      {online ? t('syncFailed') : t('offline')}
    </div>
  )
}
