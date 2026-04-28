// Pass-through to jeeprod's AuthContext — no re-login needed
// Route is already guarded by jeeprod's admin check in App.jsx
import { useAuth as useJeeAuth } from '../../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

export function useAuth() {
  const { user, admin } = useJeeAuth()
  return {
    user,
    loading: false,
    error: '',
    login: () => Promise.resolve(),
    logout: () => signOut(auth),
  }
}

export function AuthProvider({ children }) {
  return children
}
