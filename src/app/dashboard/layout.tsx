
'use client';

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { TrendingUp, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="dark">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none font-headline">SalesStream</span>
            <span className="text-[10px] text-muted-foreground">Premium CRM</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/50">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">Alex Morgan</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Pro Account</span>
            </div>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="https://picsum.photos/seed/av1/100/100" />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
