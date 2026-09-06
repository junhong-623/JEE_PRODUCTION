import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import JSaveApp from './jsave/App'
import './jsave/App.css'

document.documentElement.classList.add('jsave-html')
document.body.classList.add('jsave-body')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <JSaveApp />
    </AuthProvider>
  </React.StrictMode>
)
