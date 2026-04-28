export const installState = { deferredPrompt: null, pwaEl: null }

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone

export async function setupPwaInstall() {
  if (!customElements.get('pwa-install')) {
    await new Promise(resolve => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/@khmyznikov/pwa-install/dist/pwa-install.bundle.js'
      s.onload = resolve
      document.head.appendChild(s)
    })
    await customElements.whenDefined('pwa-install')
  }
  const el = document.createElement('pwa-install')
  el.setAttribute('manifest-url', '/jsave/manifest.json')
  el.setAttribute('name', 'JSave')
  el.setAttribute('icon', '/jsave/icons/icon-192.png')
  el.setAttribute('manual-apple', '')
  document.body.appendChild(el)
  installState.pwaEl = el
}

export function doInstall(onShowGuide) {
  if (installState.deferredPrompt) {
    installState.deferredPrompt.prompt()
    installState.deferredPrompt = null
  } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    installState.pwaEl?.showDialog()
  } else if (/Android/i.test(navigator.userAgent)) {
    onShowGuide('android')
  } else {
    onShowGuide('desktop')
  }
}
