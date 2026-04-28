import { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, collection, query, where, getDocs
} from "firebase/firestore";
import { app } from "../services/firebase";
import { db } from "../services/firebase";

const AuthContext = createContext(null);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function isStandalonePwa() {
  if (typeof window === "undefined") return false;

  return window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.navigator.standalone === true;
}

async function syncUsernameRecord(u) {
  if (!u) return;

  try {
    const existing = await getDoc(doc(db, "usernames", u.uid));

    if (!existing.exists()) {
      const baseUsername = (u.displayName || u.email?.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "user";

      await setDoc(doc(db, "usernames", u.uid), {
        username: baseUsername,
        displayName: u.displayName || baseUsername,
        email: u.email || "",
        uid: u.uid,
      });
      return;
    }

    await setDoc(doc(db, "usernames", u.uid), {
      email: u.email || "",
      uid: u.uid,
    }, { merge: true });
  } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Google redirect result (PWA standalone flow)
    getRedirectResult(auth)
      .then(cred => { if (cred?.user) syncUsernameRecord(cred.user); })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) syncUsernameRecord(u);
    });
    return unsub;
  }, []);

  // ── Login: accepts username OR email ────────────────────────────────────────
  const loginEmail = async (usernameOrEmail, password) => {
    let email = usernameOrEmail;

    // If no @ sign, treat as username → look up email in Firestore
    if (!usernameOrEmail.includes("@")) {
      const q = query(
        collection(db, "usernames"),
        where("username", "==", usernameOrEmail.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("Username not found. Please check and try again.");
      }
      email = snap.docs[0].data().email;
    }

    return signInWithEmailAndPassword(auth, email, password);
  };

  // ── Register: saves username to Firestore ───────────────────────────────────
  const register = async (email, password, username) => {
    // Check username not taken
    if (username) {
      const q = query(
        collection(db, "usernames"),
        where("username", "==", username.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("Username already taken. Please choose another.");
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Save display name
    if (username) {
      await updateProfile(cred.user, { displayName: username });
      // Save username → email mapping for login lookup
      await setDoc(doc(db, "usernames", cred.user.uid), {
        username: username.toLowerCase().trim(),
        displayName: username,
        email: email,
        uid: cred.user.uid,
        memberLevel: "member",
      });
    }

    return cred;
  };

  const loginGuest = async () => {
    const cred = await signInAnonymously(auth);
    // Write a minimal usernames record for guests
    await setDoc(doc(db, "usernames", cred.user.uid), {
      uid: cred.user.uid,
      username: `guest_${cred.user.uid.slice(0, 6)}`,
      displayName: "Guest",
      email: "",
      memberLevel: "guest",
    }, { merge: true });
    return cred;
  };

  const loginGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUsernameRecord(cred.user);
      return cred;
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  };

  // GIS-based login for iOS PWA — no popup/redirect, uses Google's iframe flow
  const loginGoogleGIS = (buttonContainer) => new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.startsWith("REPLACE_")) {
      reject(new Error("Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env.local"));
      return;
    }

    const init = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const firebaseCred = GoogleAuthProvider.credential(credential);
            const result = await signInWithCredential(auth, firebaseCred);
            await syncUsernameRecord(result.user);
            resolve(result);
          } catch (e) { reject(e); }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(buttonContainer, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        logo_alignment: "left",
        text: "continue_with",
        width: buttonContainer.offsetWidth || 320,
      });
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
      document.head.appendChild(script);
    }
  });
  const updateUsername = async (newUsername) => {
    const trimmed = newUsername.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      throw new Error("Username must be 3-20 characters (letters, numbers, underscore only).");
    }
    // Check not taken by someone else
    const q = query(
      collection(db, "usernames"),
      where("username", "==", trimmed.toLowerCase())
    );
    const snap = await getDocs(q);
    const taken = snap.docs.find(d => d.id !== user.uid);
    if (taken) throw new Error("Username already taken. Please choose another.");

    // Update Firestore and Auth profile
    await setDoc(doc(db, "usernames", user.uid), {
      username: trimmed.toLowerCase(),
      displayName: trimmed,
    }, { merge: true });
    await updateProfile(user, { displayName: trimmed });
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    // Re-authenticate first
    const isGoogle = user.providerData.some(p => p.providerId === "google.com");
    if (isGoogle) {
      await reauthenticateWithPopup(user, googleProvider);
    } else {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }
    await firebaseUpdatePassword(user, newPassword);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, loginEmail, loginGoogle, loginGoogleGIS, loginGuest, register, logout, updateUsername, updateUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
