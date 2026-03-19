'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { TrendingUp, Sparkles, ShieldCheck, Zap, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * OnboardingTour
 * A high-performance, native-feeling onboarding system using ShadCN Dialog.
 * Replaces react-joyride to ensure compatibility with React 19 / Next.js 15.
 */

const STEPS = [
  {
    title: "Welcome to SalesStream",
    description: "Your high-performance partner portal is ready. Let's take a 30-second tour of your new organizational command center.",
    icon: TrendingUp,
    color: "text-primary"
  },
  {
    title: "Unified Pipeline",
    description: "Manage every lead from ingestion to close. Use the visual Pipeline tab to drag and drop deals across organizational stages.",
    icon: Zap,
    color: "text-amber-500"
  },
  {
    title: "Partner AI Assistant",
    description: "Your AI strategist is always available. Generate scripts, summarize leads, or dictate tasks using the floating action button.",
    icon: Sparkles,
    color: "text-accent"
  },
  {
    title: "Offline Resilience",
    description: "Connectivity issues? No problem. SalesStream persists your data locally and synchronizes automatically when you're back online.",
    icon: ShieldCheck,
    color: "text-emerald-500"
  }
];

const OnboardingTour = () => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check local storage to prevent repeating the tour
    const hasSeen = localStorage.getItem('hasSeenTourV2');
    if (!hasSeen && user) {
      // Delay launch for smooth entry after auth redirect
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleComplete = () => {
    localStorage.setItem('hasSeenTourV2', 'true');
    setOpen(false);
  };

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const CurrentIcon = STEPS[step].icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
        <div className="p-8 space-y-8">
          <div className="flex justify-center pt-4">
            <div className={`h-24 w-24 rounded-3xl bg-muted/20 border-2 border-border/50 flex items-center justify-center shadow-inner`}>
              <CurrentIcon className={`h-12 w-12 ${STEPS[step].color} animate-in zoom-in duration-500`} />
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <DialogTitle className="text-2xl font-black font-headline tracking-tight">
              {STEPS[step].title}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed px-4 text-muted-foreground">
              {STEPS[step].description}
            </DialogDescription>
          </div>

          <div className="flex justify-center gap-1.5 pt-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-1.5 bg-muted'}`} />
            ))}
          </div>
        </div>

        <DialogFooter className="p-8 bg-muted/10 border-t-2 border-border/50 flex flex-row items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={prev} 
            disabled={step === 0}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          
          {step === STEPS.length - 1 ? (
            <Button 
              onClick={handleComplete}
              className="rounded-xl bg-primary shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-8"
            >
              Start Selling
            </Button>
          ) : (
            <Button 
              onClick={next}
              className="rounded-xl bg-primary shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-8"
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
