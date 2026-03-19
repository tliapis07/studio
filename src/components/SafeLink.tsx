'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SafeLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  fallbackTimeout?: number;
}

/**
 * SafeLink: A high-reliability navigation component.
 * Prevents "frozen" navigation by falling back to window.location.href 
 * if the Next.js router stalls or a chunk mismatch occurs.
 */
export function SafeLink({ 
  children, 
  className, 
  href, 
  fallbackTimeout = 2500, 
  ...props 
}: SafeLinkProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept standard left clicks without modifiers
    if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

    // Prevent double-clicks
    if (isNavigating) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);
    
    // Watchdog timer: If this component is still mounted after timeout, 
    // it means the SPA navigation likely stalled.
    timeoutRef.current = setTimeout(() => {
      console.warn('[SafeLink] Navigation watchdog fired. Falling back to hard reload:', href);
      window.location.href = href.toString();
    }, fallbackTimeout);

    // Let Next.js attempt client navigation. 
    // If it succeeds, the new page mounts and this component unmounts, clearing the timer.
  };

  return (
    <Link 
      href={href} 
      className={cn(className, isNavigating && "opacity-70 cursor-wait pointer-events-none")} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
