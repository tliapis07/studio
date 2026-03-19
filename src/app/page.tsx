'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, LogIn, Loader2, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';
import { useAuth, useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (mounted && !isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, mounted]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast({
          title: "Access Granted",
          description: `Welcome back, ${result.user.displayName || 'Partner'}.`,
        });
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Google Sign-in Error:", err);
      let message = "Could not establish a secure session.";
      if (err.code === 'auth/popup-closed-by-user') {
        message = "Sign-in popup was closed before completion.";
      } else if (err.code === 'auth/popup-blocked') {
        message = "Popup blocked! Please allow popups for this site.";
      } else if (err.code === 'auth/unauthorized-domain') {
        message = "Domain not authorized. Check Firebase Authorized Domains.";
      }
      toast({ variant: "destructive", title: "Authentication Failed", description: message });
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      toast({
        title: "Guest Access",
        description: "Welcome! Browsing as an organizational guest.",
      });
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Anonymous Sign-in Error:", err);
      toast({
        variant: "destructive",
        title: "Demo Access Failed",
        description: "Anonymous access is disabled or blocked.",
      });
      setIsLoading(false);
    }
  };

  if (!mounted || (isUserLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background dark">
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tighter text-primary flex items-center justify-center md:justify-start gap-3 font-headline">
              <TrendingUp className="h-10 w-10" />
              SalesStream
            </h1>
            <p className="text-muted-foreground text-xl font-medium leading-tight">
              High-performance partner portal for organizational sales management.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2">
            <CardHeader className="space-y-2 text-center pt-10 pb-6">
              <CardTitle className="text-3xl font-black font-headline">Partner Access</CardTitle>
              <CardDescription className="text-base">
                Secure management gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 px-10 pb-10">
              <Button 
                className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 gap-4 rounded-2xl group"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <svg className="h-8 w-8 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Sign in with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-border" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase font-black tracking-[0.2em]">
                  <span className="bg-[#1a1c23] px-4 text-muted-foreground">
                    Management Entry
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-14 text-sm font-bold border-2 border-primary/20 hover:bg-primary/5 transition-all rounded-xl"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Continue as Guest Manager
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-10 pt-4 opacity-70">
            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-primary">
              <Users className="h-5 w-5" /> Team Management
            </div>
            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-accent">
              <ShieldCheck className="h-5 w-5" /> Partner Access
            </div>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/20" />
        <div className="m-auto relative z-10 w-4/5 aspect-video rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border-4 border-white/5 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-1000 ease-out">
           <Image 
            src="https://picsum.photos/seed/crm1/1200/800" 
            fill 
            className="object-cover scale-105" 
            alt="CRM Dashboard Preview"
            data-ai-hint="office business"
          />
        </div>
      </div>
    </div>
  );
}
