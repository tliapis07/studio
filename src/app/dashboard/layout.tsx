
'use client';

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { TrendingUp, User, LayoutDashboard, Layers, Users, Calendar as CalendarIcon, Settings, BarChart3, Plus, Sparkles, MessageSquare, Mic, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AIAssistant from '@/components/AIAssistant';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { processCRMTask } from '@/ai/flows/process-crm-task';
import { toast } from '@/hooks/use-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiTaskInput, setAiTaskInput] = useState('');
  const [isProcessingTask, setIsProcessingTask] = useState(false);

  const mobileNavItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: Layers, label: 'Pipeline', href: '/dashboard/pipeline' },
    { icon: Users, label: 'Leads', href: '/dashboard/leads' },
    { icon: CalendarIcon, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  ];

  const handleAiTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTaskInput.trim()) return;
    
    setIsProcessingTask(true);
    try {
      const result = await processCRMTask({ command: aiTaskInput });
      toast({
        title: "AI Action Identified",
        description: result.confirmationMessage,
      });
      setAiTaskInput('');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not interpret command."
      });
    } finally {
      setIsProcessingTask(false);
    }
  };

  return (
    <SidebarProvider className="dark">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none font-headline text-primary">SalesStream</span>
            <span className="text-[10px] text-muted-foreground">Premium CRM</span>
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
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">Alex Morgan</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Pro Account</span>
            </div>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="https://picsum.photos/seed/av1/100/100" />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 flex flex-col gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 p-4 bg-card/90 backdrop-blur-xl border-primary/20 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Quick AI Task
                </h4>
                <form onSubmit={handleAiTaskSubmit} className="flex gap-2">
                  <Input 
                    placeholder="e.g. 'Add lead Sarah from Acme'" 
                    className="text-xs bg-background/50 h-9"
                    value={aiTaskInput}
                    onChange={(e) => setAiTaskInput(e.target.value)}
                    disabled={isProcessingTask}
                  />
                  <Button size="icon" type="submit" className="h-9 w-9 shrink-0" disabled={isProcessingTask}>
                    {isProcessingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
              <div className="flex flex-col gap-1 border-t border-border/50 pt-2">
                <Button variant="ghost" className="justify-start gap-2 h-9 text-xs">
                  <Users className="h-4 w-4 text-primary" /> New Lead
                </Button>
                <Button variant="ghost" className="justify-start gap-2 h-9 text-xs">
                  <MessageSquare className="h-4 w-4 text-accent" /> Log Activity
                </Button>
                <Button variant="ghost" className="justify-start gap-2 h-9 text-xs">
                  <CalendarIcon className="h-4 w-4 text-purple-500" /> Event
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <AIAssistant floating />
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 z-40">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
              <div className={`p-2 rounded-xl transition-all ${pathname === item.href ? 'bg-primary text-white scale-110' : 'text-muted-foreground hover:text-primary'}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          ))}
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-1">
             <div className={`p-2 rounded-xl ${pathname === '/dashboard/settings' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
               <Settings className="h-5 w-5" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settings</span>
          </Link>
        </nav>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
