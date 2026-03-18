'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, LogIn, TrendingUp, Users, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Actually sign in to Firebase so the 'auth' context is not null in the dashboard
      await signInAnonymously(auth);
      router.push('/dashboard');
      toast({
        title: "Access Granted",
        description: "Welcome to the SalesStream Management Portal.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Could not establish a secure session.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background dark">
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2 font-headline">
              <TrendingUp className="h-8 w-8" />
              SalesStream
            </h1>
            <p className="text-muted-foreground text-lg">
              The modern CRM for high-performance sales management.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-headline">Partner Access</CardTitle>
              <CardDescription>
                Secure portal for managing your team and pipeline velocity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium border-primary/20 hover:bg-primary/5 transition-all"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                {isLoading ? 'Establishing Session...' : 'Sign in as Manager'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-background px-2 text-muted-foreground">
                    Secure Management Access
                  </span>
                </div>
              </div>
              <Button 
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Accessing Systems...' : 'Access Management Dashboard'}
              </Button>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              <Users className="h-4 w-4 text-primary" />
              Team Oversight
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              <LayoutDashboard className="h-4 w-4 text-accent" />
              Direct Diagnostics
            </div>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="m-auto relative z-10 w-4/5 aspect-video rounded-xl shadow-2xl border border-white/10 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700">
           <Image 
            src="https://picsum.photos/seed/crm1/1200/800" 
            fill 
            className="object-cover" 
            alt="CRM Dashboard Preview"
            data-ai-hint="office sales"
          />
        </div>
      </div>
    </div>
  );
}