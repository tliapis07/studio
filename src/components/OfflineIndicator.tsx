'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 3000);
      toast({
        title: "Connection Restored",
        description: "Organizational data is being synchronized.",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "Working Offline",
        description: "Local changes will persist and sync on reconnect.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !isSyncing) return null;

  return (
    <div 
      id="offline-indicator"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className={`px-6 py-2.5 rounded-full shadow-3xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] border-2 backdrop-blur-md transition-colors ${
        isOffline ? 'bg-rose-500 text-white border-rose-400/50' : 'bg-emerald-500 text-white border-emerald-400/50'
      }`}>
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sync Paused: Working Offline</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Resyncing Data...</span>
          </>
        )}
      </div>
    </div>
  );
}
