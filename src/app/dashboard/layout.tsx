
'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { TrendingUp, LayoutDashboard, Layers, Users, Calendar as CalendarIcon, Settings, BarChart3, Sparkles, LogOut, History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AIAssistant from '@/components/AIAssistant';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import OnboardingTour from '@/components/OnboardingTour';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const mobileNavItems = [
    { icon: LayoutDashboard, label: 'Dash', href: '/dashboard' },
    { icon: Layers, label: 'Pipe', href: '/dashboard/pipeline' },
    { icon: Users, label: 'Leads', href: '/dashboard/leads' },
    { icon: BarChart3, label: 'Stats', href: '/dashboard/analytics' },
    { icon: CalendarIcon, label: 'Plan', href: '/dashboard/calendar' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return null;

  return (
    <SidebarProvider className="dark">
      <OnboardingTour />
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none font-headline text-primary">SalesStream</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Partner View</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:flex" />
            <div className="md:hidden flex items-center gap-2">
               <TrendingUp className="h-6 w-6 text-primary" />
               <span className="font-bold text-lg font-headline">SalesStream</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden lg:flex gap-2 border-primary/20 text-xs h-9"
              onClick={() => setIsAiOpen(true)}
            >
              <Sparkles className="h-4 w-4 text-primary" /> Partner AI
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
              <History className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-2 h-10 hover:bg-muted/50 rounded-lg">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold leading-none">{user?.displayName || 'Partner'}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-1">Partner</span>
                  </div>
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.displayName?.[0] || 'P'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        <AIAssistant floating isOpenExternal={isAiOpen} onCloseExternal={() => setIsAiOpen(false)} />

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 z-40">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <div className={`p-1.5 rounded-lg transition-all ${pathname === item.href ? 'bg-primary text-white scale-110' : 'text-muted-foreground hover:text-primary'}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest ${pathname === item.href ? 'text-primary font-black' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          ))}
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-1">
             <div className={`p-1.5 rounded-lg ${pathname === '/dashboard/settings' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
               <Settings className="h-5 w-5" />
             </div>
             <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Sets</span>
          </Link>
        </nav>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
