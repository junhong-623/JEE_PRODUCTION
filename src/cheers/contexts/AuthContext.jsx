import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, GoogleAuthProvider,
  signInWithPopup, updateProfile,
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, where, serverTimestamp, runTransaction } from 'firebase/firestore'
import app from '../../lib/firebase'

const auth = getAuth(app)
const db = getFirestore(app)
const AuthContext = createContext(null)
const SUPER_ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newCouponGrant, setNewCouponGrant] = useState(null) // { rank, code } if just granted

  async function writeUserProfile(u) {
    try {
      const userRef = doc(db, 'cheers_users', u.uid)
      const snap = await getDoc(userRef)
      const isNew = !snap.exists()
      await setDoc(userRef, {
        email: (u.email || '').toLowerCase(),
        displayName: u.displayName || '',
        lastSeen: serverTimestamp(),
      }, { merge: true })
      return isNew
    } catch { return false }
  }

  async function grantCouponIfNew(uid) {
    try {
      // Check if already has EARLY100
      const existingSnap = await getDocs(
        query(collection(db, 'cheers_user_coupons'), where('userId', '==', uid), where('code', '==', 'EARLY100'))
      )
      if (!existingSnap.empty) return null

      const counterRef = doc(db, 'cheers_counters', 'registrations')
      let rank = null
      await runTransaction(db, async (txn) => {
        const counterSnap = await txn.get(counterRef)
        rank = (counterSnap.data()?.count || 0) + 1
        txn.set(counterRef, { count: rank }, { merge: true })
      })

      if (rank <= 100) {
        await addDoc(collection(db, 'cheers_user_coupons'), {
          userId: uid,
          code: 'EARLY100',
          title: '早鸟专属优惠',
          discount: 15,
          discountType: 'fixed',
          minSpend: 150,
          used: false,
          grantedAt: serverTimestamp(),
          usedAt: null,
          rank,
        })
        return rank
      }
      return null
    } catch { return null }
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
    await writeUserProfile(cred.user)
    const rank = await grantCouponIfNew(cred.user.uid)
    if (rank) setNewCouponGrant({ rank, code: 'EARLY100' })
    return cred
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    const isNew = await writeUserProfile(cred.user)
    if (isNew) {
      const rank = await grantCouponIfNew(cred.user.uid)
      if (rank) setNewCouponGrant({ rank, code: 'EARLY100' })
    }
    return cred
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin,
      newCouponGrant, clearNewCouponGrant: () => setNewCouponGrant(null),
      login, register, loginWithGoogle, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
