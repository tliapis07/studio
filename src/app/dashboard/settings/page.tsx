
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Shield, 
  User, 
  Database, 
  Sparkles, 
  Users, 
  Download, 
  FileJson,
  Plus,
  Target,
  Info,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');

  const MOCK_REPS = [
    { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', quota: 150000 },
    { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', quota: 120000 },
    { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', quota: 200000 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">SalesStream Settings</h1>
        <p className="text-muted-foreground">Manage organizational structure, team quotas, and partner preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/30 p-1 border border-border/50 w-full md:w-fit justify-start h-11">
          <TabsTrigger value="profile" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Users className="h-4 w-4" /> Team</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Sparkles className="h-4 w-4" /> AI & Sync</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Database className="h-4 w-4" /> Data & UI</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border/50 w-fit">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{user?.displayName?.[0] || 'P'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{user?.displayName || 'Partner Name'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Display Name</Label><Input defaultValue={user?.displayName || ''} /></div>
                <div className="space-y-2"><Label>Organization</Label><Input defaultValue="SalesStream Global" /></div>
              </div>
              <Button className="h-11 font-black uppercase tracking-widest px-8">Update Identity</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Management</CardTitle>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Rep</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_REPS.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/50">
                   <div className="flex items-center gap-4">
                     <Avatar><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                     <div><p className="text-sm font-bold">{m.name}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{m.email}</p></div>
                   </div>
                   <div className="flex items-center gap-6">
                     <div className="text-right"><p className="text-[10px] text-muted-foreground uppercase font-black">Quota</p><p className="text-sm font-black text-primary">${(m.quota/1000).toFixed(0)}k</p></div>
                     <Button variant="ghost" size="sm" className="text-rose-500 font-bold uppercase text-[10px]">Archive</Button>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader><CardTitle>UI & Regional Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label>Interface Theme</Label>
                   <div className="flex gap-2">
                      <Button variant={theme === 'dark' ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => setTheme('dark')}><Moon className="h-4 w-4" /> Dark</Button>
                      <Button variant={theme === 'light' ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => setTheme('light')}><Sun className="h-4 w-4" /> Light</Button>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Timezone</Label>
                   <Select defaultValue="utc">
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                       <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                       <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10">
                 <div className="space-y-1">
                   <p className="text-sm font-bold">Email Notifications</p>
                   <p className="text-xs text-muted-foreground">Receive daily team summary reports.</p>
                 </div>
                 <Switch defaultChecked />
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
