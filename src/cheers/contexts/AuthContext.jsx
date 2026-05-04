import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, GoogleAuthProvider,
  signInWithPopup, updateProfile,
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import app from '../../lib/firebase'

const auth = getAuth(app)
const db = getFirestore(app)
const AuthContext = createContext(null)
const SUPER_ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function writeUserProfile(u) {
    try {
      await setDoc(doc(db, 'cheers_users', u.uid), {
        email: (u.email || '').toLowerCase(),
        displayName: u.displayName || '',
        lastSeen: serverTimestamp(),
      }, { merge: true })
    } catch (_) {}
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        writeUserProfile(u)
        const isSuperAdmin = u.uid === SUPER_ADMIN_UID
        if (isSuperAdmin) {
          setIsAdmin(true)
        } else {
          const snap = await getDoc(doc(db, 'cheers_admins', u.uid)).catch(() => null)
          setIsAdmin(snap?.exists() ?? false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    writeUserProfile(cred.user)
    return cred
  }

  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    writeUserProfile(cred.user)
    return cred
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    writeUserProfile(cred.user)
    return cred
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
