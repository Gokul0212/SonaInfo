// Firebase Client SDK Configuration & Initialization for SonaInfo
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// In browser / SvelteKit client side, env vars can come from import.meta.env
// We provide fallback dummy config if not populated yet so app loads gracefully in offline / demo mode
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-demo-sonainfo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sonainfo-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sonainfo-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sonainfo-portal.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef12345678"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
