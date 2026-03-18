'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Settings, 
  Layers,
  GraduationCap
} from 'lucide-react';
import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Pipeline', url: '/dashboard/pipeline', icon: Layers },
  { title: 'Leads', url: '/dashboard/leads', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarIcon },
  { title: 'Training Materials', url: '/dashboard/training', icon: GraduationCap },
];

const secondaryItems = [
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel>System</SidebarGroupLabel>
        <SidebarMenu>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
