'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Trash2, 
  FileJson,
  Plus,
  Mail,
  Zap,
  Briefcase,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  const handleExport = (format: string) => {
    toast({ title: "Partner Export Initiated", description: `Compiling full organizational records into ${format} format...` });
    setTimeout(() => {
      toast({ title: "Export Ready", description: "Download link sent to your partner email." });
    }, 2000);
  };

  const MOCK_REPS = [
    { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', quota: 150000 },
    { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', quota: 120000 },
    { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', quota: 200000 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Partner Settings</h1>
        <p className="text-muted-foreground">Manage organizational structure, team quotas, and partner preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/30 p-1 border border-border/50 w-full md:w-fit justify-start h-11">
          <TabsTrigger value="profile" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><User className="h-4 w-4" /> Partner Profile</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Users className="h-4 w-4" /> Team Management</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Sparkles className="h-4 w-4" /> Team AI & Sync</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-6 h-9 font-bold text-xs uppercase tracking-widest"><Database className="h-4 w-4" /> Team Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Partner Information</CardTitle>
              <CardDescription>Your public and private organizational identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border/50 w-fit">
                <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-2xl">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{user?.displayName?.[0] || 'P'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{user?.displayName || 'Partner Name'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest mt-2 border-primary/20">Change Photo</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" defaultValue={user?.displayName || ''} className="bg-background/50 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" defaultValue="SalesStream Global" className="bg-background/50 h-11" />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 mt-2 font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20 h-11">Update Partner Identity</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Representatives</CardTitle>
                <CardDescription>Manage your sales team, set monthly targets, and track rep health.</CardDescription>
              </div>
              <Button className="bg-primary gap-2 h-9 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_REPS.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/50 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="font-bold">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Monthly Quota</p>
                      <p className="text-sm font-black text-primary">${(member.quota / 1000).toFixed(0)}k</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 font-bold uppercase text-[10px] tracking-widest">Archive</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Team AI & Intelligence Hub</CardTitle>
              <CardDescription>Global configuration for predictive analytics and management assistants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Predictive Team Scoring
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Calculate close probability across all rep pipelines using team history.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/10">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> Manager Copilot Integration
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Enable high-level strategy recommendations for organizational bottlenecks.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-card/50 border-border/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-lg">Team Data Export Center</CardTitle>
              <CardDescription>Bulk export organizational records for external reporting.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col gap-2 border-border/50 hover:bg-primary/5 group" onClick={() => handleExport('CSV')}>
                     <Download className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Team Performance (CSV)</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2 border-border/50 hover:bg-accent/5 group" onClick={() => handleExport('JSON')}>
                     <FileJson className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest) JSON Archive</span>
                  </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}