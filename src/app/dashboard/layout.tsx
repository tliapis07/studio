'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { TrendingUp, Settings, LogOut, History, Bell, Sparkles, X } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import OfflineIndicator from '@/components/OfflineIndicator';

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
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return null;

  return (
    <SidebarProvider className="dark">
      <OnboardingTour />
      <OfflineIndicator />
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

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground relative"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-background" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground"
              onClick={() => setIsHistoryOpen(true)}
            >
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

        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${isAiOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-[380px] shadow-2xl rounded-3xl overflow-hidden border-2 border-primary/20 bg-background">
             <AIAssistant floating isOpenExternal={isAiOpen} onCloseExternal={() => setIsAiOpen(false)} />
          </div>
        </div>
        
        {!isAiOpen && (
          <Button 
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-110 z-40 group"
          >
            <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
          </Button>
        )}

        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Team History Log
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full mt-6 pr-4">
              <div className="space-y-6">
                {[
                  { user: "Alex", action: "Assigned lead 'Tesla' to Jordan", time: "2m ago" },
                  { user: "Sarah", action: "Updated status for 'Acme Corp' to Proposal", time: "15m ago" },
                  { user: "Jordan", action: "Logged Discovery Call with 'Stark Ind'", time: "45m ago" },
                  { user: "Alex", action: "Created new team event 'Q2 Strategy'", time: "2h ago" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-muted/20 border border-border/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{item.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{item.user} <span className="font-medium text-muted-foreground">{item.action}</span></p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <SheetContent side="right" className="w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Partner Notifications
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full mt-6">
              <div className="space-y-4">
                {[
                  { title: "Follow-up Due: Sarah Jenkins", desc: "Automated reminder for Acme Corp engagement.", type: "warning" },
                  { title: "Team Quota Milestone", desc: "Team hit 85% of monthly target!", type: "success" },
                  { title: "Lead Response Needed", desc: "Stark Ind has been in 'Qualified' for 5 days.", type: "warning" },
                ].map((n, i) => (
                  <div key={i} className={`p-4 rounded-xl border-2 ${n.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : n.type === 'warning' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-primary/5 border-primary/20'}`}>
                    <p className="text-sm font-black">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{n.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 z-40">
           {[
              { icon: TrendingUp, href: '/dashboard' },
              { icon: ContactIcon, href: '/dashboard/contacts' },
              { icon: Settings, href: '/dashboard/settings' },
           ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <div className={`p-1.5 rounded-lg transition-all ${pathname === item.href ? 'bg-primary text-white scale-110' : 'text-muted-foreground hover:text-primary'}`}>
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
