
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, LogIn, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      router.push('/dashboard');
      setIsLoading(false);
    }, 1000);
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
              The modern CRM for high-performance sales teams.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to manage your pipeline and leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium border-border hover:bg-accent transition-all"
                onClick={handleLogin}
                disabled={isLoading}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Secure single-user login
                  </span>
                </div>
              </div>
              <Button 
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Wait...' : 'Access Demo Dashboard'}
              </Button>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Manage Leads
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <LayoutDashboard className="h-4 w-4" />
              Real-time Analytics
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
