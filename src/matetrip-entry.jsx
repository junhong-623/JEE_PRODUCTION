import React from 'react'
import ReactDOM from 'react-dom/client'
import './lib/firebase' // initialize default Firebase app before any matetrip service calls getApp()
import MatetripApp from './matetrip/App'

// Register service worker for standalone subdomain build
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MatetripApp />
  </React.StrictMode>
)
