import JSaveIntro from '../../pages/JSaveIntro'

// The public portfolio route and the signed-out standalone app share one landing page.
export default function IntroPage({ onLogin }) {
  return <JSaveIntro onOpenApp={onLogin} withHead={false} />
}
