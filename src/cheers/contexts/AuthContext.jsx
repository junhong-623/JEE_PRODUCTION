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
  const [newCouponGrant, setNewCouponGrant] = useState(null) // coupon data if just granted

  async function writeUserProfile(u) {
    try {
      await setDoc(doc(db, 'cheers_users', u.uid), {
        email: (u.email || '').toLowerCase(),
        displayName: u.displayName || '',
        lastSeen: serverTimestamp(),
      }, { merge: true })
    } catch {}
  }

  // Dynamically grant new-user coupon based on admin settings in cheers_settings/global.newUserCoupon
  async function grantCouponIfNew(uid) {
    try {
      // Load admin-configured settings
      const settingsSnap = await getDoc(doc(db, 'cheers_settings', 'global'))
      const config = settingsSnap.data()?.newUserCoupon
      if (!config?.enabled) return null  // Feature is off — do nothing

      // Check if user already received a new-user coupon
      const existingSnap = await getDocs(
        query(collection(db, 'cheers_user_coupons'),
          where('userId', '==', uid),
          where('isNewUserCoupon', '==', true))
      )
      if (!existingSnap.empty) return null  // Already granted

      // Atomically increment counter and check max recipients
      const counterRef = doc(db, 'cheers_counters', 'newUserCoupons')
      let rank = null
      await runTransaction(db, async (txn) => {
        const counterSnap = await txn.get(counterRef)
        const currentCount = counterSnap.data()?.count || 0
        if (config.maxRecipients && currentCount >= config.maxRecipients) return // Limit reached
        rank = currentCount + 1
        txn.set(counterRef, { count: rank }, { merge: true })
      })
      if (rank === null) return null  // Limit reached

      // Calculate expiry date if configured
      let expiresAt = null
      if (config.expiresAfterDays && config.expiresAfterDays > 0) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + Number(config.expiresAfterDays))
      }

      const code = `WELCOME${Math.floor(Math.random() * 9000 + 1000)}`
      const couponData = {
        userId: uid,
        code,
        title: config.title || '新用户专属优惠',
        discount: config.discount,
        discountType: config.discountType,
        minSpend: config.minSpend || 0,
        expiresAt,
        used: false,
        grantedAt: serverTimestamp(),
        usedAt: null,
        isNewUserCoupon: true,
        rank,
      }
      await addDoc(collection(db, 'cheers_user_coupons'), couponData)

      // Return coupon info to show in UI
      return {
        rank,
        code,
        title: couponData.title,
        discount: config.discount,
        discountType: config.discountType,
        minSpend: config.minSpend || 0,
      }
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
    const grant = await grantCouponIfNew(cred.user.uid)
    if (grant) setNewCouponGrant(grant)
    return cred
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    await writeUserProfile(cred.user)
    const grant = await grantCouponIfNew(cred.user.uid)
    if (grant) setNewCouponGrant(grant)
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
