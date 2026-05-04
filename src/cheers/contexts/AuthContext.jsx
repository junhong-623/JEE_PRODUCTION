import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, GoogleAuthProvider,
  signInWithPopup, updateProfile,
} from 'firebase/auth'
import app from '../../lib/firebase'

const auth = getAuth(app)
const AuthContext = createContext(null)
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    return cred
  }

  const loginWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider())

  const logout = () => signOut(auth)

  const isAdmin = user?.uid === ADMIN_UID

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
