'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  brandColor: string;
  setBrandColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [brandColorState, setBrandColorState] = useState<string>('248 81% 59%');
  const { user } = useUser();
  const db = useFirestore();

  // STABLE REFERENCE: Memoize profile reference to prevent infinite subscription loops
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc<UserProfile>(profileRef);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
  }, []);

  useEffect(() => {
    if (profile?.theme && profile.theme !== 'system') {
      setThemeState(profile.theme as Theme);
    }
    if (profile?.brandColor) {
      setBrandColorState(profile.brandColor);
    }
  }, [profile]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (brandColorState) {
      root.style.setProperty('--primary', brandColorState);
      root.style.setProperty('--ring', brandColorState);
      root.style.setProperty('--sidebar-primary', brandColorState);
      root.style.setProperty('--sidebar-ring', brandColorState);
    }
  }, [brandColorState]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), { theme: newTheme }, { merge: true });
    }
  };

  const setBrandColor = (color: string) => {
    setBrandColorState(color);
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), { brandColor: color }, { merge: true });
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, brandColor: brandColorState, setBrandColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
