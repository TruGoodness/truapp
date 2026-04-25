import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCW7f5X93PGq_9sSTS7mKO2_h7zgYEQqbo",
  authDomain: "tru-goodness-app.firebaseapp.com",
  projectId: "tru-goodness-app",
  storageBucket: "tru-goodness-app.firebasestorage.app",
  messagingSenderId: "323360346747",
  appId: "1:323360346747:web:39f3a9dc1a4e0c662b48de"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Simple helpers that mirror old storage API
export async function dbGet(key) {
  try {
    const snap = await getDoc(doc(db, 'appdata', key));
    return snap.exists() ? snap.data().value : null;
  } catch { return null; }
}

export async function dbSet(key, val) {
  try {
    await setDoc(doc(db, 'appdata', key), { value: val });
  } catch(e) { console.error('dbSet error:', e); }
}

export { doc, getDoc, setDoc, collection, addDoc, onSnapshot, deleteDoc, query, orderBy, signInWithEmailAndPassword, signOut, onAuthStateChanged };
