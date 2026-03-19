import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "salesstream-crm.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "salesstream-crm",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "salesstream-crm.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize analytics safely for SSR/Static Export
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

/**
 * Log a custom event to Firebase Analytics
 */
export async function logEvent(name: string, params: Record<string, any> = {}) {
  try {
    const a = await analytics;
    if (a) {
      const { logEvent: firebaseLogEvent } = await import('firebase/analytics');
      firebaseLogEvent(a, name, params);
    }
  } catch (err) {
    console.error("Analytics Error:", err);
  }
}
