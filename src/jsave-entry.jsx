import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import JSaveApp from './jsave/App'
import './jsave/App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <JSaveApp />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
