'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isNavigating) {
      timeoutId = setTimeout(() => {
        console.warn('[SafeLink] Navigation timeout. Forcing hard reload to:', href);
        window.location.href = href.toString();
      }, fallbackTimeout);
    }

    return () => clearTimeout(timeoutId);
  }, [isNavigating, href, fallbackTimeout]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept standard left clicks without modifiers
    if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

    // Prevent double-clicks
    if (isNavigating) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);
    
    // Note: We don't preventDefault here to let Next.js try standard client navigation first.
    // If it succeeds, this component unmounts and the effect clears.
    // If it hangs, our effect fires the hard redirect.
  };

  return (
    <Link 
      href={href} 
      className={cn(className, isNavigating && "opacity-70 cursor-wait")} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
