import React from 'react'
import ReactDOM from 'react-dom/client'
import CheersApp from './cheers/App'
import './cheers/App.css'

// Auto-reload when a lazy-loaded chunk fails after a new deployment
window.addEventListener('vite:preloadError', () => { window.location.reload() })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CheersApp />
  </React.StrictMode>
)
