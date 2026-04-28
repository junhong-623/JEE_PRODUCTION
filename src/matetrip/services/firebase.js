import { getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Use the default Firebase app so auth state is shared with jeeprod
export const app = getApp()
export const db = getFirestore(app)
export const storage = getStorage(app)
