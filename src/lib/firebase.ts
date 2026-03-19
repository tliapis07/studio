import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase using the unified config from the studio
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize analytics safely for SSR/Static Export
// Note: Analytics requires a valid measurementId in the config to work.
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
    // Fail silently in development or if blocked
    console.debug("Analytics suppressed:", name);
  }
}
