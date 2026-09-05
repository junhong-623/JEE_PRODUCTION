import JSaveIntro from '../../pages/JSaveIntro'
import { useLang } from '../contexts/LangContext'

// The public portfolio route and the signed-out standalone app share one landing page.
export default function IntroPage({ onLogin }) {
  const { lang, setLanguage } = useLang()
  return <JSaveIntro onOpenApp={onLogin} withHead={false} language={lang} onLanguageChange={setLanguage} />
}
