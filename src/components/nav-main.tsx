'use client';

import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Settings, 
  Layers,
  GraduationCap,
  History,
  Contact as ContactIcon,
  StickyNote
} from 'lucide-react';
import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { SafeLink } from '@/components/SafeLink';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, critical: true },
  { title: 'Pipeline', url: '/dashboard/pipeline', icon: Layers, critical: true },
  { title: 'Leads', url: '/dashboard/leads', icon: Users, critical: true },
  { title: 'Contacts', url: '/dashboard/contacts', icon: ContactIcon, critical: false },
  { title: 'Notes', url: '/dashboard/notes', icon: StickyNote, critical: false },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3, critical: false },
  { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarIcon, critical: false },
  { title: 'Team History', url: '/dashboard/team-history', icon: History, critical: false },
  { title: 'Training Hub', url: '/dashboard/training', icon: GraduationCap, critical: false },
];

const secondaryItems = [
  { title: 'Settings', url: '/dashboard/settings', icon: Settings, critical: false },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">Organization Control</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <SafeLink 
                  href={item.url} 
                  prefetch={item.critical ? undefined : false}
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm font-bold">{item.title}</span>
                </SafeLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">System</SidebarGroupLabel>
        <SidebarMenu>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <SafeLink href={item.url} prefetch={false}>
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm font-bold">{item.title}</span>
                </SafeLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
