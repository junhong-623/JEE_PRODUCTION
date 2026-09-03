import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const isAdmin = (user) => Boolean(user && user.uid === import.meta.env.VITE_ADMIN_UID)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [admin, setAdmin]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let unsubscribe

    import('../lib/authObserver')
      .then(({ observeAuth }) => {
        if (cancelled) return
        unsubscribe = observeAuth((u) => {
          setUser(u)
          setAdmin(isAdmin(u))
          setLoading(false)
        })
      })
      .catch((error) => {
        console.error('Auth initialization failed', error)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, admin, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
