import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

export const observeAuth = (callback) => onAuthStateChanged(auth, callback)
