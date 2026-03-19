'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * DeploymentGuard: Monitors for runtime errors caused by stale builds.
 * If a ChunkLoadError occurs (usually after a new deployment), 
 * it forces a hard reload to sync the client with the latest server assets.
 */
export function DeploymentGuard() {
  useEffect(() => {
    const handleError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const message = 'reason' in e ? e.reason?.message : e.message;
      
      // Check for common Next.js/Webpack chunk failure signatures
      const isChunkError = 
        /Loading chunk .* failed/.test(message) || 
        /Loading CSS chunk .* failed/.test(message) ||
        /Unexpected token '<'/.test(message); // Often happens when a JS chunk returns the index.html fallback

      if (isChunkError) {
        console.error('[DeploymentGuard] Stale build detected. Synchronizing application...');
        
        toast({
          title: "System Update",
          description: "A newer version of SalesStream is available. Syncing now...",
        });

        // Small delay to allow toast visibility
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
