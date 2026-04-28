// Firebase Auth helpers
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

export const register = (email, password, displayName) =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
    if (displayName) await updateProfile(cred.user, { displayName })
    return cred.user
  })

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password).then(c => c.user)

export const loginWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider()).then(c => c.user)

export const logout = () => signOut(auth)

/** Check if a user is the designated admin */
export const isAdmin = (user) =>
  user && user.uid === import.meta.env.VITE_ADMIN_UID
