'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { TrendingUp, Settings, LogOut, History, Bell, Sparkles, X, Contact as ContactIcon, PanelLeftClose, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import OfflineIndicator from '@/components/OfflineIndicator';

// Performance Optimization: Lazy-load heavy organizational assistant and onboarding
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), { ssr: false });
const OnboardingTour = dynamic(() => import('@/components/OnboardingTour'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/');
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Establishing Partner Session...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider className="dark">
      <OnboardingTour />
      <OfflineIndicator />
      <Sidebar variant="inset" collapsible="icon" className="border-r border-border/50">
        <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-black text-sm leading-none font-headline text-primary tracking-tight">SalesStream</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Partner Portal</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col">
          <div className="flex-1">
            <NavMain />
          </div>
          <div className="px-4 pb-4">
             <SidebarTrigger className="w-full justify-start gap-3 h-10 px-3 hover:bg-muted/50 rounded-lg text-muted-foreground border-t border-border/20 pt-4 mt-4">
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">Minimize Hub</span>
             </SidebarTrigger>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:flex" />
            <div className="md:hidden flex items-center gap-2">
               <TrendingUp className="h-6 w-6 text-primary" />
               <span className="font-black text-lg tracking-tighter">SalesStream</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden lg:flex gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-sm"
              onClick={() => setIsAiOpen(true)}
            >
              <Sparkles className="h-4 w-4 text-primary" /> Partner AI
            </Button>

            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground relative" onClick={() => setIsNotificationsOpen(true)}>
              <Bell className="h-4 w-4" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-background" />
            </Button>

            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => setIsHistoryOpen(true)}>
              <History className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-2 h-10 hover:bg-muted/50 rounded-xl transition-all">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-black leading-none">{user?.displayName || 'Partner'}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-1">Lead Partner</span>
                  </div>
                  <Avatar className="h-8 w-8 border-2 border-border shadow-sm">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">{user?.displayName?.[0] || 'P'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-2">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Account Space</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/dashboard/settings" className="cursor-pointer font-bold"><Settings className="h-4 w-4 mr-2" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 cursor-pointer font-bold rounded-lg">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${isAiOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-[380px] h-[600px] shadow-3xl rounded-3xl overflow-hidden border-2 border-primary/30 bg-background/95 backdrop-blur-2xl">
             <AIAssistant floating isOpenExternal={isAiOpen} onCloseExternal={() => setIsAiOpen(false)} />
          </div>
        </div>
        
        {!isAiOpen && (
          <Button 
            id="ai-assistant-trigger"
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl shadow-3xl bg-primary hover:bg-primary/90 transition-all hover:scale-110 z-40 group"
          >
            <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
          </Button>
        )}

        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[500px] rounded-l-3xl border-l-2 p-8">
            <SheetHeader><SheetTitle className="flex items-center gap-3 text-2xl font-black"><History className="h-6 w-6 text-primary" /> Team Activity Feed</SheetTitle></SheetHeader>
            <ScrollArea className="h-full mt-8 pr-4">
              <div className="space-y-6">
                {[
                  { u: "Alex", a: "Assigned lead 'Acme' to Jordan", t: "2m ago" },
                  { u: "Sarah", a: "Updated status for 'Tesla' to Proposal", t: "15m ago" },
                  { u: "Jordan", a: "Logged Call with 'Stark Ind'", t: "45m ago" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-5 rounded-2xl bg-muted/20 border-2 border-border/50 hover:border-primary/20 transition-all">
                    <Avatar className="h-9 w-9 border-2 border-primary/10"><AvatarFallback className="font-black text-[10px]">{item.u[0]}</AvatarFallback></Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-black">{item.u} <span className="font-medium text-muted-foreground">{item.a}</span></p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">{item.t}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-2xl border-t border-border/50 flex items-center justify-around px-4 z-40">
           {[
              { icon: TrendingUp, href: '/dashboard' },
              { icon: ContactIcon, href: '/dashboard/contacts' },
              { icon: Settings, href: '/dashboard/settings' },
           ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
              <div className={`p-2 rounded-xl transition-all ${pathname === item.href ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-primary'}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </nav>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
