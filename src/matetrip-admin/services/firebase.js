import { getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Use the default Firebase app (same as jeeprod) so auth state is shared
const app = getApp()
export const auth = getAuth(app)
export const db   = getFirestore(app)
