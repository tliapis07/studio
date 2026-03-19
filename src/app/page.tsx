'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2, ShieldCheck, Users, AlertCircle, Mail, ArrowLeft, Lock } from 'lucide-react';
import Image from 'next/image';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  browserLocalPersistence, 
  setPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthMode = 'initial' | 'email-login' | 'email-signup' | 'verify-email';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && user) {
      if (user.emailVerified || user.isAnonymous || !user.email) {
        router.replace('/dashboard');
      } else {
        setAuthMode('verify-email');
      }
    }
  }, [user, isUserLoading, router, mounted]);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setIsLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        toast({ title: "Sign-in Cancelled", description: "The window was closed before completion." });
      } else if (err.code === 'auth/popup-blocked') {
        toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups for this site." });
      } else {
        toast({ variant: "destructive", title: "Authentication Failed", description: err.message });
      }
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (authMode === 'email-signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setAuthMode('verify-email');
        toast({ title: "Verification Sent", description: "Please check your inbox to activate your account." });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setAuthMode('verify-email');
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Auth Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);
    } catch (err: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Demo Access Failed" });
    }
  };

  if (!mounted) return null;

  if (isLoading || (isUserLoading && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark p-8">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
            <TrendingUp className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-headline tracking-tight uppercase">Synchronizing Portal</h2>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Secure Connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authMode === 'verify-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark p-8">
        <Card className="max-w-md w-full border-2 rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="text-center pt-10 pb-6 space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-black">Verify Your Identity</CardTitle>
            <CardDescription className="text-sm font-medium">
              We've sent an activation link to <span className="text-primary font-bold">{user?.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-10 pb-10">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Check your inbox (and spam folder) to complete your partner registration. You will be redirected once verified.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full h-12 font-black uppercase tracking-widest rounded-xl">I've Verified My Email</Button>
              <Button variant="ghost" onClick={() => auth.signOut().then(() => setAuthMode('initial'))} className="text-[10px] font-black uppercase tracking-widest">Use Different Account</Button>
            </div>
          </CardContent>
        </Card>
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
              The high-performance partner portal for organizational telesales.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2">
            <CardHeader className="space-y-2 text-center pt-10 pb-6">
              <CardTitle className="text-3xl font-black font-headline">
                {authMode === 'initial' ? 'Partner Access' : authMode === 'email-login' ? 'Email Login' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-base">Secure management gateway.</CardDescription>
            </CardHeader>
            
            <CardContent className="grid gap-6 px-10 pb-10">
              {authMode === 'initial' ? (
                <div className="space-y-4">
                  <Button 
                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 gap-4 rounded-2xl group"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Workspace
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full h-14 text-sm font-bold border-2 border-primary/20 hover:bg-primary/5 rounded-xl gap-3"
                    onClick={() => setAuthMode('email-login')}
                  >
                    <Mail className="h-5 w-5" /> Sign in with Email
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest pt-2">
                    <AlertCircle className="h-3 w-3" />
                    <span>Allow popups for Google Workspace</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Email Address</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl" placeholder="partner@stream.io" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Password</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl" placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest rounded-xl shadow-lg">
                    {authMode === 'email-login' ? 'Sign In' : 'Create Partner Account'}
                  </Button>
                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAuthMode('initial')} className="gap-2 text-[10px] font-black uppercase">
                      <ArrowLeft className="h-3 w-3" /> Back
                    </Button>
                    <Button type="button" variant="link" size="sm" onClick={() => setAuthMode(authMode === 'email-login' ? 'email-signup' : 'email-login')} className="text-[10px] font-black uppercase">
                      {authMode === 'email-login' ? 'Need an account?' : 'Already registered?'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t-2 border-border" /></div>
                <div className="relative flex justify-center text-[11px] uppercase font-black tracking-[0.2em]"><span className="bg-background px-4 text-muted-foreground">Or</span></div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 text-sm font-bold border-2 border-primary/20 hover:bg-primary/5 transition-all rounded-xl"
                onClick={handleDemoLogin}
              >
                Continue as Guest Manager
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-10 pt-4 opacity-70">
            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-primary">
              <Users className="h-5 w-5" /> Team Management
            </div>
            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-accent">
              <ShieldCheck className="h-5 w-5" /> Verified Partner
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
            priority
            data-ai-hint="office business"
          />
        </div>
      </div>
    </div>
  );
}
