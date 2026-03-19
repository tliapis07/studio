'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * useSafeNavigation: A hook for programmatic navigation with a failsafe watchdog.
 * Prevents UI freezes when router.push fails silently.
 */
export function useSafeNavigation() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const safePush = useCallback((href: string, timeout = 2500) => {
    if (isNavigating) return;

    setIsNavigating(true);
    console.log(`[SafeNav] Navigating to: ${href}`);

    const watchdog = setTimeout(() => {
      console.warn('[SafeNav] Navigation stalled. Executing hard fallback.');
      toast({
        title: "Navigation Stalled",
        description: "Synchronizing with server for reliability...",
      });
      window.location.href = href;
    }, timeout);

    try {
      router.push(href);
    } catch (err) {
      console.error('[SafeNav] Router push failed immediately:', err);
      clearTimeout(watchdog);
      window.location.href = href;
    }
  }, [router, isNavigating]);

  return { safePush, isNavigating };
}
