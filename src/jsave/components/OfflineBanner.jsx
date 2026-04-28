import { useLang } from '../contexts/LangContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const { t } = useLang()
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div className="jsave-offline-banner">
      <span className="jsave-offline-dot" />
      {t('offline')}
    </div>
  )
}
