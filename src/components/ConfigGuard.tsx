'use client';

import { useEffect } from 'react';
import { firebaseConfig } from '@/firebase/config';

/**
 * ConfigGuard checks for vital Firebase configuration at runtime.
 * This helps developers identify missing environment variables early.
 */
export function ConfigGuard() {
  useEffect(() => {
    // Check if the mandatory apiKey is missing or placeholder
    const isMissingConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('Dummy');
    
    if (isMissingConfig && process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SalesStream: Firebase configuration is missing or invalid. ' +
        'Authentication and Analytics features may fail. ' +
        'Check your src/firebase/config.ts or .env.local file.'
      );
    }
  }, []);

  return null;
}
